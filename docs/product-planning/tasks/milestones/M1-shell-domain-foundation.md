# M1 Shell + Domain Foundation

이 문서는 개인형 Agent 플랫폼 신규 프로젝트의 첫 foundation 구현 태스크다. 목표는 이후 `M2~M7` 화면과 기능이 같은 route shell, scope, 객체명, 상태 enum, API/event 계약 위에서 개발되도록 최소 기반을 만드는 것이다.

## 1. 작업 전제

| 항목 | 기준 |
| --- | --- |
| 프로젝트 방향 | 신규 프로젝트를 처음부터 구축한다. |
| 기존 프로젝트 | `trip-plan`, `todo-ai`, `mind-plan`, `templates`는 feature/pattern reference-only다. |
| 금지 | 기존 앱의 route, component, API, DB schema를 그대로 가져오는 전제로 task를 작성하지 않는다. |
| 허용 | 필요한 경우 reference check subtask로 기존 앱의 UX, 폴더 구조, streaming 방식, domain adapter 패턴을 확인한다. |
| 구현 목표 | codebase bootstrap, shell, route, canonical domain contract, API skeleton, event stream skeleton을 신규 작성한다. |

## 2. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [00-task-format.md](../00-task-format.md) |
| 기획 진입점 | [README.md](../../README.md) |
| 화면 계약 | [screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [implementation-plan.md](../../common/implementation-plan.md) |
| 화면 간 동선 | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md) |
| 객체/상태 정책 | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| architecture reference | [01_TARGET_ARCHITECTURE.md](../../../../templates/docs/01_TARGET_ARCHITECTURE.md) |
| data model reference | [02_CORE_DATA_MODEL.md](../../../../templates/docs/02_CORE_DATA_MODEL.md) |
| backend reference | [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md) |
| frontend reference | [04_FRONTEND_BLUEPRINT.md](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md) |

## 3. M1 완료 기준

- [ ] 신규 프로젝트의 FE/BE package/module 후보가 문서화되고 bootstrap task가 완료된다.
- [ ] 15개 주요 route placeholder가 같은 app shell에서 열린다.
- [ ] sidebar menu order, active state, disabled state, badge contract가 구현 가능한 형태로 고정된다.
- [ ] `hubId`, `workspaceId`, `scopeType`, `scopeId` 경계가 FE/BE 요청 계약에 반영된다.
- [ ] canonical object 이름과 enum/status가 FE/BE에서 같은 의미로 사용된다.
- [ ] API skeleton은 목록/상세/쓰기/impact/idempotency/version/permission summary 원칙을 포함한다.
- [ ] SSE/event stream skeleton은 common event envelope와 reconnect/fallback 정책을 포함한다.
- [ ] empty/loading/error/permission state가 route, list, detail, panel 단위로 공통 처리된다.
- [ ] M2~M7 worker가 의존할 foundation task ID가 명확하다.

## 4. M2~M7 Foundation Dependency Map

| 후속 milestone | 필요한 M1 task |
| --- | --- |
| `M2 Control Tower MVP` | `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10` |
| `M3 Workspace Bridge` | `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T12` |
| `M4 Execution Core` | `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `DEV-M1-T11`, `DEV-M1-T12` |
| `M5 Knowledge Core` | `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `DEV-M1-T11` |
| `M6 Agent + Connection Core` | `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `DEV-M1-T11`, `DEV-M1-T12` |
| `M7 Visual Planning + Help` | `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T10`, `DEV-M1-T13` |

## 5. Open Decisions

| ID | 결정 필요 항목 | 기본 제안 | 막히는 작업 |
| --- | --- | --- | --- |
| `DEC-M1-01` | 신규 프로젝트 package/app name | BE `app.personalagent.platform`, FE `personal-agent-platform` 후보 | `DEV-M1-T02`, `DEV-M1-T03`, `DEV-M1-T04` |
| `DEC-M1-02` | 초기 DB | local dev는 SQLite, 운영/k8s는 PostgreSQL 확장 가능 구조 | `DEV-M1-T03`, `DEV-M1-T07`, `DEV-M1-T08` |
| `DEC-M1-03` | FE framework | React + TypeScript를 기본으로 시작 | `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T10` |
| `DEC-M1-04` | BE runtime | Kotlin + Spring Boot를 기본으로 시작 | `DEV-M1-T03`, `DEV-M1-T08`, `DEV-M1-T09` |
| `DEC-M1-05` | event transport | MVP는 SSE, 필요 시 WebSocket adapter 추가 | `DEV-M1-T09` |
| `DEC-M1-06` | `workspace`와 `topic` 용어 관계 | 사용자 노출은 `주제`, 내부 scope는 `topic/workspace` 병행 가능 | `DEV-M1-T06`, `DEV-M1-T07` |

## 6. Tasks

## DEV-M1-T01 / Reference-only 검토와 신규 구축 경계 확정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `XS` |
| Area | `Docs` |
| Screens | `ALL` |
| Objects | `topic`, `conversation`, `run` |
| Depends on | `None` |
| Blocks | `DEV-M1-T02`, `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T07` |
| Source docs | [implementation-plan.md](../../common/implementation-plan.md), [01_TARGET_ARCHITECTURE.md](../../../../templates/docs/01_TARGET_ARCHITECTURE.md), [02_CORE_DATA_MODEL.md](../../../../templates/docs/02_CORE_DATA_MODEL.md), [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md), [04_FRONTEND_BLUEPRINT.md](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md) |

### 목적

신규 프로젝트의 첫 작업자가 reference와 구현 대상을 혼동하지 않게 한다.

### 구현 범위

- `templates`에서 참고할 architecture, data model, backend package, frontend layout 패턴을 목록화한다.
- 기존 앱을 확인해야 할 경우 `reference check` 항목으로만 기록한다.
- M1에서 새로 작성할 package/module/route/API/event 범위를 명확히 분리한다.

### 제외 범위

- 기존 앱 코드 이동.
- 기존 route/API/component 이름을 신규 프로젝트 표준으로 확정.
- DB migration 작성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T01-S01` | reference source 목록 정리 | `Docs` | 참고 문서와 참고 목적이 표로 정리된다. |
| `DEV-M1-T01-S02` | 신규 구축 경계 문구 작성 | `Docs` | M1 구현자가 기존 앱을 구현 소스로 오해하지 않는 기준이 명시된다. |
| `DEV-M1-T01-S03` | reference check 항목 분리 | `Docs` | 확인할 UX/pattern과 신규 구현할 산출물이 분리된다. |

### Acceptance Criteria

- [ ] `trip-plan`, `todo-ai`, `mind-plan`, `templates`가 reference-only임이 문서에 명시된다.
- [ ] 신규 프로젝트에서 직접 작성할 shell/domain/API/event 범위가 표시된다.
- [ ] 후속 task가 기존 코드 경로를 구현 경로로 전제하지 않는다.

### Test / Verification

- [ ] `rg -n "trip-plan|todo-ai|mind-plan|templates" docs/product-planning/tasks/milestones/M1-shell-domain-foundation.md`로 reference-only 문맥인지 확인한다.
- [ ] 각 후속 task의 `Depends on`이 기존 앱 경로가 아니라 M1 task ID를 참조하는지 확인한다.

### Edge Cases

- reference 문서의 `workspace/data_space` 용어와 PRD의 `topic` 용어가 충돌할 수 있다.
- templates의 SQLite 기준을 운영 DB 확정으로 오인할 수 있다.
- reference check가 구현 작업으로 확대될 수 있다.

### Open Decisions

- `DEC-M1-01`: 신규 package/app name.
- `DEC-M1-02`: 초기 DB 선택.

## DEV-M1-T02 / 신규 프로젝트 Bootstrap과 모듈 골격 생성

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `ALL` |
| Objects | `hub`, `topic`, `conversation` |
| Depends on | `DEV-M1-T01` |
| Blocks | `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T08`, `DEV-M1-T09` |
| Source docs | [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md), [04_FRONTEND_BLUEPRINT.md](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md) |

### 목적

후속 task가 같은 신규 프로젝트 구조 안에서 작업하도록 FE/BE의 초기 디렉터리와 실행 단위를 만든다.

### 구현 범위

- BE 신규 package/module 후보를 만든다.
- FE 신규 app package와 route shell 엔트리 후보를 만든다.
- local dev 실행, build, test 명령 후보를 문서화한다.
- k8s 배포를 염두에 두고 환경변수와 profile 경계를 초기에 둔다.

### 제외 범위

- 실제 provider 연동.
- 실제 DB entity 전체 구현.
- 화면 feature 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T02-S01` | BE package layout 후보 생성 | `BE` | `common`, `hub`, `navigation`, `conversation`, `domain`, `event`, `security` 같은 foundation package가 생성된다. |
| `DEV-M1-T02-S02` | FE app layout 후보 생성 | `FE` | app shell, routes, shared UI, domain types, API client 폴더가 생성된다. |
| `DEV-M1-T02-S03` | local env skeleton 작성 | `Infra` | API base URL, profile, event endpoint, feature flag 후보가 env template에 정리된다. |
| `DEV-M1-T02-S04` | build/test command 기준 작성 | `Fullstack` | 신규 프로젝트에서 최소 build/test command가 실행 가능하거나 blocked 사유가 기록된다. |

### Acceptance Criteria

- [ ] 빈 프로젝트에서 backend와 frontend가 독립적으로 실행 가능한 골격을 가진다.
- [ ] package/module 이름이 `DEC-M1-01`에 맞춰 일관된다.
- [ ] 후속 task가 새 폴더 구조 안에서 파일 위치를 예측할 수 있다.
- [ ] local/k8s profile에 필요한 설정 key 후보가 분리된다.

### Test / Verification

- [ ] backend build 또는 최소 compile command를 실행한다.
- [ ] frontend build 또는 typecheck command를 실행한다.
- [ ] 신규 package 안에 기존 앱 import/path가 없는지 검색한다.

### Edge Cases

- FE와 BE가 서로 다른 route prefix/API prefix를 잡으면 M2에서 연결 비용이 커진다.
- env key가 provider credential 원문을 browser bundle에 노출할 수 있다.
- package name을 늦게 바꾸면 generated code와 import churn이 커진다.

### Open Decisions

- `DEC-M1-01`: package/app name 확정.
- `DEC-M1-03`: FE framework 확정.
- `DEC-M1-04`: BE runtime 확정.

## DEV-M1-T03 / Backend Foundation Module과 Health/Session API Skeleton

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `ALL` |
| Objects | `hub`, `credential`, `audit_log` |
| Depends on | `DEV-M1-T02` |
| Blocks | `DEV-M1-T05`, `DEV-M1-T06`, `DEV-M1-T08`, `DEV-M1-T11` |
| Source docs | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md), [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md) |

### 목적

모든 화면의 초기 조회가 의존할 backend 공통 모듈과 최소 API 응답 형태를 만든다.

### 구현 범위

- health, session, current hub, app config API skeleton을 만든다.
- request id, trace id, actor, hub context를 요청 단위로 들고 다니는 foundation을 만든다.
- 공통 error envelope와 problem code 후보를 만든다.
- credential 원문 비노출, audit fail-closed 같은 보안 기본값을 foundation 정책으로 둔다.

### 제외 범위

- 실제 로그인/OAuth 구현.
- provider credential 저장 구현.
- 화면별 resource CRUD.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T03-S01` | health/config API skeleton | `BE` | `/api/health`, `/api/app-config` 후보가 정의되고 응답 envelope가 고정된다. |
| `DEV-M1-T03-S02` | session/current hub API skeleton | `BE` | `/api/session`, `/api/hubs/current` 후보가 actor와 hub summary를 반환한다. |
| `DEV-M1-T03-S03` | request context foundation | `BE` | request id, actor id, hub id, access method가 service layer까지 전달된다. |
| `DEV-M1-T03-S04` | common error envelope | `BE` | permission, not found, conflict, validation, provider unavailable 오류 형태가 정의된다. |
| `DEV-M1-T03-S05` | security default guard | `BE` | credential/token 원문을 API/log에 싣지 않는 공통 serializer/logging 기준이 생긴다. |

### Acceptance Criteria

- [ ] FE shell이 session/current hub/app config를 호출해 초기 상태를 구성할 수 있다.
- [ ] 모든 API skeleton은 request id를 응답 또는 error에 포함한다.
- [ ] 권한 없음, hub 없음, feature disabled, server error가 구분된다.
- [ ] credential/token 원문은 응답 schema에 포함되지 않는다.

### Test / Verification

- [ ] health/session/config API에 대한 unit 또는 controller test가 있다.
- [ ] error envelope snapshot 또는 contract test가 있다.
- [ ] credential/token 문자열이 로그/응답 fixture에 포함되지 않는지 확인한다.

### Edge Cases

- hub가 아직 없을 때 onboarding empty state로 연결되어야 한다.
- session은 있지만 current hub 권한이 없을 수 있다.
- config API가 provider key나 OAuth path를 과도하게 노출할 수 있다.

### Open Decisions

- `DEC-M1-02`: 초기 DB와 session 저장 방식.
- `DEC-M1-04`: BE runtime 확정.

## DEV-M1-T04 / Frontend App Shell과 15개 Route Placeholder

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `FE` |
| Screens | `ALL`, `SCR-01`, `SCR-02`, `SCR-03`, `SCR-04`, `SCR-05`, `SCR-06`, `SCR-07`, `SCR-08`, `SCR-09`, `SCR-10`, `SCR-11`, `SCR-12`, `SCR-13`, `SCR-14`, `SCR-15` |
| Objects | `conversation`, `topic`, `run` |
| Depends on | `DEV-M1-T02`, `DEV-M1-T03` |
| Blocks | `DEV-M1-T05`, `DEV-M1-T06`, `DEV-M1-T10`, `M2`, `M3`, `M7` |
| Source docs | [screen-contracts.md](../../screen-contracts.md), [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [04_FRONTEND_BLUEPRINT.md](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md) |

### 목적

15개 화면이 같은 layout, route, fallback 정책 위에서 시작되게 한다.

### 구현 범위

- `/today`, `/topics`, `/runs`, `/memory`, `/agents`, `/connections`, `/scrap`, `/calendar`, `/tasks`, `/files`, `/settings`, `/help` route placeholder를 만든다.
- `/agents/new/builder`, `/agents/:agentId/builder`, `/tasks/map`, `/reports/new`, `/reports/:documentId` route placeholder를 만든다.
- app shell은 sidebar, top context area, main content area, optional detail/chat panel slot을 가진다.
- route not found, deleted resource, permission blocked fallback을 공통 처리할 위치를 만든다.

### 제외 범위

- 실제 화면 내부 feature.
- 실제 chat composer 동작.
- 실제 resource 목록 조회.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T04-S01` | route registry 작성 | `FE` | screen contract의 route 후보가 route registry로 표현된다. |
| `DEV-M1-T04-S02` | app shell layout 작성 | `FE` | sidebar, header/context, main, optional panel slot이 안정된 구조로 렌더링된다. |
| `DEV-M1-T04-S03` | placeholder screen 작성 | `FE` | 15개 screen ID가 placeholder title과 route metadata를 표시한다. |
| `DEV-M1-T04-S04` | fallback route 작성 | `FE` | not found, permission blocked, deleted resource placeholder가 구분된다. |
| `DEV-M1-T04-S05` | responsive shell 기준 작성 | `FE` | desktop sidebar와 mobile drawer 전환 기준이 정리된다. |

### Acceptance Criteria

- [ ] 15개 주요 route와 3개 고급 route가 shell 안에서 열린다.
- [ ] route 이동 시 sidebar active state 계산에 필요한 route metadata가 제공된다.
- [ ] deep link placeholder가 목록/상세 분리 정책을 막지 않는다.
- [ ] unknown route는 가장 가까운 상위 route 또는 not found state로 이동한다.

### Test / Verification

- [ ] route smoke test 또는 Playwright route navigation test가 있다.
- [ ] desktop/mobile viewport에서 sidebar/drawer가 layout을 깨지 않는다.
- [ ] route registry와 screen contract route가 불일치하지 않는지 확인한다.

### Edge Cases

- `/topics/:topicId/workspace`와 `/topics/:topicId`의 active menu는 모두 `topics`여야 한다.
- `/tasks/map`은 `tasks` menu가 활성화되어야 한다.
- placeholder가 너무 많은 임시 텍스트를 넣으면 실제 화면 구현 시 제거 누락 위험이 있다.

### Open Decisions

- `DEC-M1-03`: FE framework 확정.
- `DEC-M1-06`: workspace route를 `/topics/:topicId/workspace`로 고정할지 여부.

## DEV-M1-T05 / Sidebar Navigation Contract와 공통 Navigation API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `ALL` |
| Objects | `navigation`, `approval_request`, `connection`, `run` |
| Depends on | `DEV-M1-T03`, `DEV-M1-T04` |
| Blocks | `M2`, `M4`, `M6`, `M7` |
| Source docs | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [screen-contracts.md](../../screen-contracts.md) |

### 목적

사이드바 메뉴 순서, 활성 상태, disabled reason, badge 표시를 모든 화면에서 같은 데이터 계약으로 처리한다.

### 구현 범위

- navigation item type을 정의한다.
- `GET /api/navigation?hubId=` skeleton 또는 app config 내 navigation field를 정의한다.
- FE sidebar는 navigation item을 기반으로 표시하고, route metadata로 active state를 계산한다.
- approval, error, warning, info badge type 후보를 둔다.

### 제외 범위

- 실제 badge count 계산.
- 실제 permission engine.
- notification center 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T05-S01` | navigation item DTO 정의 | `BE` | `key`, `label`, `route`, `enabled`, `disabledReason`, `badgeCount`, `badgeType`, `requiredPermission`이 정의된다. |
| `DEV-M1-T05-S02` | navigation API skeleton | `BE` | 고정 메뉴 12개를 반환하는 skeleton API가 제공된다. |
| `DEV-M1-T05-S03` | sidebar component 작성 | `FE` | API/fixture 기반으로 12개 메뉴를 표시한다. |
| `DEV-M1-T05-S04` | active state resolver 작성 | `FE` | nested route에서도 최상위 메뉴가 안정적으로 활성화된다. |
| `DEV-M1-T05-S05` | disabled/badge UI state 작성 | `FE` | 비활성 메뉴 사유와 조치 필요 badge가 구분되어 표시된다. |

### Acceptance Criteria

- [ ] 메뉴 순서는 `오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말`이다.
- [ ] disabled menu는 숨기지 않고 사유를 제공한다.
- [ ] badge는 사용자 조치가 필요한 상태만 표현한다.
- [ ] nested route active state가 screen contract와 일치한다.

### Test / Verification

- [ ] navigation API contract test가 있다.
- [ ] sidebar active state unit test가 있다.
- [ ] disabled reason이 빈 문자열이면 표시하지 않고, disabled면 사유가 존재하는지 검증한다.

### Edge Cases

- hub 전환 직후 이전 hub의 badge가 남아 있을 수 있다.
- route가 추가될 때 sidebar active mapping 누락이 발생할 수 있다.
- badge count가 0인데 badge type만 있는 응답이 올 수 있다.

### Open Decisions

- `DEC-M1-06`: `topic/workspace` route active mapping 기준.

## DEV-M1-T06 / Hub, Workspace, Conversation Scope Foundation

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02`, `SCR-03`, `SCR-05`, `SCR-12` |
| Objects | `hub`, `topic`, `conversation` |
| Depends on | `DEV-M1-T03`, `DEV-M1-T04` |
| Blocks | `M2`, `M3`, `M5` |
| Source docs | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |

### 목적

전역 채팅, 주제 채팅, run chat, agent test chat, help chat이 섞이지 않게 scope 계약을 초기부터 고정한다.

### 구현 범위

- `hubId`, `scopeType`, `scopeId`, `conversationId` 타입을 정의한다.
- scope type enum은 `global`, `topic`, `tool`, `agent_test`, `run`, `help`를 포함한다.
- FE route context에서 current hub와 current conversation scope를 계산한다.
- BE message API skeleton이 scope를 필수 입력으로 받는 구조를 둔다.

### 제외 범위

- 실제 message persistence 전체 구현.
- topic promotion 구현.
- run/agent/help chat 기능.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T06-S01` | scope enum 정의 | `Fullstack` | FE/BE에서 동일 의미의 `scopeType` 후보가 정의된다. |
| `DEV-M1-T06-S02` | route-to-scope resolver 작성 | `FE` | route params 기준으로 global/topic/run/agent_test/help scope 후보를 계산한다. |
| `DEV-M1-T06-S03` | conversation create skeleton | `BE` | scope 없는 conversation 생성 요청을 거부하는 skeleton이 있다. |
| `DEV-M1-T06-S04` | current scope UI 표시 | `FE` | shell/header 또는 debug 영역에서 현재 scope를 식별 가능하다. |
| `DEV-M1-T06-S05` | hub switch reset 정책 작성 | `Fullstack` | hub 변경 시 목록/상세/scope 선택 상태 reset 기준이 문서화된다. |

### Acceptance Criteria

- [ ] 모든 chat-related 요청은 `scopeType`과 필요한 `scopeId`를 가진다.
- [ ] `/today`는 `global` scope를 기본으로 한다.
- [ ] `/topics/:topicId`와 workspace route는 `topic` scope를 계산한다.
- [ ] `/runs/:runId`, `/agents/:agentId`, `/help/:articleId`는 각각 별도 scope를 계산할 수 있다.
- [ ] hub 변경 시 이전 hub의 selected resource가 그대로 유지되지 않는다.

### Test / Verification

- [ ] route-to-scope resolver unit test가 있다.
- [ ] scope 없는 conversation/message 요청이 validation error를 반환한다.
- [ ] hub switch 후 URL/resource fallback 정책이 수동 검증된다.

### Edge Cases

- `/agents/new/builder`는 아직 `agentId`가 없으므로 draft scope 또는 no-chat state가 필요하다.
- `/help` 목록은 article scope가 없지만 help conversation을 시작할 수 있다.
- hub 접근 권한이 없어도 URL에 topicId가 남아 있을 수 있다.

### Open Decisions

- `DEC-M1-06`: 신규 topic/workspace 내부 route와 scope name.

## DEV-M1-T07 / Canonical Domain Object, ID Prefix, Status Enum Contract

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `ALL` |
| Objects | `topic`, `conversation`, `source`, `memory`, `file_asset`, `task`, `run`, `schedule`, `agent`, `connection`, `credential`, `document`, `citation`, `approval_request`, `audit_log` |
| Depends on | `DEV-M1-T01`, `DEV-M1-T02` |
| Blocks | `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `M2`, `M3`, `M4`, `M5`, `M6`, `M7` |
| Source docs | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md), [screen-contracts.md](../../screen-contracts.md) |

### 목적

후속 milestone이 객체명, ID prefix, status enum을 임의로 만들지 않게 canonical contract를 코드 수준으로 고정한다.

### 구현 범위

- 주요 object type과 status enum 후보를 FE/BE shared contract 또는 동기화 가능한 위치에 정의한다.
- ID prefix 후보를 constant로 둔다.
- permission state, version, audit-required action 같은 공통 필드를 정의한다.
- 화면 라벨과 API enum을 분리하는 기준을 둔다.

### 제외 범위

- 전체 DB table 구현.
- 모든 객체의 상세 필드 구현.
- enum migration 자동화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T07-S01` | object type registry 작성 | `Fullstack` | canonical object name과 screen usage가 매핑된다. |
| `DEV-M1-T07-S02` | status enum contract 작성 | `Fullstack` | topic/run/source/task 등 핵심 enum이 공통 정책과 일치한다. |
| `DEV-M1-T07-S03` | ID prefix constant 작성 | `Fullstack` | `topic_`, `conv_`, `run_` 등 prefix 후보가 정의된다. |
| `DEV-M1-T07-S04` | common field contract 작성 | `Fullstack` | `id`, `hubId`, `createdAt`, `updatedAt`, `version`, `permissionState` 후보가 정의된다. |
| `DEV-M1-T07-S05` | enum label mapping 작성 | `FE` | API enum과 사용자 표시 라벨을 분리하는 mapping 위치가 생긴다. |

### Acceptance Criteria

- [ ] screen contract의 primary objects가 canonical object registry와 일치한다.
- [ ] run 상태는 `approval_waiting` 등 공통 문서의 API enum을 따른다.
- [ ] list key는 `id` 또는 relation id를 쓰는 원칙이 타입으로 표현된다.
- [ ] 새 객체 생성 요청은 `clientRequestId` 또는 idempotency 후보를 받을 수 있다.

### Test / Verification

- [ ] enum/object registry에 중복 key가 없는지 test한다.
- [ ] screen contract object 목록과 코드 contract 목록을 수동 대조한다.
- [ ] FE label mapping에서 unknown enum fallback이 있는지 확인한다.

### Edge Cases

- `workspace`, `data_space`, `topic` 용어가 서로 섞일 수 있다.
- `waiting_approval`, `approval_waiting` 같은 유사 enum이 새로 생길 수 있다.
- ID prefix는 dedupe 기준이 아니므로 URL/checksum/canonicalUrl과 혼동하면 안 된다.

### Open Decisions

- `DEC-M1-02`: DB 선택과 ID 생성 위치.
- `DEC-M1-06`: `topic/workspace` 내부 명칭.

## DEV-M1-T08 / Common API Skeleton, Envelope, Version, Idempotency

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `ALL` |
| Objects | `topic`, `source`, `task`, `run`, `approval_request`, `audit_log` |
| Depends on | `DEV-M1-T03`, `DEV-M1-T07` |
| Blocks | `M2`, `M3`, `M4`, `M5`, `M6`, `M7` |
| Source docs | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md), [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md) |

### 목적

후속 화면 API가 서로 다른 envelope, paging, version, idempotency 규칙을 만들지 않도록 공통 API skeleton을 만든다.

### 구현 범위

- list/detail/write/impact API shape를 공통으로 정의한다.
- pagination, filter, sort, cursor 후보를 둔다.
- PATCH 요청의 `version` 또는 `If-Match` 기준을 둔다.
- 생성/실행/승인/외부 쓰기 요청의 `idempotencyKey` 기준을 둔다.
- permission summary를 목록 응답에 포함할 수 있는 구조를 둔다.

### 제외 범위

- 모든 resource의 실제 repository 구현.
- 실제 approval engine.
- 실제 impact 계산.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T08-S01` | common response envelope 정의 | `BE` | success/error/list/detail 응답 형태가 정의된다. |
| `DEV-M1-T08-S02` | list query contract 정의 | `BE` | cursor/pageSize/filter/sort 기본 파라미터가 정의된다. |
| `DEV-M1-T08-S03` | write command contract 정의 | `BE` | PATCH/create/delete/execute 요청에 version/idempotency 후보가 있다. |
| `DEV-M1-T08-S04` | impact API skeleton 작성 | `BE` | 위험 변경 전 `/impact` 형태를 resource별로 확장 가능한 구조로 둔다. |
| `DEV-M1-T08-S05` | FE API client foundation 작성 | `FE` | envelope, error, request id, conflict 응답을 해석하는 기본 client가 있다. |

### Acceptance Criteria

- [ ] 목록 응답은 item 배열과 paging metadata를 분리한다.
- [ ] 상세 응답은 목록 경량 필드보다 확장 가능하다.
- [ ] 409 conflict는 최신 version과 사용자 재시도에 필요한 정보를 제공한다.
- [ ] 승인 필요 작업은 원 API에서 `approvalRequest` 또는 `approval_required` 상태를 표현할 수 있다.
- [ ] request id는 FE error UI에서 표시 가능하다.

### Test / Verification

- [ ] envelope serialization/deserialization test가 있다.
- [ ] idempotency key가 없는 위험 요청을 validation error로 처리하는 test 후보가 있다.
- [ ] FE API client가 permission/error/conflict를 구분하는 unit test가 있다.

### Edge Cases

- polling/list 조회와 SSE event가 같은 resource를 갱신하면서 version 충돌이 생길 수 있다.
- idempotency key를 client가 재생성하면 중복 실행 방지가 깨진다.
- impact API가 느리면 삭제/비활성화 UX가 막힐 수 있다.

### Open Decisions

- `DEC-M1-02`: DB와 optimistic locking 방식.
- `DEC-M1-04`: BE runtime 확정.

## DEV-M1-T09 / SSE Event Stream Skeleton과 Event Envelope

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-03`, `SCR-07`, `SCR-08`, `SCR-09`, `SCR-10`, `SCR-13`, `SCR-15` |
| Objects | `run`, `source`, `file_asset`, `schedule`, `approval_request`, `document` |
| Depends on | `DEV-M1-T03`, `DEV-M1-T07`, `DEV-M1-T08` |
| Blocks | `M2`, `M4`, `M5`, `M6`, `M7` |
| Source docs | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md), [05_AI_PROVIDER_AND_STREAMING.md](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md) |

### 목적

run/source/file/schedule/approval/document 같은 비동기 상태가 화면마다 다른 방식으로 갱신되지 않게 event stream skeleton을 만든다.

### 구현 범위

- common event envelope를 정의한다.
- SSE endpoint skeleton을 만든다.
- FE event client와 reconnect/polling fallback 후보를 만든다.
- event type registry를 공통 문서의 이벤트 후보와 맞춘다.
- 역순/중복 event 처리 기준을 둔다.

### 제외 범위

- 실제 AI provider streaming.
- 실제 long-running job.
- WebSocket adapter 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T09-S01` | event envelope 정의 | `BE` | `eventId`, `type`, `hubId`, `resourceType`, `resourceId`, `version`, `occurredAt`, `payload` 후보가 있다. |
| `DEV-M1-T09-S02` | SSE endpoint skeleton | `BE` | hub 또는 conversation scope 기반 event endpoint 후보가 있다. |
| `DEV-M1-T09-S03` | FE event client 작성 | `FE` | subscribe/unsubscribe/reconnect/error callback 구조가 있다. |
| `DEV-M1-T09-S04` | event registry 작성 | `Fullstack` | `run.status_changed`, `source.processing_completed`, `approval.requested` 등 후보가 정의된다. |
| `DEV-M1-T09-S05` | duplicate/out-of-order policy 작성 | `Fullstack` | event id와 version 기준으로 중복/역순 event를 무시하거나 재조회한다. |

### Acceptance Criteria

- [ ] event stream은 hub 또는 scope 단위로 구독할 수 있다.
- [ ] FE는 SSE 연결 실패 시 retry state와 polling fallback 후보를 가진다.
- [ ] event는 resource type/id와 version을 포함해 cache 갱신 대상을 식별한다.
- [ ] 중복 event는 UI에 중복 row/toast를 만들지 않는다.
- [ ] 역순 event는 오래된 version이면 무시하거나 detail refetch를 유도한다.

### Test / Verification

- [ ] event envelope serialization test가 있다.
- [ ] FE event reducer가 중복/역순 event를 처리하는 unit test가 있다.
- [ ] SSE disconnect/reconnect 수동 검증 시나리오가 있다.

### Edge Cases

- 브라우저 탭 여러 개가 같은 hub event를 동시에 받을 수 있다.
- run stop 이후 늦게 도착한 running event가 UI를 되돌릴 수 있다.
- event payload에 credential/provider 민감값이 들어갈 수 있다.

### Open Decisions

- `DEC-M1-05`: MVP event transport.

## DEV-M1-T10 / Empty, Loading, Error, Permission State Foundation

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `FE` |
| Screens | `ALL` |
| Objects | `permissionState`, `connection`, `approval_request` |
| Depends on | `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T08` |
| Blocks | `M2`, `M3`, `M4`, `M5`, `M6`, `M7` |
| Source docs | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md), [screen-contracts.md](../../screen-contracts.md), [04_FRONTEND_BLUEPRINT.md](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md) |

### 목적

화면마다 빈 상태, 로딩, 오류, 권한 부족, 연결 미비, 비용 차단 UI를 새로 만들지 않게 한다.

### 구현 범위

- route/list/detail/panel/job 단위 상태 컴포넌트 후보를 만든다.
- permission disabled state와 disabled reason UI를 만든다.
- request id, retry CTA, settings/deep link CTA 표시 구조를 만든다.
- skeleton loading과 stale cached data 표시 기준을 둔다.

### 제외 범위

- 화면별 맞춤 empty illustration.
- 실제 비용 계산.
- 실제 connection 설정 flow.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T10-S01` | common state component 정의 | `FE` | empty/loading/error/permission/connection/cost state 컴포넌트 후보가 있다. |
| `DEV-M1-T10-S02` | retry/deep link CTA contract | `FE` | retry, settings, connection, approval, fallback route CTA 타입이 정의된다. |
| `DEV-M1-T10-S03` | skeleton layout 기준 작성 | `FE` | shell/list/detail/panel 별 skeleton이 layout shift를 줄인다. |
| `DEV-M1-T10-S04` | API error mapping 작성 | `FE` | common API error를 사용자 상태 UI로 변환한다. |
| `DEV-M1-T10-S05` | accessibility state 기준 작성 | `FE` | focus, aria label, keyboard retry, reduced motion 기준이 포함된다. |

### Acceptance Criteria

- [ ] 최초 빈 상태와 검색 결과 없음이 구분된다.
- [ ] 목록 실패와 상세 실패는 화면 전체를 동시에 비우지 않는다.
- [ ] 권한/연결/비용/일시 장애/데이터 없음이 서로 다른 메시지와 CTA를 가진다.
- [ ] retry 가능한 오류는 request id와 재시도 버튼을 제공한다.
- [ ] disabled action은 사유를 표시한다.

### Test / Verification

- [ ] common state component story 또는 fixture가 있다.
- [ ] API error mapping unit test가 있다.
- [ ] keyboard focus와 screen reader label을 수동 검증한다.

### Edge Cases

- cached list는 있는데 detail 조회가 실패할 수 있다.
- 권한 없음 때문에 빈 목록처럼 보일 수 있다.
- retry 중 기존 결과를 지우면 사용자가 맥락을 잃을 수 있다.

### Open Decisions

- `DEC-M1-03`: FE framework와 component/story 방식.

## DEV-M1-T11 / Permission, Audit, Credential Safety Skeleton

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-03`, `SCR-06`, `SCR-11`, `SCR-13` |
| Objects | `permission_policy`, `credential`, `approval_request`, `audit_log`, `dev_token` |
| Depends on | `DEV-M1-T03`, `DEV-M1-T07`, `DEV-M1-T08` |
| Blocks | `M4`, `M5`, `M6` |
| Source docs | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md), [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md) |

### 목적

외부 쓰기, 삭제, 비용 초과, credential/token 변경이 안전 장치 없이 구현되지 않게 permission/audit skeleton을 먼저 둔다.

### 구현 범위

- effective permission evaluation skeleton을 만든다.
- 위험 action 분류 enum을 만든다.
- audit log command skeleton을 만든다.
- credential/token 원문은 one-time response 외 재조회 금지 원칙을 API contract에 반영한다.
- audit 저장 실패 시 fail-closed 대상 action을 정의한다.

### 제외 범위

- 실제 OAuth/API key 저장소 구현.
- 실제 approval UI.
- 실제 provider 연결.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T11-S01` | dangerous action registry 작성 | `BE` | external write, delete, permission relax, credential, dev token, schedule, cost action이 분류된다. |
| `DEV-M1-T11-S02` | permission evaluation skeleton | `BE` | hub/object/connection/agent/runtime/cost policy를 합산할 확장 지점이 있다. |
| `DEV-M1-T11-S03` | audit log skeleton | `BE` | actor, access method, resource, action, result, request id가 기록 가능한 구조다. |
| `DEV-M1-T11-S04` | credential response safety contract | `BE` | masked label/fingerprint만 재조회되고 원문은 저장 후 노출되지 않는다. |
| `DEV-M1-T11-S05` | fail-closed policy 작성 | `BE` | audit 실패 시 차단할 action 목록이 정의된다. |

### Acceptance Criteria

- [ ] 위험 action은 approval/audit 필요 여부를 계산할 수 있다.
- [ ] credential/token 원문은 common response, event payload, audit log에 포함되지 않는다.
- [ ] permission이 더 넓어지는 변경은 impact/approval 후보로 분류된다.
- [ ] Dev Mode write는 웹 UI action과 같은 permission/audit 기준을 따른다.

### Test / Verification

- [ ] credential masking unit test가 있다.
- [ ] dangerous action registry test가 있다.
- [ ] audit failure 시 fail-closed 대상 action이 실행되지 않는 test 후보가 있다.

### Edge Cases

- audit log 저장 실패를 단순 warning 처리하면 보안 작업이 기록 없이 수행될 수 있다.
- provider fallback이 외부 데이터 전송 범위를 넓힐 수 있다.
- Dev Mode token scope가 과도하면 로컬/TUI/MCP 접근이 웹 권한보다 넓어질 수 있다.

### Open Decisions

- `DEC-M1-02`: audit log 저장소와 보관 정책.

## DEV-M1-T12 / New Project Domain Adapter와 Operation Envelope Skeleton

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `AI` |
| Screens | `SCR-01`, `SCR-02`, `SCR-03`, `SCR-13` |
| Objects | `conversation`, `topic`, `run`, `agent` |
| Depends on | `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T11` |
| Blocks | `M2`, `M3`, `M4`, `M6` |
| Source docs | [01_TARGET_ARCHITECTURE.md](../../../../templates/docs/01_TARGET_ARCHITECTURE.md), [03_BACKEND_BLUEPRINT.md](../../../../templates/docs/03_BACKEND_BLUEPRINT.md), [05_AI_PROVIDER_AND_STREAMING.md](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md) |

### 목적

AI가 DB를 직접 수정하지 않고 operation proposal을 만들고, 서버가 검증/적용하는 구조의 최소 골격을 신규 프로젝트에 둔다.

### 구현 범위

- `DomainAdapter` 또는 동등한 interface 후보를 정의한다.
- `OperationEnvelope`와 operation validation result skeleton을 정의한다.
- chat response와 internal operation block 분리 기준을 둔다.
- operation preview와 apply는 M2 이후 확장 가능하게 skeleton만 둔다.

### 제외 범위

- 실제 모델 provider 연결.
- 실제 operation apply.
- trip/map/todo 같은 특정 domain operation 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T12-S01` | domain adapter interface 후보 작성 | `AI` | context build, operation schema, validate, apply 확장 지점이 정의된다. |
| `DEV-M1-T12-S02` | operation envelope 정의 | `AI` | 사용자 표시 message와 internal operations가 분리된다. |
| `DEV-M1-T12-S03` | operation validation skeleton | `BE` | unknown op, invalid id, permission blocked를 구분할 수 있다. |
| `DEV-M1-T12-S04` | operation preview placeholder | `FE` | 적용 전 변경 요약을 표시할 UI slot이 있다. |
| `DEV-M1-T12-S05` | provider-independent stream mapping 후보 | `Fullstack` | provider event를 app SSE event로 변환할 위치가 정해진다. |

### Acceptance Criteria

- [ ] AI operation은 서버 검증 전 DB 변경으로 이어지지 않는다.
- [ ] 사용자에게 보이는 message와 내부 operation payload가 분리된다.
- [ ] invalid id 또는 불확실한 target은 operation apply 대상이 되지 않는다.
- [ ] provider가 Codex app-server인지 OpenRouter인지 FE가 알 필요 없는 구조다.

### Test / Verification

- [ ] operation envelope parser unit test 후보가 있다.
- [ ] invalid operation validation test 후보가 있다.
- [ ] tool/internal block이 사용자 메시지 UI에 노출되지 않는 fixture가 있다.

### Edge Cases

- 모델이 임의 객체 ID를 만들어낼 수 있다.
- operation preview 없이 자동 적용하면 사용자가 변경 이유를 잃는다.
- provider streaming delta와 final content가 다른 shape로 도착할 수 있다.

### Open Decisions

- `DEC-M1-05`: stream transport.
- `DEC-M1-06`: topic/workspace domain adapter scope.

## DEV-M1-T13 / M1 Foundation Quality Gate와 후속 Milestone Readiness

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `ALL` |
| Objects | `topic`, `conversation`, `run`, `source`, `task`, `agent`, `connection` |
| Depends on | `DEV-M1-T02`, `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `DEV-M1-T11`, `DEV-M1-T12` |
| Blocks | `M2`, `M3`, `M4`, `M5`, `M6`, `M7` |
| Source docs | [12_QUALITY_GATES.md](../../../../templates/docs/12_QUALITY_GATES.md), [00-task-format.md](../00-task-format.md) |

### 목적

M1이 끝났다고 선언하기 전에 후속 milestone이 실제로 foundation 위에서 개발 가능한지 확인한다.

### 구현 범위

- M1 route/API/event/type contract smoke test를 정리한다.
- M2~M7별 readiness checklist를 만든다.
- 신규 프로젝트에서 기존 reference 경로 import가 없는지 확인한다.
- docs와 code contract가 어긋나는 지점을 기록한다.

### 제외 범위

- 후속 milestone feature 구현.
- 전체 e2e 자동화 완성.
- 성능 테스트.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M1-T13-S01` | route readiness 검수 | `FE` | 15개 route placeholder와 sidebar active state가 확인된다. |
| `DEV-M1-T13-S02` | API readiness 검수 | `BE` | health/session/navigation/envelope/event skeleton이 확인된다. |
| `DEV-M1-T13-S03` | domain contract 검수 | `Fullstack` | canonical object/status/ID prefix가 docs와 맞는다. |
| `DEV-M1-T13-S04` | security readiness 검수 | `BE` | credential/token/audit 위험 기준이 확인된다. |
| `DEV-M1-T13-S05` | milestone handoff 작성 | `Docs` | M2~M7 worker가 읽을 dependency와 blocked decision이 정리된다. |

### Acceptance Criteria

- [ ] M2 worker가 Today/Topics를 구현할 수 있는 route, scope, API client, state UI foundation이 있다.
- [ ] M3 worker가 topic/workspace bridge를 설계할 수 있는 scope와 route placeholder가 있다.
- [ ] M4 worker가 task/run/schedule/approval을 구현할 수 있는 status enum, event, permission foundation이 있다.
- [ ] M5 worker가 source/memory/file/document를 구현할 수 있는 object/status/API foundation이 있다.
- [ ] M6 worker가 agent/connection/settings를 구현할 수 있는 credential, audit, permission foundation이 있다.
- [ ] M7 worker가 todo map/help를 구현할 수 있는 route, state, API, accessibility foundation이 있다.

### Test / Verification

- [ ] frontend build/typecheck가 통과하거나 blocked 사유가 기록된다.
- [ ] backend build/test가 통과하거나 blocked 사유가 기록된다.
- [ ] `rg`로 기존 reference app 경로 import가 없는지 확인한다.
- [ ] M1 task의 모든 `Blocks`가 dependency map과 일치하는지 확인한다.

### Edge Cases

- M1 완료 후에도 open decision이 남아 있으면 후속 milestone에서 다른 전제를 잡을 수 있다.
- skeleton API가 너무 구체적이면 후속 구현에서 불필요한 churn이 생길 수 있다.
- route placeholder만 있고 data scope가 없으면 M2에서 chat/topic 연결이 다시 흔들릴 수 있다.

### Open Decisions

- `DEC-M1-01`: package/app name 미확정 시 M2 착수 전 확정 필요.
- `DEC-M1-02`: DB 선택 미확정 시 persistence task는 blocked.
- `DEC-M1-05`: event transport 미확정 시 run/source streaming 구현은 blocked.

## 7. M1 검수 체크리스트

- [ ] 모든 task ID가 `DEV-M1-Tnn` 형식이고 중복되지 않는다.
- [ ] 모든 task size는 `XS`, `S`, `M` 중 하나다.
- [ ] 각 task는 subtasks, acceptance criteria, verification, edge cases, open decisions를 포함한다.
- [ ] 기존 프로젝트는 feature/pattern reference-only로만 언급된다.
- [ ] 신규 project package/module, shell, route, domain model, state enum, API skeleton, event stream skeleton이 포함된다.
- [ ] M2~M7 dependency가 M1 task ID로 명확히 표시된다.
