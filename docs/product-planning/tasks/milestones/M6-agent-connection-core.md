# M6 / Agent + Connection Core 개발 태스크

이 문서는 신규 개인형 Agent 플랫폼을 처음부터 구축한다는 전제로 `에이전트`, `연결`, `설정`, `에이전트 빌더 캔버스`를 실제 개발 가능한 작은 태스크로 분해한다. 기존 앱과 template 문서는 reference-only이며, 코드 복사/마이그레이션을 전제로 하지 않는다.

## 1. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [../00-task-format.md](../00-task-format.md) |
| 제품 문서 진입점 | [../../README.md](../../README.md) |
| 화면 계약 | [../../screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [../../common/implementation-plan.md](../../common/implementation-plan.md#9-m6--agent--connection-core) |
| 공통 동선 | [../../common/navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md) |
| 공통 객체/상태/API | [../../common/domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 에이전트 화면 | [../../screens/05-agents.md](../../screens/05-agents.md) |
| 연결 화면 | [../../screens/06-connections.md](../../screens/06-connections.md) |
| 설정 화면 | [../../screens/11-settings.md](../../screens/11-settings.md) |
| 에이전트 빌더 | [../../screens/13-agent-builder-canvas.md](../../screens/13-agent-builder-canvas.md) |
| Provider streaming reference | [../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md) |

## 2. M6 범위

| 포함 | 제외 |
| --- | --- |
| connection catalog, category, capability, health check, status event | 모든 외부 provider의 완전한 상용 연동 |
| credential 저장/교체/폐기/재인증 lifecycle과 원문 비노출 | credential 원문 재조회, export, browser 저장 |
| OpenRouter API key, Local Codex OAuth, Direct Provider Key 관리 | 공개망에 Codex app-server 노출 |
| model catalog, route, fallback, capability/cost 검증 | 모델 성능 벤치마크 자동화 |
| cost policy, usage summary, approval policy | 실제 결제/청구 시스템 구현 |
| Dev Mode token, TUI/MCP/HTTP API 접근 scope | 무제한 dev token 또는 scope 없는 local access |
| agent registry, template/draft, version lifecycle | 완성형 agent marketplace |
| builder graph/node/edge autosave, validate, test, publish, rollback | 대규모 graph 최적화와 subflow/group 고급 기능 전체 |
| test run 비용 집계와 node log | 실제 multi-agent swarm scheduler 완성 |

## 3. 선행 조건

| 선행 | M6에서 필요한 내용 |
| --- | --- |
| `DEV-M1-T07` | canonical object, ID prefix, status enum |
| `DEV-M1-T08` | common API envelope, version, idempotency |
| `DEV-M1-T09` | SSE/event envelope |
| `DEV-M1-T10` | empty/loading/error/permission state |
| `DEV-M1-T11` | permission, audit, credential safety skeleton |
| `DEV-M1-T12` | operation envelope, domain adapter skeleton |
| `M4 Execution Core` | `run`, `approval_request`, run log, control API foundation |
| `M5 Knowledge Core` | `source`, `memory`, `file_asset` binding foundation |

M4/M5 task 문서가 아직 병합되지 않은 상태라면 `Depends on`에는 milestone dependency를 병기하고, 병합 후 실제 task ID로 치환한다.

## 4. M6 완료 기준

- [ ] 연결 목록/상세에서 provider, MCP, service, capability, credential 상태가 분리되어 표시된다.
- [ ] OpenRouter API key, Local Codex OAuth, Direct Provider Key를 저장/검증/교체/폐기할 수 있고 credential 원문은 저장 후 재노출되지 않는다.
- [ ] model catalog와 task type별 model route가 capability, connection status, cost policy를 검증한다.
- [ ] fallback은 loop 없이 동작하고, 외부 provider로 데이터가 이동하는 fallback은 승인 정책에 걸린다.
- [ ] cost policy와 approval policy가 run/test/schedule/agent deploy 전에 preflight로 적용된다.
- [ ] Dev Mode token은 scope/access method/만료/audit log를 가진다.
- [ ] agent registry에서 agent 생성/편집/비활성화/복제/테스트 진입이 가능하다.
- [ ] agent version은 draft/test/deployed/superseded lifecycle로 분리된다.
- [ ] builder graph는 node/edge patch 저장, validate, test run, publish, rollback이 가능하다.
- [ ] test run 비용, credential 변경, token 변경, agent deploy, approval 결과가 audit log에 남는다.

## 5. 위험 Register

| Risk ID | 위험 | 기본 대응 | 관련 task |
| --- | --- | --- | --- |
| `RISK-M6-01` | credential 원문 비노출 실패 | API 응답/log serializer에서 원문 필드 금지, 생성 응답 1회 노출만 허용 | `DEV-M6-T04`, `DEV-M6-T05`, `DEV-M6-T07`, `DEV-M6-T13` |
| `RISK-M6-02` | OAuth 만료와 local endpoint offline 혼동 | credential 상태와 endpoint health를 별도 계산 | `DEV-M6-T03`, `DEV-M6-T06` |
| `RISK-M6-03` | provider fallback loop | route fingerprint와 max fallback depth로 차단 | `DEV-M6-T10` |
| `RISK-M6-04` | 외부 provider fallback으로 데이터 이동 | data egress approval policy 적용 | `DEV-M6-T10`, `DEV-M6-T12` |
| `RISK-M6-05` | dev token scope 과다 | default read-only, write scope는 만료/승인/audit 필수 | `DEV-M6-T13` |
| `RISK-M6-06` | invalid graph 배포 | validate/test/impact 통과 전 deploy 차단 | `DEV-M6-T17`, `DEV-M6-T19` |
| `RISK-M6-07` | test run 비용 누락 | test run도 usage/cost event에 포함하고 test badge로 구분 | `DEV-M6-T11`, `DEV-M6-T18` |
| `RISK-M6-08` | credential 교체 중 기존 실행 중단 | 검증 성공 전 기존 credential 유지, 영향 분석 제공 | `DEV-M6-T04`, `DEV-M6-T05`, `DEV-M6-T07` |
| `RISK-M6-09` | 권한 rule 우회 | connection rule보다 agent/node/schedule override가 넓어지지 않게 검증 | `DEV-M6-T12`, `DEV-M6-T17` |
| `RISK-M6-10` | draft와 deployed version 혼동 | agent_version 상태와 snapshot run을 분리 | `DEV-M6-T15`, `DEV-M6-T19` |

## 6. Task Dependency Map

```text
DEV-M6-T01
  -> DEV-M6-T02
  -> DEV-M6-T03
  -> DEV-M6-T04

DEV-M6-T04
  -> DEV-M6-T05
  -> DEV-M6-T06
  -> DEV-M6-T07

DEV-M6-T02 + DEV-M6-T03 + DEV-M6-T05 + DEV-M6-T06 + DEV-M6-T07
  -> DEV-M6-T08
  -> DEV-M6-T09
  -> DEV-M6-T10
  -> DEV-M6-T11
  -> DEV-M6-T12

DEV-M6-T11 + DEV-M6-T12
  -> DEV-M6-T13
  -> DEV-M6-T14
  -> DEV-M6-T15

DEV-M6-T14 + DEV-M6-T15
  -> DEV-M6-T16
  -> DEV-M6-T17
  -> DEV-M6-T18
  -> DEV-M6-T19

DEV-M6-T01 ~ DEV-M6-T19
  -> DEV-M6-T20
```

## 7. Task Index

| Task | 제목 | Size | Area | Depends on | Blocks |
| --- | --- | --- | --- | --- | --- |
| `DEV-M6-T01` | M6 fixture와 security boundary 확정 | `XS` | `Docs` | `DEV-M1-T07`, `DEV-M1-T11` | `DEV-M6-T02` |
| `DEV-M6-T02` | Connection catalog와 capability taxonomy | `M` | `Fullstack` | `DEV-M6-T01` | `DEV-M6-T03`, `DEV-M6-T08` |
| `DEV-M6-T03` | Connection health check와 상태 event | `M` | `Fullstack` | `DEV-M6-T02`, `DEV-M1-T09` | `DEV-M6-T08`, `DEV-M6-T14` |
| `DEV-M6-T04` | Credential lifecycle와 redaction guard | `M` | `BE`, `Security` | `DEV-M6-T01`, `DEV-M1-T11` | `DEV-M6-T05`, `DEV-M6-T06`, `DEV-M6-T07` |
| `DEV-M6-T05` | OpenRouter API key 연결 플로우 | `M` | `Fullstack`, `AI` | `DEV-M6-T04` | `DEV-M6-T08`, `DEV-M6-T09` |
| `DEV-M6-T06` | Local Codex OAuth와 app-server health | `M` | `Fullstack`, `AI` | `DEV-M6-T04` | `DEV-M6-T08`, `DEV-M6-T09` |
| `DEV-M6-T07` | Direct Provider Key 관리 | `M` | `Fullstack`, `AI` | `DEV-M6-T04` | `DEV-M6-T08`, `DEV-M6-T09` |
| `DEV-M6-T08` | Model catalog 동기화와 availability 정규화 | `M` | `Fullstack`, `AI` | `DEV-M6-T03`, `DEV-M6-T05`, `DEV-M6-T06`, `DEV-M6-T07` | `DEV-M6-T09`, `DEV-M6-T17` |
| `DEV-M6-T09` | Model route 설정 UI/API | `M` | `Fullstack` | `DEV-M6-T08` | `DEV-M6-T10`, `DEV-M6-T14`, `DEV-M6-T16` |
| `DEV-M6-T10` | Fallback policy와 loop/data-egress guard | `M` | `BE`, `AI`, `Security` | `DEV-M6-T09` | `DEV-M6-T11`, `DEV-M6-T12`, `DEV-M6-T18` |
| `DEV-M6-T11` | Usage metering와 cost policy enforcement | `M` | `Fullstack` | `DEV-M6-T08`, `DEV-M6-T10`, `M4 run foundation` | `DEV-M6-T12`, `DEV-M6-T18` |
| `DEV-M6-T12` | Approval policy와 preflight gate | `M` | `Fullstack`, `Security` | `DEV-M6-T10`, `DEV-M6-T11`, `M4 approval foundation` | `DEV-M6-T13`, `DEV-M6-T17`, `DEV-M6-T19` |
| `DEV-M6-T13` | Dev Mode token, scope, local access | `M` | `Fullstack`, `Security` | `DEV-M6-T12` | `DEV-M7` |
| `DEV-M6-T14` | Agent registry 목록/상세 baseline | `M` | `Fullstack` | `DEV-M6-T03`, `DEV-M6-T09` | `DEV-M6-T15`, `DEV-M6-T16` |
| `DEV-M6-T15` | Agent version lifecycle와 impact analysis | `M` | `Fullstack` | `DEV-M6-T14`, `DEV-M6-T12` | `DEV-M6-T16`, `DEV-M6-T19` |
| `DEV-M6-T16` | Builder graph/node/edge patch 저장 | `M` | `Fullstack` | `DEV-M6-T15`, `DEV-M6-T09` | `DEV-M6-T17`, `DEV-M6-T18` |
| `DEV-M6-T17` | Builder validation engine | `M` | `Fullstack`, `AI` | `DEV-M6-T16`, `DEV-M6-T12` | `DEV-M6-T18`, `DEV-M6-T19` |
| `DEV-M6-T18` | Builder test run과 node log | `M` | `Fullstack`, `AI` | `DEV-M6-T17`, `DEV-M6-T11`, `M4 run foundation` | `DEV-M6-T19` |
| `DEV-M6-T19` | Publish/deploy/rollback와 registry sync | `M` | `Fullstack` | `DEV-M6-T18`, `DEV-M6-T15` | `DEV-M6-T20` |
| `DEV-M6-T20` | M6 E2E, 보안, 회귀 검수 | `S` | `QA`, `Security` | `DEV-M6-T01` ~ `DEV-M6-T19` | `M7`, `agent runtime hardening` |

## 8. 개발 태스크

## DEV-M6-T01 / M6 fixture와 security boundary 확정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `XS` |
| Area | `Docs` |
| Screens | `SCR-05`, `SCR-06`, `SCR-11`, `SCR-13` |
| Objects | `connection`, `credential`, `agent` |
| Depends on | `DEV-M1-T07`, `DEV-M1-T11` |
| Blocks | `DEV-M6-T02`, `DEV-M6-T04` |
| Source docs | [화면 계약](../../screen-contracts.md#scr-05--에이전트--agents), [연결 상세](../../screens/06-connections.md), [설정 상세](../../screens/11-settings.md), [AI provider reference](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md) |

### 목적

M6 구현자가 provider/credential/agent builder를 한 번에 크게 만들지 않도록 fixture, 보안 경계, reference-only 범위를 먼저 고정한다.

### 구현 범위

- M6 fixture seed 목록 정의: OpenRouter, Local Codex, Direct Provider, Google Drive, Web Search, sample agent 3개, sample draft graph 1개.
- credential 원문, OAuth token, Dev token, provider payload의 노출 금지 규칙 정리.
- provider streaming reference에서 참고할 이벤트/adapter 원칙만 추출한다.
- 기존 앱이나 template를 구현 출발점으로 삼지 않는 문구를 M6 문서에 고정한다.

### 제외 범위

- 실제 provider credential 저장.
- 실제 OAuth flow.
- agent builder UI 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T01-S01` | M6 fixture object 목록 작성 | `Docs` | `connection`, `credential`, `model_catalog_item`, `model_route`, `agent`, `agent_version` seed 최소 필드가 정의됨 |
| `DEV-M6-T01-S02` | 민감 정보 boundary 작성 | `Security` | API/log/UI에 노출 금지할 필드와 마스킹 필드가 구분됨 |
| `DEV-M6-T01-S03` | reference-only 확인 범위 작성 | `Docs` | provider streaming reference에서 참고할 이벤트/adapter 원칙만 명시됨 |

### Acceptance Criteria

- [ ] M6 fixture가 canonical object/status를 따른다.
- [ ] credential/token 원문 비노출 원칙이 이후 task의 완료 조건으로 재사용 가능하다.
- [ ] 기존 앱과 template가 코드 복사 대상이 아님이 명시된다.

### Test / Verification

- [ ] fixture 필드와 [공통 객체/상태/API](../../common/domain-model-and-state-policy.md)의 `connection`, `credential`, `agent`, `agent_version`을 대조한다.
- [ ] 문서 내 reference가 구현 의존성으로 표현되지 않았는지 확인한다.

### Edge Cases

- test fixture에 실제 API key 형식 문자열이 들어갈 수 있다.
- OAuth와 Dev token을 모두 `token`으로 뭉뚱그려 lifecycle이 섞일 수 있다.
- provider payload sample에 개인정보나 prompt 원문이 남을 수 있다.

### Open Decisions

- `DEC-M6-01`: M6 fixture를 정적 JSON으로 둘지, BE seed endpoint로 둘지 결정 필요.

## DEV-M6-T02 / Connection catalog와 capability taxonomy

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-06`, `SCR-11` |
| Objects | `connection`, `permission_policy`, `usage_limit` |
| Depends on | `DEV-M6-T01`, `DEV-M1-T08`, `DEV-M1-T10` |
| Blocks | `DEV-M6-T03`, `DEV-M6-T08`, `DEV-M6-T14` |
| Source docs | [연결 계약](../../screen-contracts.md#scr-06--연결--connections), [연결 상세 7장](../../screens/06-connections.md#7-provider--tool--mcp--service--capability-분류), [설정 상세](../../screens/11-settings.md) |

### 목적

모델 provider, MCP, service, capability를 하나의 connection catalog로 보여주되 실행 가능 기능과 인증 상태를 혼동하지 않게 한다.

### 구현 범위

- connection category enum 후보 정의: `provider`, `mcp`, `service`, `storage`, `search`, `map`, `code`, `file`, `media`.
- capability key 정의: `model.read`, `chat.create`, `embedding.create`, `tool.call`, `file.read`, `file.write`, `credential.manage` 등.
- `GET /api/connections` 목록 API와 `/connections` 카드 그리드 초기 렌더링.
- 탭/검색/필터/정렬 query 처리.
- OpenRouter, Codex app-server, Gemini, Claude, Kimi, Qwen 샘플 카드 표시.

### 제외 범위

- live health check.
- credential 저장/검증.
- model catalog 동기화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T02-S01` | connection catalog schema 정의 | `BE` | category, providerKey, capabilitySummary, credentialSummary, usageSummary 필드가 정의됨 |
| `DEV-M6-T02-S02` | connection 목록 API | `BE` | 탭/검색/상태/유형 query가 있는 목록 API가 준비됨 |
| `DEV-M6-T02-S03` | connection 카드 UI | `FE` | 카드가 상태, 권한, 월 사용액, 마지막 확인 시각, 선택 상태를 표시함 |
| `DEV-M6-T02-S04` | capability taxonomy fixture | `Fullstack` | provider별 capability fixture가 stable key로 렌더링됨 |

### Acceptance Criteria

- [ ] `/connections`에서 provider/MCP/service가 같은 목록에 표시되되 category와 capability가 분리된다.
- [ ] 카드 key는 `connection.id`를 사용한다.
- [ ] connection status와 credential status가 UI에서 같은 값으로 표시되지 않는다.
- [ ] 연결 없음, 부분 연결, 권한 없음 상태가 공통 empty/error/permission state를 따른다.

### Test / Verification

- [ ] connection category별 fixture 렌더링 테스트.
- [ ] 검색/필터 query가 API request와 UI 상태에 반영되는지 검증.
- [ ] `credential` 원문성 필드가 목록 API에 없는지 contract 확인.

### Edge Cases

- OpenRouter가 provider이면서 routing provider로도 보일 수 있다.
- Codex app-server는 MCP/local service/code tool 성격이 섞인다.
- 같은 connection이 여러 탭에서 중복 노출될 수 있다.
- capability가 없는 setup_required connection도 목록에 보여야 한다.

### Open Decisions

- `DEC-M6-02`: Codex app-server의 primary category를 `mcp`로 둘지 `service`로 둘지 결정 필요.

## DEV-M6-T03 / Connection health check와 상태 event

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-06`, `SCR-05`, `SCR-13` |
| Objects | `connection`, `credential`, `connection_log`, `audit_log` |
| Depends on | `DEV-M6-T02`, `DEV-M1-T09`, `DEV-M1-T11` |
| Blocks | `DEV-M6-T08`, `DEV-M6-T14`, `DEV-M6-T17` |
| Source docs | [연결 상세 8장](../../screens/06-connections.md#8-health-check), [공통 이벤트](../../common/domain-model-and-state-policy.md#12-event-후보), [공통 동선](../../common/navigation-and-cross-screen-flows.md#14-emptyloadingerrorrealtime-상태) |

### 목적

연결이 실행 후보에 들어갈 수 있는지 health, credential, endpoint, cost 상태를 분리해 계산하고 화면/agent/builder에 이벤트로 전파한다.

### 구현 범위

- `POST /api/connections/{connectionId}/health-check` API.
- provider metadata, OAuth service, local endpoint, cost API check 항목 분리.
- connection status 계산: `connected`, `degraded`, `error`, `expired`, `disabled`, `setup_required`, `cost_blocked`.
- connection log와 audit log 기록.
- `connection.status_changed`, `credential.expired` event 발행.

### 제외 범위

- provider별 고급 endpoint 테스트 전체.
- scheduler 기반 주기 health check.
- 비용 발생 테스트 자동 실행.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T03-S01` | health check request/response 정의 | `BE` | check 대상, 결과, latency, statusReason, requestId가 응답됨 |
| `DEV-M6-T03-S02` | health status 계산 | `BE` | credential 만료, endpoint 실패, cost_blocked가 별도 reason으로 계산됨 |
| `DEV-M6-T03-S03` | 연결 상세 health UI | `FE` | 수동 새로고침, 최근 체크 시각, 실패 endpoint가 표시됨 |
| `DEV-M6-T03-S04` | status event 발행 | `BE` | connection 상태 변경 시 SSE/event envelope로 발행됨 |

### Acceptance Criteria

- [ ] health check 성공은 connection을 `connected`로 갱신한다.
- [ ] OAuth 만료는 `expired`, 일부 endpoint 실패는 `degraded`로 구분된다.
- [ ] health check 로그에 민감 payload가 저장되지 않는다.
- [ ] agent registry와 builder는 connection 상태 변경 후 실행 가능 여부를 재계산할 수 있다.

### Test / Verification

- [ ] connected/degraded/expired/error/cost_blocked fixture별 상태 계산 unit test.
- [ ] 수동 health check 중복 클릭 시 idempotency 또는 loading guard 검증.
- [ ] 이벤트 수신 후 연결 카드와 agent warning이 갱신되는지 확인.

### Edge Cases

- OAuth는 유효하지만 Local Codex endpoint가 offline일 수 있다.
- provider usage API만 실패해도 chat endpoint는 정상일 수 있다.
- health check 자체가 비용을 발생시킬 수 있다.
- 같은 오류 알림이 짧은 시간에 반복될 수 있다.

### Open Decisions

- `DEC-M6-03`: background health check 주기를 provider 중요도별로 둘지 수동 중심으로 시작할지 결정 필요.

## DEV-M6-T04 / Credential lifecycle와 redaction guard

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE`, `Security` |
| Screens | `SCR-06`, `SCR-11` |
| Objects | `credential`, `connection`, `audit_log` |
| Depends on | `DEV-M6-T01`, `DEV-M1-T08`, `DEV-M1-T11` |
| Blocks | `DEV-M6-T05`, `DEV-M6-T06`, `DEV-M6-T07`, `DEV-M6-T13` |
| Source docs | [공통 credential](../../common/domain-model-and-state-policy.md#411-credential), [연결 상세 13.2](../../screens/06-connections.md#132-credential), [설정 상세 13장](../../screens/11-settings.md#13-보안-체크리스트) |

### 목적

API key, OAuth token, local token, service account, dev token을 안전하게 저장/교체/폐기하고 원문이 UI/API/log에 다시 노출되지 않게 한다.

### 구현 범위

- credential type과 status 정의: `api_key`, `oauth`, `local_token`, `service_account`, `dev_token`; `valid`, `partial`, `expired`, `revoked`, `unknown`, `error`.
- 원문 저장 요청과 마스킹 응답 DTO 분리.
- 생성/교체 성공 응답의 1회 노출 허용 여부를 credential type별로 정의.
- rotate/revoke/delete/reauthorize 공통 lifecycle API skeleton.
- credential 변경 audit log와 fail-closed 정책.

### 제외 범위

- 구체 provider별 key 검증.
- OAuth provider callback 상세.
- 실제 secret vault 제품 선택 확정.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T04-S01` | credential DTO 분리 | `BE` | write DTO에는 원문이 있고 read DTO에는 maskedValue/fingerprint만 있음 |
| `DEV-M6-T04-S02` | redaction serializer/log guard | `Security` | credential/token/payload 원문이 응답과 log fixture에 포함되지 않음 |
| `DEV-M6-T04-S03` | lifecycle API skeleton | `BE` | rotate, revoke, delete, reauthorize 후보 API와 audit 이벤트가 정의됨 |
| `DEV-M6-T04-S04` | 영향 분석 hook | `BE` | credential 교체/폐기 전 agent, schedule, route 영향 조회 hook이 생김 |

### Acceptance Criteria

- [ ] 저장 후 credential 원문은 read API에서 재조회되지 않는다.
- [ ] 새 credential 검증 실패 시 기존 credential은 유지된다.
- [ ] credential 변경/폐기/audit 저장 실패 시 위험 write는 fail-closed다.
- [ ] credential fingerprint와 maskedValue는 UI 식별에 충분하지만 원문 복원이 불가능하다.

### Test / Verification

- [ ] API response snapshot에서 원문 key/token 문자열이 없는지 확인.
- [ ] audit log 저장 실패 시 rotate/revoke가 실패 처리되는지 unit test.
- [ ] 새 credential 검증 실패 시 기존 credential 상태가 유지되는지 검증.

### Edge Cases

- 사용자가 key 원문을 닫기 전 복사하지 않았다고 재표시를 요구할 수 있다.
- credential 저장은 성공했지만 provider validation은 실패할 수 있다.
- credential 폐기 중 이미 진행 중인 run이 해당 key를 쓰고 있을 수 있다.
- 허브 공유 credential과 개인 credential의 관리자 권한이 다를 수 있다.

### Open Decisions

- `DEC-M6-04`: secret 저장소를 초기에는 DB 암호화로 시작할지 외부 vault 전제로 시작할지 결정 필요.

## DEV-M6-T05 / OpenRouter API key 연결 플로우

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-06`, `SCR-11` |
| Objects | `connection`, `credential`, `model_catalog_item`, `usage_summary` |
| Depends on | `DEV-M6-T04`, `DEV-M6-T03` |
| Blocks | `DEV-M6-T08`, `DEV-M6-T09`, `DEV-M6-T11` |
| Source docs | [설정 OpenRouter](../../screens/11-settings.md#7-openrouter-api-key), [연결 시나리오 5.2](../../screens/06-connections.md#52-새-provider-연결-추가), [AI provider reference](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md) |

### 목적

OpenRouter를 통합 모델 route로 연결하고 key 관리, 검증, model catalog 갱신, 사용량 표시의 기본 흐름을 만든다.

### 구현 범위

- OpenRouter connection 카드와 설정 카드 연결.
- API key 입력/교체/폐기 modal.
- 저장 전 또는 저장 직후 `models/list` 같은 최소 validation.
- validation 성공 시 model catalog sync trigger.
- 실패 원인 구분: 401/403, quota 초과, rate limit, provider 장애, network failure.
- key 교체 전 영향 분석: agent, schedule, active run, model route.

### 제외 범위

- OpenRouter가 지원하는 모든 endpoint 연동.
- 가격 catalog 완전 자동 동기화.
- 결제/충전 관리.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T05-S01` | OpenRouter card/drawer UI | `FE` | 상태, fingerprint, 최근 확인, key 관리, model sync 상태가 표시됨 |
| `DEV-M6-T05-S02` | key save/rotate API | `BE` | 새 key 검증 성공 전 기존 key가 유지됨 |
| `DEV-M6-T05-S03` | validation adapter | `AI` | 최소 metadata endpoint 호출 결과가 표준 validation result로 변환됨 |
| `DEV-M6-T05-S04` | 실패 상태 UI | `FE` | 실패 reason, requestId, 기존 key 유지 여부가 표시됨 |

### Acceptance Criteria

- [ ] OpenRouter key 저장 성공 후 원문은 다시 표시되지 않는다.
- [ ] key 검증 실패 시 기존 key와 model route가 유지된다.
- [ ] validation 성공 시 OpenRouter model catalog sync가 예약 또는 즉시 실행된다.
- [ ] OpenRouter key 폐기 전 영향받는 agent/schedule/route가 표시된다.

### Test / Verification

- [ ] 성공/401/quota/rate limit/network failure adapter fixture test.
- [ ] key rotate 실패 시 기존 masked fingerprint가 유지되는지 UI 검증.
- [ ] OpenRouter key 원문이 response/log에 없는지 확인.

### Edge Cases

- key는 유효하지만 특정 downstream provider만 장애일 수 있다.
- model list 동기화 실패 후 credential은 valid일 수 있다.
- OpenRouter route가 기본값이면 key 폐기를 바로 허용하면 전체 채팅이 막힌다.
- usage API가 없거나 늦게 갱신될 수 있다.

### Open Decisions

- `DEC-M6-05`: OpenRouter model catalog sync를 저장 직후 blocking으로 둘지 background로 둘지 결정 필요.

## DEV-M6-T06 / Local Codex OAuth와 app-server health

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-06`, `SCR-11` |
| Objects | `connection`, `credential`, `model_catalog_item`, `audit_log` |
| Depends on | `DEV-M6-T04`, `DEV-M6-T03` |
| Blocks | `DEV-M6-T08`, `DEV-M6-T09`, `DEV-M6-T10` |
| Source docs | [설정 Local Codex](../../screens/11-settings.md#8-local-codex-oauth), [Provider reference Codex app-server](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md#codex-app-server) |

### 목적

Local Codex OAuth를 모델 제공 경로로 관리하고, OAuth 상태와 local app-server endpoint health를 분리해 실행 가능성을 계산한다.

### 구현 범위

- Local Codex connection 카드와 설정 카드.
- OAuth 재인증 시작/완료 callback skeleton.
- app-server local endpoint health check.
- Codex model catalog 후보 sync: short, reasoning, code, mini, vision 등.
- OAuth scope와 Dev Mode token scope를 UI/DTO에서 분리.
- app-server 공개망 노출 금지 경고와 local endpoint 표시.

### 제외 범위

- Codex app-server 자체 구현.
- Codex CLI 설치 관리.
- 원격 공개 endpoint 운영.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T06-S01` | Local Codex auth card UI | `FE` | account label, OAuth status, endpoint health, reauth CTA가 표시됨 |
| `DEV-M6-T06-S02` | OAuth reauth API skeleton | `BE` | 재인증 시작/완료/실패 상태가 credential lifecycle에 반영됨 |
| `DEV-M6-T06-S03` | app-server health adapter | `AI` | OAuth valid와 endpoint offline이 별도 상태로 계산됨 |
| `DEV-M6-T06-S04` | Codex model catalog sync | `BE` | local model 후보가 `model_catalog_item`으로 정규화됨 |

### Acceptance Criteria

- [ ] OAuth 만료 시 Local Codex route는 선택 불가 또는 재인증 CTA를 표시한다.
- [ ] OAuth는 valid지만 local endpoint offline이면 route가 임시 제외된다.
- [ ] Codex auth/token 원문은 UI/API/log에 노출되지 않는다.
- [ ] Codex app-server를 공개망에 노출하지 않는 보안 안내가 설정/도움말로 연결된다.

### Test / Verification

- [ ] OAuth expired, endpoint offline, catalog failure fixture 테스트.
- [ ] Local Codex route가 offline 상태에서 model route 기본값으로 저장되지 않는지 검증.
- [ ] OAuth scope와 Dev token scope 필드가 섞이지 않는지 DTO 검증.

### Edge Cases

- 계정은 인증됐지만 현재 hub와 연결된 권한이 없을 수 있다.
- app-server가 켜져 있어도 model catalog endpoint만 실패할 수 있다.
- Local Codex에서 온라인 provider로 fallback되면 데이터 외부 전송 위험이 생긴다.

### Open Decisions

- `DEC-M6-06`: Local Codex 비용 지표를 token quota로 볼지 local compute time으로 볼지 결정 필요.

## DEV-M6-T07 / Direct Provider Key 관리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-06`, `SCR-11` |
| Objects | `connection`, `credential`, `model_catalog_item`, `usage_summary` |
| Depends on | `DEV-M6-T04`, `DEV-M6-T03` |
| Blocks | `DEV-M6-T08`, `DEV-M6-T09`, `DEV-M6-T10` |
| Source docs | [설정 Direct Provider](../../screens/11-settings.md#9-direct-provider-key), [연결 상세 7장](../../screens/06-connections.md#7-provider--tool--mcp--service--capability-분류) |

### 목적

OpenRouter를 거치지 않는 provider별 직접 key를 관리하고, 부분 연결 상태에서도 연결된 provider 모델만 안전하게 선택 가능하게 한다.

### 구현 범위

- Direct Provider 목록: OpenAI, Anthropic, Gemini, Kimi, 기타 provider 후보.
- provider별 key 추가/교체/폐기/검증.
- 부분 연결 상태 표시: `2/4 제공자 연결됨`.
- provider별 model list 또는 내부 catalog mapping.
- provider별 비용 단가/usage summary placeholder.

### 제외 범위

- 모든 direct provider의 완전한 adapter 구현.
- provider별 데이터 학습/보관 정책 자동 수집.
- provider별 세부 파라미터 전체 UI.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T07-S01` | direct provider table UI | `FE` | provider별 상태, key 관리, lastUsed, quota 상태가 표시됨 |
| `DEV-M6-T07-S02` | provider key lifecycle API | `BE` | provider별 credential rotate/revoke/validate가 공통 lifecycle을 사용함 |
| `DEV-M6-T07-S03` | provider adapter registry | `AI` | providerKey별 validation/model list adapter 후보가 등록됨 |
| `DEV-M6-T07-S04` | partial connection route guard | `Fullstack` | 미연결 provider 모델은 비활성 표시되며 저장 차단됨 |

### Acceptance Criteria

- [ ] 일부 provider만 연결된 상태에서도 Direct Provider 카드는 `partial`로 표시된다.
- [ ] 연결되지 않은 provider 모델은 model route 기본값으로 저장할 수 없다.
- [ ] provider key 원문은 저장 후 재노출되지 않는다.
- [ ] provider별 validation 실패가 다른 provider 연결 상태를 망치지 않는다.

### Test / Verification

- [ ] 연결됨/미설정/검증 실패/quota 초과/권한 부족 fixture 렌더링.
- [ ] 미연결 provider model 저장 차단 테스트.
- [ ] provider key 원문이 response/log에 없는지 확인.

### Edge Cases

- 한 provider의 quota 초과가 Direct Provider 전체 실패로 보일 수 있다.
- 같은 provider가 OpenRouter와 direct route에 모두 존재한다.
- provider별 key format validation이 너무 엄격하면 정상 key를 막을 수 있다.

### Open Decisions

- `DEC-M6-07`: MVP direct provider 목록을 OpenAI/Anthropic/Gemini/Kimi로 제한할지 결정 필요.

## DEV-M6-T08 / Model catalog 동기화와 availability 정규화

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-05`, `SCR-11`, `SCR-13` |
| Objects | `model_catalog_item`, `connection`, `credential` |
| Depends on | `DEV-M6-T03`, `DEV-M6-T05`, `DEV-M6-T06`, `DEV-M6-T07` |
| Blocks | `DEV-M6-T09`, `DEV-M6-T17`, `DEV-M6-T18` |
| Source docs | [설정 모델 선택](../../screens/11-settings.md#67-모델-선택--모델-라우팅), [공통 API 힌트](../../common/domain-model-and-state-policy.md#11-api-후보) |

### 목적

OpenRouter, Local Codex, Direct Provider에서 받은 모델 정보를 작업 유형, capability, 가격, 지연, 사용 가능 상태 기준으로 정규화한다.

### 구현 범위

- `model_catalog_item` schema 정의.
- provider별 raw model metadata를 내부 catalog로 변환.
- capability normalization: chat, code, vision, embedding, file analysis, long context 등.
- availability 계산: connection status, credential status, endpoint health, quota/cost.
- stale catalog 표시와 refresh API.

### 제외 범위

- 모델 벤치마크 점수 산정.
- provider별 최신 가격 자동 크롤링.
- 추천 모델 랭킹 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T08-S01` | catalog item schema | `BE` | modelId, provider, connectionType, capabilities, pricing, latencyClass, isAvailable 필드가 정의됨 |
| `DEV-M6-T08-S02` | metadata normalization adapter | `AI` | OpenRouter/Codex/direct provider raw model이 공통 shape로 변환됨 |
| `DEV-M6-T08-S03` | catalog refresh API | `BE` | provider별 refresh와 stale 상태가 관리됨 |
| `DEV-M6-T08-S04` | model picker data API | `Fullstack` | agent/builder/settings에서 capability 필터로 모델 후보 조회 가능 |

### Acceptance Criteria

- [ ] unavailable 모델은 표시할 수 있지만 기본 route/agent node 저장은 차단된다.
- [ ] stale catalog는 정상 catalog처럼 보이지 않고 새로고침 CTA를 제공한다.
- [ ] 모델 capability가 없는 작업 유형에는 선택 후보로 나오지 않는다.
- [ ] provider별 raw metadata 차이가 FE로 새지 않는다.

### Test / Verification

- [ ] OpenRouter/Codex/direct raw fixture normalization test.
- [ ] connection expired/cost_blocked 상태에서 모델 availability가 false인지 검증.
- [ ] capability filter별 model picker 결과 테스트.

### Edge Cases

- 같은 모델명이 여러 provider route에 존재한다.
- catalog sync는 실패했지만 이전 catalog로 실행은 가능할 수 있다.
- provider pricing 정보가 없으면 내부 추정 또는 unknown으로 표시해야 한다.

### Open Decisions

- `DEC-M6-08`: 가격 정보 없는 모델을 route 후보로 허용하되 비용 정책에서 어떻게 처리할지 결정 필요.

## DEV-M6-T09 / Model route 설정 UI/API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-11`, `SCR-05`, `SCR-13` |
| Objects | `model_route`, `model_catalog_item`, `connection` |
| Depends on | `DEV-M6-T08`, `DEV-M1-T08` |
| Blocks | `DEV-M6-T10`, `DEV-M6-T14`, `DEV-M6-T16` |
| Source docs | [설정 모델 라우팅](../../screens/11-settings.md#10-모델-라우팅), [에이전트 설정 탭](../../screens/05-agents.md#설정-탭) |

### 목적

작업 유형별 기본 모델 route를 설정하고, agent/node override가 전역 route를 안전하게 참조할 수 있게 한다.

### 구현 범위

- 작업 유형 enum 후보: quick_answer, reasoning, coding, long_context, vision, embedding, agent_test.
- `GET /api/settings/model-routes`, `PUT /api/settings/model-routes/{routeId}`.
- Settings 모델 선택 표 UI.
- default route 별표, provider/model dropdown, fallback policy 요약.
- 저장 전 capability, connection status, cost, catalog freshness 검증.

### 제외 범위

- agent node별 고급 parameter 전체.
- 자동 모델 추천.
- provider pricing 비교 UI 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T09-S01` | model route schema/API | `BE` | taskType, defaultConnectionType, provider/model ids, fallbackPolicy가 저장됨 |
| `DEV-M6-T09-S02` | route table UI | `FE` | 작업 유형별 OpenRouter/Local Codex/Direct Provider 열과 기본 별표가 표시됨 |
| `DEV-M6-T09-S03` | route save validation | `Fullstack` | 미연결/권한 없음/capability mismatch/cost blocked 저장 차단 |
| `DEV-M6-T09-S04` | route impact summary | `BE` | 변경 전 영향받는 agent/node/schedule 수를 계산할 수 있음 |

### Acceptance Criteria

- [ ] 작업 유형별 기본 route는 하나만 선택된다.
- [ ] 미연결 provider 모델은 route로 저장할 수 없다.
- [ ] route 변경은 agent/builder model picker 후보에 반영된다.
- [ ] 저장 실패 시 draft 변경이 사라지지 않는다.

### Test / Verification

- [ ] taskType별 route 저장/조회 contract test.
- [ ] capability mismatch route 저장 차단 테스트.
- [ ] route 변경 후 agent model picker fixture 갱신 확인.

### Edge Cases

- 모든 provider가 비활성이라 route를 선택할 수 없을 수 있다.
- model catalog가 stale일 때 저장을 허용할지 막을지 모호하다.
- route 변경 중 schedule 실행이 시작될 수 있다.

### Open Decisions

- `DEC-M6-09`: taskType 목록을 MVP에서 어디까지 열지 결정 필요.

## DEV-M6-T10 / Fallback policy와 loop/data-egress guard

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE`, `AI`, `Security` |
| Screens | `SCR-11`, `SCR-03`, `SCR-13` |
| Objects | `model_route`, `connection`, `approval_request`, `audit_log` |
| Depends on | `DEV-M6-T09`, `DEV-M1-T12` |
| Blocks | `DEV-M6-T11`, `DEV-M6-T12`, `DEV-M6-T18` |
| Source docs | [설정 fallback 규칙](../../screens/11-settings.md#102-fallback-규칙), [공통 승인/권한](../../common/navigation-and-cross-screen-flows.md#11-approval-flow) |

### 목적

provider 장애, rate limit, 비용 차단, local offline 상황에서 fallback을 제공하되 loop와 무단 데이터 외부 전송을 막는다.

### 구현 범위

- fallback policy schema: order, maxDepth, retryBeforeFallback, allowedDataBoundary, requireApprovalOnEgress.
- route fingerprint로 loop detection.
- capability mismatch는 fallback하지 않고 실행 전 차단.
- Local Codex에서 online provider로 이동하는 data egress approval gate.
- fallback decision log와 run log 기록.

### 제외 범위

- provider별 최적 fallback 추천 AI.
- 실시간 비용 기반 dynamic routing 고도화.
- 민감 데이터 자동 분류 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T10-S01` | fallback policy schema | `BE` | fallback order, maxDepth, dataBoundary, approval requirement가 정의됨 |
| `DEV-M6-T10-S02` | loop detection | `BE` | route fingerprint 재방문 시 fallback 중단됨 |
| `DEV-M6-T10-S03` | data egress guard | `Security` | local/internal route에서 external route 이동 시 approval preflight 생성 가능 |
| `DEV-M6-T10-S04` | fallback log UI hint | `FE` | run/test log에서 fallback 발생 이유와 선택 provider를 확인 가능 |

### Acceptance Criteria

- [ ] fallback chain은 maxDepth를 넘지 않는다.
- [ ] capability mismatch는 fallback이 아니라 validation failure로 처리된다.
- [ ] 외부 provider로 데이터가 나가는 fallback은 승인 정책에 걸린다.
- [ ] fallback 실패 reason은 run/test log에 남는다.

### Test / Verification

- [ ] A -> B -> A fallback loop fixture 차단 테스트.
- [ ] Local Codex offline -> OpenRouter fallback approval_required 테스트.
- [ ] capability mismatch는 fallback하지 않는지 검증.

### Edge Cases

- fallback provider도 같은 upstream provider를 내부적으로 쓸 수 있다.
- 더 저렴한 fallback이지만 더 넓은 데이터 전송 범위를 가질 수 있다.
- provider rate limit retry와 fallback 순서가 충돌할 수 있다.

### Open Decisions

- `DEC-M6-10`: 외부 provider data egress를 기본 승인 필요로 둘지 민감 scope에서만 승인 필요로 둘지 결정 필요.

## DEV-M6-T11 / Usage metering와 cost policy enforcement

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-06`, `SCR-11`, `SCR-05`, `SCR-13` |
| Objects | `usage_summary`, `cost_policy`, `run`, `agent` |
| Depends on | `DEV-M6-T08`, `DEV-M6-T10`, `M4 run foundation` |
| Blocks | `DEV-M6-T12`, `DEV-M6-T18`, `DEV-M6-T20` |
| Source docs | [설정 비용](../../screens/11-settings.md#11-사용량--비용), [연결 비용 한도](../../screens/06-connections.md#93-비용-한도), [공통 비용 정책](../../common/navigation-and-cross-screen-flows.md#11-approval-flow) |

### 목적

모델 호출, agent test run, builder test run, schedule run의 비용을 집계하고 실행 전/중 비용 한도를 적용한다.

### 구현 범위

- usage/cost event schema: provider, model, routeType, input/output/reasoning tokens, estimated/actual cost, runId, agentId, test flag.
- Settings usage summary: 월 토큰, 월 비용, 실패율, 평균 응답 시간.
- connection별/전역 cost policy: monthlyLimit, dailyLimit, alertThreshold, blockMode.
- 실행 전 예상 비용 preflight.
- 실행 중 한도 도달 시 `approval_waiting`, `paused`, 또는 `failed` 전환 정책.

### 제외 범위

- 실제 청구 결제.
- provider별 정확한 invoice reconciliation.
- 비용 최적화 추천 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T11-S01` | usage event schema | `BE` | run/test/provider/model 단위 cost event가 저장 가능 |
| `DEV-M6-T11-S02` | cost summary API/UI | `Fullstack` | 설정/연결/agent에서 월 비용과 토큰 요약을 조회 가능 |
| `DEV-M6-T11-S03` | cost policy save/preflight | `BE` | 실행 전 estimatedCost가 한도와 비교됨 |
| `DEV-M6-T11-S04` | test run cost 포함 | `Fullstack` | test run도 비용 집계에 포함되고 test badge로 구분됨 |

### Acceptance Criteria

- [ ] test run 비용은 실제 비용 집계에 포함된다.
- [ ] provider 비용 API가 실패해도 내부 추정 비용으로 한도 검증을 생략하지 않는다.
- [ ] 전역 한도보다 connection별 한도가 넓어질 수 없다.
- [ ] 비용 한도 변경 전 영향받는 run/schedule/agent route가 표시된다.

### Test / Verification

- [ ] estimated/actual/unknown pricing fixture별 cost calculation test.
- [ ] monthly/daily/run limit 초과 preflight 테스트.
- [ ] test run cost가 usage summary에 포함되는지 검증.

### Edge Cases

- provider 실제 청구 비용과 내부 추정 비용이 다를 수 있다.
- 실행 중 비용 도달 시 provider 호출을 즉시 중단할 수 없을 수 있다.
- Local Codex는 외부 청구 비용이 없지만 compute/quota 지표가 필요할 수 있다.

### Open Decisions

- `DEC-M6-11`: 비용 한도 초과 시 기본 동작을 `block`으로 할지 `approval_required`로 할지 결정 필요.

## DEV-M6-T12 / Approval policy와 preflight gate

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `Security` |
| Screens | `SCR-03`, `SCR-06`, `SCR-11`, `SCR-13` |
| Objects | `approval_policy`, `approval_request`, `run`, `connection`, `agent` |
| Depends on | `DEV-M6-T10`, `DEV-M6-T11`, `M4 approval foundation` |
| Blocks | `DEV-M6-T13`, `DEV-M6-T17`, `DEV-M6-T19` |
| Source docs | [공통 승인](../../common/navigation-and-cross-screen-flows.md#11-approval-flow), [설정 승인 정책](../../screens/11-settings.md#12-승인-정책), [빌더 승인 노드](../../screens/13-agent-builder-canvas.md#91-승인-노드) |

### 목적

외부 쓰기, 비용 초과, 권한 상승, schedule 변경, Dev Mode write, agent deploy 같은 위험 액션을 실행 전 preflight로 막거나 승인 요청으로 전환한다.

### 구현 범위

- approval policy schema: riskType, policyMode, threshold, appliesTo.
- preflight API/service: action, actor, target, estimatedCost, permissionScope, payloadFingerprint.
- approval_request 생성과 원 API pending 응답.
- 승인 직전 재검증: credential, 비용, 권한, payload fingerprint.
- 승인/거절 audit log.

### 제외 범위

- 복잡한 다중 승인자 workflow.
- 결제 승인.
- 팀 공유 허브 관리자 정책 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T12-S01` | approval policy settings API | `BE` | riskType별 policyMode와 threshold 저장 가능 |
| `DEV-M6-T12-S02` | preflight gate service | `BE` | 위험 액션이 실행/approval_required/block 중 하나로 판정됨 |
| `DEV-M6-T12-S03` | approval request 연동 | `Fullstack` | approval_required 응답이 승인 화면/맡긴 일 deep link를 포함함 |
| `DEV-M6-T12-S04` | 승인 직전 재검증 | `Security` | payload/credential/cost 변경 시 기존 승인이 무효화됨 |

### Acceptance Criteria

- [ ] 외부 쓰기와 Dev Mode write는 policy 없이 실행되지 않는다.
- [ ] 비용 초과는 cost policy와 approval policy 결과를 함께 반영한다.
- [ ] 승인/거절은 audit log에 남는다.
- [ ] approval payload가 의미 있게 바뀌면 재승인을 요구한다.

### Test / Verification

- [ ] external_write, cost_limit, permission, schedule_change, dev_write preflight fixture 테스트.
- [ ] 승인 직전 credential revoked 상태에서 실행 차단 테스트.
- [ ] approval_request 중복 생성 방지를 idempotency key로 검증.

### Edge Cases

- Web UI가 없는 Dev Mode HTTP API write 요청은 approval URL을 응답해야 한다.
- 승인 만료 후 run은 paused 또는 failed로 전환될 수 있다.
- 같은 외부 쓰기를 중복 승인하면 idempotency가 필요하다.

### Open Decisions

- `DEC-M6-12`: approval_request를 run 단위로 묶어 보여줄지 요청 단위로 보여줄지 결정 필요.

## DEV-M6-T13 / Dev Mode token, scope, local access

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `Security` |
| Screens | `SCR-11`, `SCR-12` |
| Objects | `dev_token`, `audit_log`, `approval_request` |
| Depends on | `DEV-M6-T04`, `DEV-M6-T12` |
| Blocks | `M7 Dev Mode help`, `local TUI/MCP integration` |
| Source docs | [설정 Dev Mode](../../screens/11-settings.md#14-dev-mode-상세-요구사항), [도움말 계약](../../screen-contracts.md#scr-12--도움말--help) |

### 목적

로컬 TUI, MCP client, HTTP API가 개인 허브에 접근할 수 있게 하되 token scope, 만료, 접근 방식, audit log로 통제한다.

### 구현 범위

- Dev token 생성/폐기 API.
- token 원문 1회 표시와 fingerprint 저장.
- access method 토글: TUI, MCP, HTTP API.
- scope 설계: `topic:read`, `file:write`, `memory:append`, `agent:test`, `run:control`, `credential:none` 등.
- local endpoint health 표시.
- token별 audit log, rate limit placeholder.

### 제외 범위

- 실제 TUI 앱 구현.
- MCP server 전체 구현.
- 외부 공개 API gateway.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T13-S01` | dev token lifecycle API | `BE` | 생성 응답에서 원문 token 1회 표시, 이후 fingerprint만 조회됨 |
| `DEV-M6-T13-S02` | Dev Mode settings UI | `FE` | token 목록, scope, access method, endpoint health, audit log가 표시됨 |
| `DEV-M6-T13-S03` | scope enforcement skeleton | `Security` | token 요청의 scope와 accessMethod가 API preflight에 전달됨 |
| `DEV-M6-T13-S04` | token revoke 영향 처리 | `Fullstack` | 폐기 후 새 요청 거부, 진행 중 write 요청 처리 정책이 적용됨 |

### Acceptance Criteria

- [ ] Dev token 원문은 생성 완료 화면을 닫으면 다시 조회할 수 없다.
- [ ] 기본 scope는 read-only 또는 최소 scope다.
- [ ] write scope는 approval/audit 정책과 연결된다.
- [ ] token 사용 로그는 token fingerprint, path, method, scope, result, latency를 남긴다.

### Test / Verification

- [ ] token 생성 후 read API에서 원문이 없는지 확인.
- [ ] scope 없는 write 요청이 차단되는지 테스트.
- [ ] token revoke 후 새 요청이 거부되는지 검증.

### Edge Cases

- 사용자가 token 원문을 복사하지 않고 닫을 수 있다.
- token 폐기와 동시에 write 요청이 처리 중일 수 있다.
- MCP client가 local process인지 remote process인지 구분이 어려울 수 있다.

### Open Decisions

- `DEC-M6-13`: Dev token 기본 만료일을 30일/90일/사용자 선택 중 무엇으로 둘지 결정 필요.

## DEV-M6-T14 / Agent registry 목록/상세 baseline

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-05` |
| Objects | `agent`, `agent_version`, `connection`, `run`, `model_route` |
| Depends on | `DEV-M6-T03`, `DEV-M6-T09`, `DEV-M1-T10` |
| Blocks | `DEV-M6-T15`, `DEV-M6-T16`, `DEV-M6-T20` |
| Source docs | [에이전트 계약](../../screen-contracts.md#scr-05--에이전트--agents), [에이전트 상세](../../screens/05-agents.md) |

### 목적

에이전트 목록과 상세에서 역할, 모델, 도구, 연결 상태, 실행 가능 여부, 최근 run/비용을 파악할 수 있는 registry baseline을 만든다.

### 구현 범위

- `GET /api/agents` 목록 API.
- 검색/필터/정렬, 탭: 내 에이전트, 갤러리, 템플릿, 실행 기록, 분석.
- agent 카드: status, role, model, tool count, connection warning, cost summary, recent run.
- 우측 상세 패널: overview, builder, settings, test chat placeholder, run history summary.
- 새 에이전트 만들기/복제/비활성화 action skeleton.

### 제외 범위

- builder canvas 상세 편집.
- 실제 agent test run.
- marketplace/gallery 외부 공유.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T14-S01` | agent list/detail API | `BE` | agent 카드와 상세 패널에 필요한 summary 응답이 정의됨 |
| `DEV-M6-T14-S02` | registry page UI | `FE` | 카드 그리드, 탭, 검색/필터, 상세 패널이 렌더링됨 |
| `DEV-M6-T14-S03` | connection/model warning 계산 | `Fullstack` | 비활성 connection/provider/cost_blocked 상태가 agent 카드에 표시됨 |
| `DEV-M6-T14-S04` | create/duplicate/inactive skeleton | `Fullstack` | draft 생성, 복제, 비활성화 action이 후속 lifecycle task로 연결됨 |

### Acceptance Criteria

- [ ] agent 목록 key는 `agent.id`를 사용한다.
- [ ] inactive/error/archived agent는 실행 액션이 비활성화된다.
- [ ] provider/connection 만료가 agent 카드와 상세에 표시된다.
- [ ] 템플릿 복제는 활성 agent가 아니라 draft를 만든다.

### Test / Verification

- [ ] active/inactive/error/archived fixture 렌더링.
- [ ] connection expired fixture에서 test/deploy 버튼 disabled 확인.
- [ ] create/duplicate action이 draft 생성 API로 이어지는지 검증.

### Edge Cases

- draft만 있고 deployed version이 없는 agent.
- deployed version은 정상이나 draft가 invalid인 agent.
- agent가 사용하는 model route가 삭제되었거나 unavailable 상태.

### Open Decisions

- `DEC-M6-14`: 갤러리/템플릿을 MVP에서 같은 탭으로 합칠지 분리할지 결정 필요.

## DEV-M6-T15 / Agent version lifecycle와 impact analysis

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-05`, `SCR-13` |
| Objects | `agent`, `agent_version`, `schedule`, `run`, `connection` |
| Depends on | `DEV-M6-T14`, `DEV-M6-T12` |
| Blocks | `DEV-M6-T16`, `DEV-M6-T19` |
| Source docs | [공통 agent_version](../../common/domain-model-and-state-policy.md#49-agent), [빌더 lifecycle](../../screens/13-agent-builder-canvas.md#8-테스트--배포--초안-lifecycle) |

### 목적

agent draft, test, deployed version을 분리하고, 변경/비활성화/배포 전 기존 run/schedule/connection에 미치는 영향을 계산한다.

### 구현 범위

- agent status: `draft`, `active`, `inactive`, `error`, `archived`, `deleted`.
- agent_version status: `draft`, `validating`, `test_ready`, `testing`, `test_failed`, `test_passed`, `deploying`, `deployed`, `superseded`, `archived`.
- draft 생성: new/template/deployed에서 새 draft.
- version detail/restore/rollback metadata.
- `GET /api/agents/{agentId}/impact` 영향 분석.

### 제외 범위

- graph patch 저장.
- 실제 deploy.
- schedule 실행 엔진 수정.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T15-S01` | agent/version state model | `BE` | canonical 상태와 허용 transition이 구현/문서화됨 |
| `DEV-M6-T15-S02` | draft creation API | `BE` | new/template/deployed source에서 draft version 생성 가능 |
| `DEV-M6-T15-S03` | impact analysis API | `BE` | 영향받는 schedule, active run, model route, connection을 조회 가능 |
| `DEV-M6-T15-S04` | registry lifecycle UI | `FE` | draft/deployed/superseded 상태가 구분되어 표시됨 |

### Acceptance Criteria

- [ ] draft 저장만으로 deployed agent가 바뀌지 않는다.
- [ ] 진행 중 run은 시작 당시 agent version snapshot을 유지한다.
- [ ] agent 비활성화 전 영향받는 schedule/run이 표시된다.
- [ ] rollback 후보는 connection/permission 재검증 대상이다.

### Test / Verification

- [ ] draft -> test_ready -> test_passed -> deployed 상태 전이 테스트.
- [ ] deployed version에서 새 draft 생성 시 기존 deployed가 유지되는지 검증.
- [ ] impact API가 schedule/run/connection 참조를 반환하는지 fixture 테스트.

### Edge Cases

- 두 브라우저에서 같은 draft를 동시에 편집할 수 있다.
- deployed version rollback이 현재 permission policy 때문에 불가능할 수 있다.
- draft가 삭제되었지만 registry가 stale draftVersionId를 들고 있을 수 있다.

### Open Decisions

- `DEC-M6-15`: graph를 agent_version blob으로 저장할지 node/edge 별도 리소스로 저장할지 결정 필요.

## DEV-M6-T16 / Builder graph/node/edge patch 저장

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-13` |
| Objects | `agent_version`, `agent_node`, `agent_edge`, `connection` |
| Depends on | `DEV-M6-T15`, `DEV-M6-T09`, `DEV-M1-T08` |
| Blocks | `DEV-M6-T17`, `DEV-M6-T18` |
| Source docs | [빌더 graph API](../../screens/13-agent-builder-canvas.md#113-api-후보), [공통 conflict](../../common/domain-model-and-state-policy.md#8-concurrencyconflict-정책) |

### 목적

무한캔버스의 graph, node, edge, layout 변경을 draft version에만 저장하고 autosave/수동 저장/충돌 처리를 지원한다.

### 구현 범위

- `GET /api/agents/{agentId}/builder`.
- `PATCH /api/agents/{agentId}/versions/{versionId}/graph`.
- node type 후보: start, llm, tool_call, condition, search, scrap_read, map_update, approval, schedule, code.
- edge type 후보: success, condition, approval_approved, approval_rejected, fallback.
- autosave debounce, local pending, version conflict diff.
- read-only deployed/previous version 보기.

### 제외 범위

- graph validation.
- test run.
- deploy.
- 대규모 graph virtualization 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T16-S01` | graph schema/API | `BE` | nodes, edges, layout, version, updatedAt 기반 patch 저장 가능 |
| `DEV-M6-T16-S02` | canvas shell UI | `FE` | 팔레트, 캔버스, 미니맵, 줌, 우측 설정 패널 기본 렌더링 |
| `DEV-M6-T16-S03` | node/edge edit forms | `FE` | LLM/tool/condition/approval/schedule 핵심 config 편집 가능 |
| `DEV-M6-T16-S04` | autosave/conflict handling | `Fullstack` | patch 충돌 시 node/edge 단위 diff 또는 overwrite 선택 제공 |

### Acceptance Criteria

- [ ] graph 저장은 draft version에만 반영된다.
- [ ] deployed/previous version은 기본 read-only다.
- [ ] node/edge key는 `nodeId`, `edgeId`를 사용한다.
- [ ] autosave 실패 시 local pending 상태가 표시되고 draft가 즉시 폐기되지 않는다.

### Test / Verification

- [ ] node 추가/수정/삭제, edge 추가/수정/삭제 patch 테스트.
- [ ] version conflict fixture에서 충돌 UI 표시 검증.
- [ ] deployed version 편집 시도 차단 테스트.

### Edge Cases

- 중복 node name은 허용하되 nodeId 기준으로 식별해야 한다.
- graph patch 중 hub 전환 또는 route 이동이 발생할 수 있다.
- edge가 삭제된 node를 참조하는 stale 상태가 생길 수 있다.

### Open Decisions

- `DEC-M6-16`: MVP에서 undo/redo를 local edit history로 둘지 version restore만 제공할지 결정 필요.

## DEV-M6-T17 / Builder validation engine

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-13`, `SCR-05`, `SCR-06` |
| Objects | `agent_version`, `agent_node`, `agent_edge`, `connection`, `approval_policy` |
| Depends on | `DEV-M6-T16`, `DEV-M6-T12`, `DEV-M6-T08` |
| Blocks | `DEV-M6-T18`, `DEV-M6-T19` |
| Source docs | [빌더 테스트 정책](../../screens/13-agent-builder-canvas.md#83-테스트-정책), [빌더 edge case](../../screens/13-agent-builder-canvas.md#9-승인-노드--조건-분기-edge-case) |

### 목적

invalid graph, 권한 없는 tool, 만료 credential, fallback loop, schema mismatch를 test/deploy 전에 검출한다.

### 구현 범위

- `POST /api/agents/{agentId}/versions/{versionId}/validate`.
- graph structural validation: start node, unreachable node, missing required config, edge target existence.
- schema validation: source output과 target input mapping.
- permission validation: connection rule >= agent/node override 금지.
- approval validation: external write/cost/schedule/delete에는 approval node 또는 policy 필요.
- cycle/loop validation: loop limit, timeout, max iteration 필요.

### 제외 범위

- 실제 graph 실행.
- LLM prompt 품질 평가.
- 모든 JSON schema 자동 생성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T17-S01` | structural validation | `BE` | start, required config, orphan node, missing edge가 error/warning으로 분류됨 |
| `DEV-M6-T17-S02` | schema/edge validation | `BE` | mapping 불가 edge와 default edge 누락이 검출됨 |
| `DEV-M6-T17-S03` | permission/cost/approval validation | `Security` | connection, credential, approval policy, cost limit이 deploy 전 검증됨 |
| `DEV-M6-T17-S04` | validation UI | `FE` | 문제 node/edge 하이라이트와 배포 버튼 상태가 갱신됨 |

### Acceptance Criteria

- [ ] invalid graph는 deploy할 수 없다.
- [ ] 외부 쓰기 tool에 approval node/policy가 없으면 validation error다.
- [ ] credential expired node는 warning 또는 error로 표시되고 연결 복구 CTA를 제공한다.
- [ ] validation 결과는 node/edge 단위로 UI에서 찾을 수 있다.

### Test / Verification

- [ ] start node 없음, missing target, schema mismatch, cycle without limit fixture 테스트.
- [ ] connection rule보다 node permission이 넓은 경우 차단 테스트.
- [ ] validation 결과가 builder.draft 상태와 배포 버튼에 반영되는지 검증.

### Edge Cases

- cycle이 항상 나쁜 것은 아니지만 limit 없는 cycle은 위험하다.
- 승인됨 edge는 있는데 거절됨 edge가 없을 수 있다.
- fallback edge가 provider fallback loop와 결합될 수 있다.

### Open Decisions

- `DEC-M6-17`: validation warning만 있는 graph를 강제 deploy 허용할지 결정 필요.

## DEV-M6-T18 / Builder test run과 node log

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-13`, `SCR-03`, `SCR-05` |
| Objects | `run`, `agent_version`, `agent_node`, `run_log`, `usage_summary` |
| Depends on | `DEV-M6-T17`, `DEV-M6-T11`, `M4 run foundation` |
| Blocks | `DEV-M6-T19`, `DEV-M6-T20` |
| Source docs | [빌더 테스트 정책](../../screens/13-agent-builder-canvas.md#83-테스트-정책), [에이전트 테스트 채팅](../../screens/05-agents.md#테스트-채팅), [공통 run](../../common/domain-model-and-state-policy.md#47-run) |

### 목적

builder graph snapshot을 기준으로 test run을 실행하고, node별 status/log/token/cost를 실시간으로 보여준다.

### 구현 범위

- `POST /api/agents/{agentId}/versions/{versionId}/test-runs`.
- test input modal과 test run 시작.
- test run type/badge: `test`, `canvas_test`.
- node log API: status, duration, token, cost, input/output sample, masked payload.
- test run event: node started/completed/failed, approval requested mock/live mode.
- test result와 현재 draft version 차이 표시.

### 제외 범위

- 실제 장시간 multi-agent 실행 완성.
- partial downstream rerun.
- live external write test 기본 허용.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T18-S01` | test run API | `BE` | graph snapshot 기준 test run 생성과 status 조회 가능 |
| `DEV-M6-T18-S02` | node log/event stream | `BE` | node별 started/completed/failed 이벤트와 로그 저장 |
| `DEV-M6-T18-S03` | builder test UI | `FE` | 노드 상태, 로그, token/cost, 현재 draft와 test snapshot 차이 표시 |
| `DEV-M6-T18-S04` | test cost/approval 처리 | `Fullstack` | test run 비용 집계, 외부 쓰기 mock/approval 정책 적용 |

### Acceptance Criteria

- [ ] test run은 graph snapshot 기준으로 실행되고 실행 중 draft 수정은 반영되지 않는다.
- [ ] test run 비용은 usage summary에 포함된다.
- [ ] test node log는 credential/token 원문을 노출하지 않는다.
- [ ] 외부 쓰기 tool은 기본 mock 또는 approval_required로 처리된다.

### Test / Verification

- [ ] test run 생성 후 node event 순서와 UI 상태 갱신 검증.
- [ ] draft 수정 후 기존 test result에 “현재 초안과 다름” 표시 검증.
- [ ] credential 원문 포함 payload fixture가 log에서 마스킹되는지 확인.

### Edge Cases

- test run 중 사용자가 graph를 수정/저장할 수 있다.
- approval node test는 mock과 live approval 중 정책이 필요하다.
- provider timeout 후 fallback edge가 실행될 수 있다.

### Open Decisions

- `DEC-M6-18`: MVP test run에서 외부 쓰기를 전부 mock으로 둘지 승인 후 live 실행을 허용할지 결정 필요.

## DEV-M6-T19 / Publish/deploy/rollback와 registry sync

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-13`, `SCR-05`, `SCR-03` |
| Objects | `agent`, `agent_version`, `run`, `schedule`, `audit_log` |
| Depends on | `DEV-M6-T18`, `DEV-M6-T15`, `DEV-M6-T12` |
| Blocks | `DEV-M6-T20`, `agent runtime hardening` |
| Source docs | [빌더 배포 정책](../../screens/13-agent-builder-canvas.md#84-배포-정책), [Agent Registry 연계](../../screens/13-agent-builder-canvas.md#101-agent-registry-연계) |

### 목적

검증/테스트/영향 분석을 통과한 draft를 deployed version으로 발행하고 registry, run, schedule의 version 참조를 안전하게 동기화한다.

### 구현 범위

- `POST /api/agents/{agentId}/versions/{versionId}/deploy`.
- deploy preflight: validation, latest test, cost, permission, connection health, impact.
- deployed version 전환: 기존 deployed -> superseded, 새 version -> deployed.
- registry 카드/상세 sync event `agent.version.deployed`.
- rollback API와 이전 version에서 새 draft 생성.
- deploy/rollback audit log.

### 제외 범위

- blue/green agent runtime.
- schedule occurrence migration 고도화.
- version diff UI 고급화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T19-S01` | deploy preflight API | `BE` | validation/test/impact/cost/permission/connection 결과가 deploy 전 반환됨 |
| `DEV-M6-T19-S02` | version deploy transaction | `BE` | 새 deployed와 기존 superseded 전환이 원자적으로 처리됨 |
| `DEV-M6-T19-S03` | registry sync UI/event | `Fullstack` | 배포 후 agent 카드와 상세가 최신 deployed version을 반영함 |
| `DEV-M6-T19-S04` | rollback/version restore | `Fullstack` | 이전 deployed로 rollback 또는 새 draft 생성 가능 |

### Acceptance Criteria

- [ ] validation error 또는 test 미통과 상태에서는 deploy가 차단된다.
- [ ] deploy 후 기존 진행 중 run은 시작 당시 version snapshot을 유지한다.
- [ ] 신규 run과 schedule 다음 실행은 새 deployed version을 사용한다.
- [ ] rollback version도 현재 permission/connection/cost 정책을 재검증한다.

### Test / Verification

- [ ] deploy transaction success/failure 상태 전이 테스트.
- [ ] deploy 후 registry card, builder header, agent detail version이 갱신되는지 검증.
- [ ] rollback 불가 connection expired fixture 테스트.

### Edge Cases

- 배포 중 connection이 expired될 수 있다.
- schedule 실행과 deploy가 동시에 발생할 수 있다.
- deploy audit log 저장 실패 시 deploy를 fail-closed할지 결정이 필요하다.

### Open Decisions

- `DEC-M6-19`: deploy audit log 실패 시 배포를 fail-closed로 둘지 후처리 보상으로 둘지 결정 필요.

## DEV-M6-T20 / M6 E2E, 보안, 회귀 검수

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `QA`, `Security` |
| Screens | `SCR-05`, `SCR-06`, `SCR-11`, `SCR-13` |
| Objects | `connection`, `credential`, `model_route`, `agent`, `agent_version`, `dev_token` |
| Depends on | `DEV-M6-T01` ~ `DEV-M6-T19` |
| Blocks | `M7`, `agent runtime hardening` |
| Source docs | [M6 완료 기준](#4-m6-완료-기준), [위험 Register](#5-위험-register), [검수 체크리스트](../00-task-format.md#11-검수-체크리스트) |

### 목적

M6의 provider/credential/model route/agent builder가 실제 사용자 동선으로 연결되는지 검수하고 보안 회귀를 막는다.

### 구현 범위

- E2E 시나리오 5개:
  - OpenRouter key 저장 -> catalog sync -> route 설정.
  - Local Codex OAuth expired -> 재인증 -> route 복구.
  - Direct Provider partial 연결 -> 미연결 provider 저장 차단.
  - agent draft 생성 -> graph 편집 -> validate -> test -> deploy.
  - Dev token 생성 -> scope 없는 write 차단 -> revoke.
- 보안 검수: credential 원문, OAuth token, Dev token, provider payload redaction.
- 비용/승인 검수: test run 비용, fallback approval, external write approval.
- cross-screen 검수: Connections -> Settings -> Agents -> Builder -> Runs.

### 제외 범위

- 운영 배포 검수.
- provider별 장시간 부하 테스트.
- 대규모 graph 성능 테스트.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M6-T20-S01` | M6 E2E scenario 작성/실행 | `QA` | 5개 핵심 시나리오가 자동 또는 수동 검증 기록을 가진다 |
| `DEV-M6-T20-S02` | security redaction audit | `Security` | response/log/event에 credential/token 원문이 없는지 확인됨 |
| `DEV-M6-T20-S03` | cost/approval regression | `QA` | test cost, fallback approval, external write approval이 검증됨 |
| `DEV-M6-T20-S04` | cross-screen state consistency | `QA` | connection/model/agent/version 상태가 화면 간 일관됨 |

### Acceptance Criteria

- [ ] M6 E2E 5개 시나리오가 통과하거나 blocked 사유가 task/open decision으로 남는다.
- [ ] credential/API key/OAuth/Dev token 원문이 API response, browser state fixture, log, event에 없다.
- [ ] invalid graph와 cost/approval 위반은 deploy/test/run 전에 차단된다.
- [ ] M7 도움말/Dev Mode 문서화가 참조할 route와 상태가 준비된다.

### Test / Verification

- [ ] `rg` 또는 테스트 fixture 검사로 secret-like sample이 문서/fixture/log에 남지 않는지 확인.
- [ ] E2E 또는 수동 검수 스크립트로 5개 시나리오 실행.
- [ ] connection 만료 event가 agent/builder/settings에 반영되는지 확인.

### Edge Cases

- 여러 화면이 같은 connection status를 서로 다른 시점의 stale 값으로 볼 수 있다.
- provider 장애 중 deploy를 시도할 수 있다.
- Dev token revoke 직후 진행 중 요청 처리 정책이 흔들릴 수 있다.

### Open Decisions

- `DEC-M6-20`: M6 검수 자동화를 Playwright 중심으로 할지 API contract test 중심으로 시작할지 결정 필요.
