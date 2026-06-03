# Discord Agent Hub Design

Discord를 원격 명령 접수처로 두고, Kotlin/Spring 백엔드가 작업 상태와 권한을 소유하며, Codex와 도메인별 봇은 `AgentExecutor` 어댑터 뒤에서 실행한다.

## Product Intent

- Discord에서 `@{bot-name} {command}` 형태로 일을 접수한다.
- 오래 걸리는 작업은 즉시 접수 응답을 보내고, Discord thread에 중간 상태를 계속 남긴다.
- 문서 정리, Codex 작업, 서버 모니터링, 스케줄러 작업을 같은 작업 모델로 관리한다.
- 결과는 Discord에 보고하고, 필요한 경우 GitHub branch/commit/PR로 반영한다.
- AI나 Codex가 DB, GitHub, Kubernetes를 직접 수정하지 않는다. 백엔드가 검증된 operation만 적용한다.

## Non-Goals For V1

- Spring AI를 코어 의존성으로 두지 않는다.
- 여러 Discord bot process를 먼저 만들지 않는다. 하나의 Discord application이 내부 persona를 라우팅한다.
- Codex app-server를 외부 브라우저나 Discord에서 직접 접근하게 하지 않는다.
- microk8s 관리 작업을 broad admin kubeconfig로 실행하지 않는다.

## Target Stack

- Kotlin 2.3.x
- Spring Boot 4.0.x
- PostgreSQL
- Redis optional: distributed lock, short-lived progress cache, rate limit, pub/sub가 필요해질 때만 사용
- Discord gateway/client library: 별도 평가 후 선택
- Codex integration: `codex app-server` 우선, `codex exec`는 diagnostic fallback

## High-Level Architecture

```text
Discord
  -> Discord Intake
  -> Command Router
  -> Task Orchestrator
  -> AgentExecutor
       - CodexAppServerAgentExecutor
       - DocumentAgentExecutor
       - YoutubeTranscriptAgentExecutor
       - GithubPublisherAgentExecutor
       - Microk8sMonitorAgentExecutor
       - SchedulerAgentExecutor
  -> PostgreSQL
  -> Redis optional
```

## Bot Personas

### Intake Bot

- Discord mention, slash command, scheduled trigger를 같은 `Task`로 변환한다.
- 원문 메시지, 요청자, 채널, thread, 첨부 URL, 권한 컨텍스트를 저장한다.
- 장기 작업이면 `queued` 또는 `running` 상태를 먼저 답장한다.

### Codex Bot

- repo 수정, 코드 조사, 테스트 실행, PR 작성 같은 작업을 담당한다.
- 내부 구현은 `AgentExecutor`이며, 기본 구현은 k8s의 Codex app-server에 연결한다.
- 위험 명령, GitHub push, 파일 대량 변경은 approval step을 거친다.

### Docs Bot

- URL, 텍스트, YouTube transcript를 받아 문서를 정리한다.
- 기술, 경제, 사회 이슈 등 topic profile을 별도 prompt/pipeline으로 둔다.
- 결과는 Markdown 문서와 knowledge graph node/edge로 저장한다.
- GitHub 반영은 자동 commit이 아니라 v1에서는 branch/PR 기본값으로 둔다.

### Ops Bot

- microk8s cluster 상태를 읽고 Discord에 요약한다.
- Kubernetes API, Prometheus, Alertmanager를 우선 사용한다.
- shell 기반 `kubectl`은 fallback으로만 둔다.
- read-only RBAC로 시작하고, 수정 작업은 별도 approval policy가 필요하다.

### Scheduler Bot

- 정기 요약, 문서 수집, 서버 상태 보고를 시작한다.
- 사용자 요청 없이 Discord thread/channel에 먼저 메시지를 보낼 수 있다.
- 모든 scheduled run도 `Task`와 `TaskEvent`로 기록한다.

## AgentExecutor

Spring AI 대신 아래 인터페이스가 실행 경계를 담당한다.

```kotlin
interface AgentExecutor {
    val type: AgentExecutorType

    suspend fun start(request: AgentRunRequest): AgentRunHandle

    fun events(runId: AgentRunId): Flow<AgentRunEvent>

    suspend fun approve(request: AgentApprovalRequest): AgentApprovalResult

    suspend fun cancel(runId: AgentRunId): AgentCancelResult
}
```

### Event Contract

Provider별 프로토콜은 application event로 변환한다.

```text
run.started
assistant.message.delta
tool.requested
approval.requested
operation.proposed
operation.applied
artifact.created
run.completed
run.cancelled
run.failed
```

Discord는 이 이벤트를 받아 thread 메시지로 변환한다. PostgreSQL에는 원본 provider event와 normalized event를 모두 남긴다.

## Codex App-Server On Kubernetes

기존 `trip-plan`의 `codex.yaml`과 `Dockerfile.codex` 방식은 이 프로젝트에도 활용 가능하다.

참조 구조:

- `node:22-bookworm-slim` 기반 이미지
- `@openai/codex` CLI를 npm global package로 설치
- `codex app-server --listen ws://0.0.0.0:8765` 실행
- `HOME=/ai-chat`, `CODEX_HOME=/ai-chat/.codex`
- `.codex`는 PVC로 보존
- Kubernetes `ClusterIP` service로 내부 노출
- readiness/liveness probe는 `/healthz`

이 프로젝트에서는 이 방식을 `CodexAppServerAgentExecutor`의 backend로 사용한다.

```text
Spring Orchestrator
  -> ws://discord-agent-codex:8765
  -> Codex app-server Pod
  -> workspace PVC / repo checkout / .codex PVC
```

### Recommended Shape

- Codex app-server는 namespace 내부 `ClusterIP`로만 노출한다.
- Discord 또는 외부 브라우저는 app-server에 직접 연결하지 않는다.
- Spring Orchestrator가 app-server URL, thread id, turn id, approval, cancel을 모두 소유한다.
- Codex credential은 `.codex` PVC나 Kubernetes Secret로만 주입한다.
- per-user/per-project isolation이 필요하면 shared Deployment보다 per-workspace Job/Deployment를 우선 검토한다.

### Deployment Modes

#### Shared Gateway

- 하나의 Codex app-server Deployment를 여러 task가 공유한다.
- 구현이 쉽고 비용이 낮다.
- thread/session id 매핑을 반드시 DB에 저장해야 한다.
- 동시에 무거운 작업이 많아지면 격리가 약하다.

#### Per Workspace Gateway

- workspace 또는 repo 단위로 Codex app-server Deployment를 띄운다.
- repo checkout, `.codex`, 작업 로그, artifact를 분리하기 쉽다.
- 운영 비용은 늘지만 안전하다.

#### Per Task Job

- 장기/위험 작업마다 Kubernetes Job을 만든다.
- 가장 강한 격리와 재현성을 제공한다.
- interactive thread resume과 실시간 event stream은 별도 설계가 필요하다.

v1 추천은 `Per Workspace Gateway`다. Discord Agent Hub는 repo/문서 vault/ops target별로 작업 경계가 나뉘므로 shared gateway보다 운영 사고 반경이 작다.

## Task Model

```text
Task
  id
  parent_task_id
  requester_discord_user_id
  bot_persona
  command_text
  status
  priority
  approval_policy
  created_at
  updated_at

TaskEvent
  task_id
  event_type
  provider_type
  payload_json
  discord_message_id
  created_at

AgentRun
  task_id
  executor_type
  provider_run_id
  provider_thread_id
  provider_turn_id
  workspace_ref
  status
```

## Document Graph Model

PostgreSQL로 시작한다.

```text
Source
  url, source_type, title, fetched_at, content_hash

Document
  source_id, topic_profile, markdown_path, summary, github_ref

KnowledgeNode
  type: topic | entity | concept | document
  name
  canonical_key

KnowledgeEdge
  from_node_id
  to_node_id
  relation_type
  evidence_document_id
  confidence
```

필요하면 `pgvector`를 추가해 유사 문서 검색을 붙인다. Neo4j는 탐색 기능이 실제로 병목이 된 뒤에 검토한다.

## Discord UX

### Mention Commands

```text
@docs-bot 이 유튜브 영상 정리해줘 https://...
@codex-bot 이 repo에서 failing test 원인 찾아줘
@ops-bot microk8s 상태 알려줘
```

### Long Running Work

```text
1. 접수됨: task id와 예상 단계 표시
2. 진행 중: 주요 event를 thread에 요약
3. 승인 필요: 버튼 또는 reply command로 승인
4. 완료: 결과 요약, artifact, GitHub PR 링크 표시
```

### Proactive Messages

- scheduled digest
- cluster health alert
- 문서 수집 결과
- 실패한 장기 작업 재시도 요청

## Security Rules

- Discord user, channel, guild 기준 allowlist를 둔다.
- bot persona마다 허용 command와 target workspace를 제한한다.
- Codex app-server는 내부 네트워크에만 둔다.
- GitHub token은 publisher worker만 접근한다.
- microk8s token은 read-only로 시작한다.
- 모든 file change, shell command, GitHub publish는 audit event로 저장한다.
- AI output은 제안일 뿐이며, 서버가 schema validation과 policy check 이후 적용한다.

## MVP Order

1. Discord intake와 `Task`/`TaskEvent` 저장
2. thread 기반 progress update
3. `AgentExecutor` 인터페이스와 fake executor
4. k8s Codex app-server executor 연결
5. URL/YouTube 문서 정리 executor
6. GitHub publisher executor
7. scheduler
8. microk8s read-only monitor
9. approval flow
10. per-workspace Codex gateway 자동 생성

## Open Questions

- Discord library는 JDA, Discord4J, Kord 중 어떤 것을 쓸지 결정해야 한다.
- Codex app-server protocol schema를 이 프로젝트에 vendor할지, 빌드 시 생성할지 결정해야 한다.
- `.codex` PVC를 사용자별로 둘지, service account별로 둘지 정해야 한다.
- GitHub 반영 기본값을 commit push로 할지 PR로 할지 정책화해야 한다.
- 문서 vault는 기존 Obsidian/Markdown repo를 쓸지, 별도 docs repo를 만들지 정해야 한다.
