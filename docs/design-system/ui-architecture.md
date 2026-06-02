# UI Architecture

## 목적

Ulsabio UI는 하나의 채팅창에 모든 기능을 욱여넣는 구조가 아님. 채팅은 control tower이고, 지속 관리가 필요한 일은 workspace, tool, agent, artifact 화면으로 이동한다. 사용자는 어디서 시작하든 같은 객체와 같은 실행 이력을 다시 볼 수 있어야 한다.

## Project Layout

```text
examples/ulsabio
├── ulsabio-backend
├── ulsabio-frontend
└── ulsabio-frontend-design
```

| 프로젝트 | 역할 |
|---|---|
| `ulsabio-backend` | Kotlin/Spring 기반 orchestrator API, workspace/tool/agent/run 상태 관리 |
| `ulsabio-frontend` | 실제 제품 프론트, 인증·데이터·streaming·workspace 연결 |
| `ulsabio-frontend-design` | 디자인 샘플 전용 프론트, mock data로 image/refined 버전 비교 |

## Runtime Boundary

```text
User
  ↓
Next Frontend
  ↓
Spring Orchestrator API
  ├── Provider Gateway
  ├── MCP Gateway
  ├── Scheduler
  ├── Workspace Service
  ├── Knowledge Service
  └── Agent Run Service
```

프론트는 화면 상태와 streaming 표시를 담당하고, 백엔드는 실행 권한, run state, tool CRUD, provider credential reference, schedule persistence를 담당한다. LLM/provider key는 브라우저에 직접 노출하지 않는다.

## Route Plan

| Route | Surface | 설명 |
|---|---|---|
| `/` | Today Control Tower | 최근 workspace, 진행 run, 제안 action |
| `/chat` | Global Chat | workspace 밖에서 시작하는 control tower chat |
| `/workspaces` | Workspace List | 여행, 투자, 지식베이스, 문서 등 지속 객체 목록 |
| `/workspaces/[workspaceId]` | Workspace Detail | artifact, chat, activity, inspector 결합 |
| `/agents` | Agent Registry | agent 목록, 상태, 사용량, 권한 |
| `/agents/[agentId]/edit` | Agent Builder | React Flow 기반 node canvas |
| `/todos` | Todo Workspace | list + markmap style dependency view |
| `/knowledge` | Scrap/Knowledge | URL, YouTube, article, blog scrap 관리 |
| `/reports/[reportId]` | Report Builder | knowledge 기반 문서 작성 |
| `/settings/providers` | Provider Settings | OpenRouter, local Codex OAuth, model selection, usage |
| `/settings/dev` | Dev Mode | API token, MCP/TUI 접근, local endpoint |

## Shell Composition

| Layer | 책임 |
|---|---|
| `AppShell` | sidebar, top command, account/provider status, global keyboard scope |
| `SurfaceRegistry` | route와 workspace type에 맞는 main surface 선택 |
| `ChatDock` | 전역 채팅, workspace 귀속 채팅, tool result rendering |
| `ArtifactPane` | map, markdown, report, table, graph, file preview 표시 |
| `InspectorPanel` | 선택 객체의 metadata, permissions, run logs, related chat |
| `RunTimeline` | agent/tool 실행 이벤트, 승인 대기, 실패 복구 |

## Navigation Model

| 시작점 | 동선 | 결과 |
|---|---|---|
| Global chat | `저번 여행 목록 보여줘` | workspace list query 후 chat에 compact result 표시 |
| Global chat | `부산 여행 편집하자` | `/workspaces/{id}`로 전환하고 chat session을 workspace에 귀속 |
| Workspace | `이 일정 다시 짜줘` | workspace context를 가진 chat turn 생성 |
| Tool page | schedule CRUD | tool action 실행 후 related chat event 남김 |
| Agent builder | agent test run | run timeline에 test event 생성, 실패 시 inspector에 원인 표시 |

## Workspace Transition UX

채팅에서 workspace로 넘어갈 때는 단순 route push가 아니라 전환 상태를 보여준다.

1. 사용자가 chat에서 workspace intent를 입력.
2. backend가 candidate workspace와 confidence 반환.
3. frontend가 `WorkspaceTransitionCard` 표시.
4. confidence가 낮으면 사용자가 workspace를 선택.
5. route 이동 전 `binding chat to workspace` 상태 표시.
6. workspace 화면 진입 후 같은 conversation이 dock에 유지.
7. activity timeline에 chat origin event 기록.

## Data Contracts

| 객체 | 필수 필드 |
|---|---|
| Workspace | `id`, `type`, `title`, `status`, `updatedAt`, `ownerScope` |
| Conversation | `id`, `scope`, `workspaceId`, `createdAt`, `lastMessageAt` |
| Agent | `id`, `name`, `role`, `modelRef`, `toolIds`, `status` |
| Tool | `id`, `name`, `category`, `permissionLevel`, `schemaVersion` |
| Run | `id`, `agentId`, `workspaceId`, `status`, `startedAt`, `endedAt` |
| Artifact | `id`, `workspaceId`, `type`, `title`, `version`, `sourceRunId` |
| Approval | `id`, `runId`, `riskLevel`, `requestedAction`, `expiresAt` |

## Event Model

| Event | Producer | Consumer |
|---|---|---|
| `conversation.message.created` | chat API | ChatDock, ActivityTimeline |
| `workspace.bound` | orchestrator | Router, WorkspaceHeader |
| `tool.invocation.started` | agent run service | RunTimeline, ToolCallCard |
| `tool.invocation.completed` | agent run service | ArtifactPane, UsageMeter |
| `approval.requested` | policy service | ApprovalGate, Notifications |
| `artifact.version.created` | workspace service | ArtifactTabs, ReportBuilder |
| `provider.usage.updated` | provider gateway | Settings UsageMeter |

## Frontend State Policy

| State | 위치 | 이유 |
|---|---|---|
| route/workspace identity | URL | 공유 가능해야 함 |
| server data | query cache | 재조회와 optimistic update 필요 |
| chat streaming | AI SDK hook + SSE state | stream chunk와 tool part 처리 |
| selected panel/node | local store | URL에 둘 필요 없는 ephemeral state |
| theme/token preview | design app local store | 제품 데이터와 분리 |
| provider credential | server only | 브라우저 저장 금지 |

## Rendering Policy

- Server Component는 route shell과 초기 데이터 로딩에 사용.
- Client Component는 chat input, streaming message, canvas, editor, drag/drop, command menu에 한정.
- AI generated text는 AI Elements `MessageResponse` 우선.
- 일반 markdown 문서는 `react-markdown` + allowlist/sanitize 정책 사용.
- agent builder는 `@xyflow/react` 기반으로 시작.
- report/document editor는 Tiptap OSS 기반으로 시작.

## Settings Architecture

Settings는 단순 preference 화면이 아니라 실행 인프라 관리 화면임.

| Section | 기능 |
|---|---|
| Provider auth | OpenRouter API key, local Codex OAuth 연결 상태 |
| Model routing | provider별 default model, fallback model, cost cap |
| Usage | input/output token, estimated cost, run별 breakdown |
| Dev mode | personal API token, MCP endpoint, TUI endpoint, revoke/rotate |
| Security | approval policy, destructive tool confirmation, audit export |

## Design App Policy

`ulsabio-frontend-design`은 mock data만 사용한다. 실제 API 연결, 인증, secret, provider key 입력은 금지한다. 같은 화면을 두 트랙으로 보여준다.

| Track | 구현 방식 |
|---|---|
| Image Fidelity | 기존 생성 이미지의 밀도, 색, 구도를 최대한 유지 |
| Refined Production | 디자인 토큰과 accessibility 기준으로 재해석 |

## 검증 기준

- route별 empty/loading/error 상태 존재.
- list item에는 안정적인 id/key 존재.
- BE DTO와 FE prop 이름이 문서와 일치.
- workspace 전환 시 conversation scope가 보존.
- provider key 입력값은 client log에 남지 않음.
- canvas/editor는 keyboard fallback 또는 inspector fallback 존재.
- markdown/editor renderer는 XSS 정책을 문서화.
