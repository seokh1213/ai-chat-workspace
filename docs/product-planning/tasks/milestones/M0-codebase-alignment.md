# M0 / 신규 프로젝트 Reference Audit + Bootstrap Decision

M0의 목적은 신규 개인형 Agent 플랫폼 프로젝트를 만들기 전에, 기존 reference 자료를 감사하고 bootstrap 의사결정을 고정하는 것이다. 기존 `trip-plan`, `todo-ai`, `mind-plan`, `projects/reusable`, `templates`는 복사 대상이 아니라 feature와 구현 패턴을 확인하는 reference-only 자료다.

## 1. Milestone Scope

| 항목 | 내용 |
| --- | --- |
| Milestone ID | `M0` |
| 이름 | Reference Audit + Bootstrap Decision |
| 목표 | 신규 프로젝트 생성 전 stack, module, package, API, domain, provider, security, bootstrap checklist를 결정 |
| 산출물 | reference audit matrix, bootstrap decision log, 신규 프로젝트 생성 체크리스트, M1 착수 기준 |
| 구현 여부 | 구현 없음. 문서/조사/결정만 수행 |
| 주요 기준 문서 | [Task Format](../00-task-format.md), [Planning Index](../../README.md), [Screen Contracts](../../screen-contracts.md), [Implementation Plan](../../common/implementation-plan.md) |
| Reference 자료 | `projects/apps/trip-plan`, `projects/apps/todo-ai`, `projects/apps/mind-plan`, `projects/reusable`, `templates` |

## 2. Non-Goals

| 제외 항목 | 이유 |
| --- | --- |
| 기존 앱 코드 복사 | 신규 플랫폼은 처음부터 설계한다. 기존 앱은 reference-only다. |
| 기존 앱을 마이그레이션 | trip/todo/mind는 제품 하위 기능의 참고 사례이지 신규 플랫폼의 출발점이 아니다. |
| 기존 reusable 디렉터리 흡수 | 추출된 패턴 확인용이다. 신규 프로젝트의 컴포넌트 API는 별도로 설계한다. |
| 여행 기능 우선 이식 | 여행은 workspace subtype 후보 중 하나다. 플랫폼 foundation보다 앞서지 않는다. |
| 실제 scaffold 생성 | M0은 생성 전 결정 단계다. 생성은 M1 또는 별도 bootstrap task에서 수행한다. |

## 3. Dependencies

| Dependency | 상태 | 설명 |
| --- | --- | --- |
| `docs/product-planning/tasks/00-task-format.md` | 필요 | task ID, size, done 기준 |
| `docs/product-planning/README.md` | 필요 | 문서 source of truth와 읽기 순서 |
| `docs/product-planning/screen-contracts.md` | 필요 | 15개 화면의 route/object/read/write 계약 |
| `docs/product-planning/common/implementation-plan.md` | 필요 | M0 이후 milestone 흐름 |
| `templates/docs/*.md` | 필요 | 기존 generic skeleton의 결정 후보 |
| `projects/apps/*` | 필요 | feature/pattern/gap 확인용 reference |

## 4. Reference Audit 초기 관찰

| Reference | 참고할 feature/pattern | 버릴 것 | 신규 설계 필요 |
| --- | --- | --- | --- |
| `projects/apps/trip-plan` | 고완성도 chat UX, workspace/settings, provider status, SSE, checkpoint, operation preview, k8s/infra 문서 | 여행 특화 route, 지도/좌표/날짜 rail, legacy node, 실제 seed data, trip package naming | Agent platform IA, topic/workspace bridge, multi-agent run 모델, provider credential 정책 |
| `projects/apps/todo-ai` | 가장 작은 Todo + Codex app-server + SSE + tool block 흐름 | 데모용 단일 도메인, 단순 상태 모델, 최소 UI | task/run/schedule 분리, approval, 비용/권한, persistent topic scope |
| `projects/apps/mind-plan` | SQLite/Flyway reference, CLI provider registry, local-rule provider, workspace 구조 | mind-plan 도메인 용어, 간단한 plan schema | 모델 라우팅, OpenRouter/local Codex OAuth, MCP/dev-token 정책 |
| `projects/reusable/frontend` | ChatPanel, useChatStream, Markdown, operation preview의 API shape 후보 | 그대로 가져오는 컴포넌트 API, 스타일 의존성 | 새 shell과 screen contract에 맞는 chat surface component contract |
| `templates` | generic core, domain adapter, provider streaming, quality/security checklist | “workspace/data_space/source_record”를 그대로 확정하는 것 | PRD canonical object(`topic`, `run`, `source`, `memory`, `agent`, `connection`)와 template 모델의 매핑 |

## 5. Task Summary

| Task ID | 제목 | Priority | Size | Area | Depends on | Blocks |
| --- | --- | --- | --- | --- | --- | --- |
| `DEV-M0-T01` | Reference boundary와 audit matrix 작성 | `P0` | `S` | `Docs` | None | `DEV-M0-T06`, `DEV-M0-T09` |
| `DEV-M0-T02` | 신규 제품 scope와 첫 vertical slice 결정 | `P0` | `S` | `Product` | `DEV-M0-T01` | `DEV-M0-T12` |
| `DEV-M0-T03` | 신규 프로젝트 위치, module, package naming 결정 | `P0` | `XS` | `Infra` | `DEV-M0-T02` | `DEV-M0-T04`, `DEV-M0-T05` |
| `DEV-M0-T04` | Backend stack/bootstrap decision 작성 | `P0` | `S` | `BE` | `DEV-M0-T03` | `DEV-M0-T12` |
| `DEV-M0-T05` | Frontend stack/bootstrap decision 작성 | `P0` | `S` | `FE` | `DEV-M0-T03` | `DEV-M0-T12` |
| `DEV-M0-T06` | Canonical domain model gap 분석 | `P0` | `M` | `Fullstack` | `DEV-M0-T01` | `DEV-M0-T07`, `DEV-M0-T12` |
| `DEV-M0-T07` | API/SSE/event/error contract baseline 결정 | `P0` | `M` | `Fullstack` | `DEV-M0-T06` | `DEV-M0-T08`, `DEV-M0-T12` |
| `DEV-M0-T08` | AI provider와 credential 방향 결정 | `P0` | `M` | `AI`, `Security` | `DEV-M0-T07` | `DEV-M0-T11`, `DEV-M0-T12` |
| `DEV-M0-T09` | Chat-first UX reference audit | `P1` | `M` | `FE`, `UX` | `DEV-M0-T01` | `DEV-M0-T05`, `DEV-M0-T12` |
| `DEV-M0-T10` | Workspace/topic bridge reference audit | `P1` | `S` | `Product`, `Fullstack` | `DEV-M0-T02`, `DEV-M0-T06` | `DEV-M0-T12` |
| `DEV-M0-T11` | Security, local dev, Dev Mode bootstrap 결정 | `P0` | `M` | `Security`, `Infra` | `DEV-M0-T08` | `DEV-M0-T12` |
| `DEV-M0-T12` | Bootstrap checklist와 M1 Definition of Ready 확정 | `P0` | `S` | `Docs`, `Infra` | `DEV-M0-T03` ~ `DEV-M0-T11` | `M1` |

## DEV-M0-T01 / Reference boundary와 audit matrix 작성

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `Docs` |
| Screens | 전체 |
| Objects | 전체 |
| Depends on | None |
| Blocks | `DEV-M0-T06`, `DEV-M0-T09` |
| Source docs | [README](../../../../README.md), [Projects README](../../../../projects/README.md), [Implementation Plan](../../common/implementation-plan.md) |

### 목적

기존 reference를 “참고할 feature/pattern”, “버릴 것”, “신규 설계할 것”으로 분리한다. M0 이후 작업자가 기존 앱을 시작점으로 오해하지 않게 경계를 문서화한다.

### 구현 범위

- `trip-plan`, `todo-ai`, `mind-plan`, `projects/reusable`, `templates`의 역할 구분
- reference별 참고 가능한 feature/pattern 목록 작성
- 신규 프로젝트에 가져오면 안 되는 도메인 결합, 데모 전제, 임시 구현 목록 작성
- 신규 설계가 필요한 gap 목록 작성

### 제외 범위

- 기존 파일 이동
- 코드 추출
- 신규 scaffold 생성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T01-S01` | reference inventory 작성 | `Docs` | reference 경로와 역할이 표로 정리됨 |
| `DEV-M0-T01-S02` | 참고 feature/pattern 분류 | `Docs` | 각 reference별 참고 대상이 기능/UX/API/infra 기준으로 분류됨 |
| `DEV-M0-T01-S03` | 버릴 항목 분류 | `Docs` | 도메인 특화, 데모용, legacy, local-only 항목이 명시됨 |
| `DEV-M0-T01-S04` | 신규 설계 gap 분류 | `Docs` | PRD에 필요한데 reference에 없는 핵심 gap이 목록화됨 |

### Acceptance Criteria

- [ ] 기존 앱을 복사/마이그레이션/시작점으로 표현하지 않음
- [ ] 모든 reference가 reference-only로 명시됨
- [ ] 참고/버림/신규 설계 항목이 한 표에서 비교 가능함
- [ ] M1 작업자가 reference 경계를 읽고 잘못된 코드 기반 선택을 하지 않음

### Test / Verification

- [ ] `복사`, `마이그레이션`, `이식` 관련 표현이 reference-only 또는 non-goal 문맥인지 확인
- [ ] reference 경로가 실제 존재하는지 확인
- [ ] `DEV-M0-T06`, `DEV-M0-T09`에서 audit 결과를 직접 참조 가능함

### Edge Cases

- `templates`가 “시작 템플릿”처럼 보이더라도 그대로 확정된 architecture로 취급하지 않음
- `projects/reusable` 이름 때문에 컴포넌트를 가져오는 작업으로 오해하지 않음
- `trip-plan` 완성도가 높아도 여행 도메인 결합을 플랫폼 core로 끌어오지 않음

### Open Decisions

- `DEC-M0-01`: 신규 프로젝트 이름과 package root를 무엇으로 할지 결정 필요
- `DEC-M0-02`: 신규 프로젝트를 이 repo 안에 만들지, 별도 repo로 만들지 결정 필요

## DEV-M0-T02 / 신규 제품 scope와 첫 vertical slice 결정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `Product` |
| Screens | `SCR-01`, `SCR-02`, `SCR-03`, `SCR-11` |
| Objects | `conversation`, `topic`, `run` |
| Depends on | `DEV-M0-T01` |
| Blocks | `DEV-M0-T12` |
| Source docs | [Screen Contracts](../../screen-contracts.md), [Implementation Plan](../../common/implementation-plan.md) |

### 목적

신규 프로젝트의 첫 개발 단위를 “모든 기능의 얕은 구현”이 아니라 하나의 end-to-end vertical slice로 제한한다. M1/M2 착수 전에 첫 화면, 첫 conversation scope, 첫 topic 승격 흐름을 결정한다.

### 구현 범위

- 첫 사용 시 보이는 화면 결정
- 첫 vertical slice의 포함/제외 기능 결정
- 단발 채팅과 지속 workspace의 구분 기준 결정
- M1 shell과 M2 control tower의 경계 확정

### 제외 범위

- agent swarm 전체 구현 범위 확정
- 여행 workspace 세부 기능 설계
- provider별 모델 선택 UI 상세 설계

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T02-S01` | 첫 화면 범위 결정 | `Product` | `/today`를 첫 화면으로 둘지, `/chat` 별도 route를 둘지 결정됨 |
| `DEV-M0-T02-S02` | vertical slice 후보 비교 | `Product` | `global chat -> topic 생성 -> topic chat` 흐름과 대안이 비교됨 |
| `DEV-M0-T02-S03` | 제외 기능 목록 작성 | `Product` | M1/M2에서 제외할 `run`, `schedule`, `agent builder`, `scrap` 범위가 명시됨 |
| `DEV-M0-T02-S04` | 성공 시나리오 3개 작성 | `UX` | 사용자 입장에서 첫 사용 성공 흐름이 3개 이하로 정의됨 |

### Acceptance Criteria

- [ ] 첫 vertical slice가 1~2개 화면 중심으로 제한됨
- [ ] 단발 채팅과 topic workspace 승격 기준이 문장으로 정의됨
- [ ] M1에서 구현할 shell/foundation과 M2에서 구현할 feature가 분리됨
- [ ] 후속 milestone으로 미룰 기능이 명시됨

### Test / Verification

- [ ] [Implementation Plan](../../common/implementation-plan.md)의 M1/M2 범위와 충돌 없음
- [ ] [Screen Contracts](../../screen-contracts.md)의 `SCR-01`, `SCR-02` read/write와 연결됨
- [ ] 첫 vertical slice가 2일 이상 걸릴 대형 task로 비대해지지 않음

### Edge Cases

- 채팅 하나로 모든 기능을 시작하게 하면 사용자가 workspace 상태를 잃을 수 있음
- 처음부터 카테고리 선택을 강제하면 chat-first 장점이 약해질 수 있음
- topic 승격을 자동으로만 처리하면 잘못된 workspace가 생성될 수 있음

### Open Decisions

- `DEC-M0-03`: global chat route를 `/today` 안에 둘지 `/chat`으로 분리할지 결정 필요
- `DEC-M0-04`: topic 생성 CTA를 AI 제안 중심으로 둘지 사용자 명시 버튼 중심으로 둘지 결정 필요

## DEV-M0-T03 / 신규 프로젝트 위치, module, package naming 결정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `XS` |
| Area | `Infra` |
| Screens | 전체 |
| Objects | 전체 |
| Depends on | `DEV-M0-T02` |
| Blocks | `DEV-M0-T04`, `DEV-M0-T05` |
| Source docs | [Target Architecture](../../../../templates/docs/01_TARGET_ARCHITECTURE.md), [Backend Blueprint](../../../../templates/docs/03_BACKEND_BLUEPRINT.md) |

### 목적

신규 프로젝트를 어디에 만들고 어떤 module/package 이름으로 시작할지 결정한다. 이 결정이 없으면 이후 모든 파일 경로, package, API namespace, build script가 흔들린다.

### 구현 범위

- repo 위치 결정
- backend module 이름 결정
- frontend package 이름 결정
- Kotlin package root 결정
- API base path와 local port 후보 결정

### 제외 범위

- 실제 디렉터리 생성
- Gradle/Vite 설정 작성
- CI/CD 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T03-S01` | 프로젝트 위치 후보 작성 | `Infra` | `projects/apps/<new-app>`와 별도 repo 후보 장단점이 정리됨 |
| `DEV-M0-T03-S02` | naming convention 결정 | `Infra` | app name, npm package, Gradle group, Kotlin package root 후보 중 하나가 선택됨 |
| `DEV-M0-T03-S03` | local port 계획 작성 | `Infra` | backend/frontend/dev service port 충돌 방지 표가 작성됨 |
| `DEV-M0-T03-S04` | API namespace 결정 | `BE` | `/api` 하위 versioning 여부와 route prefix가 결정됨 |

### Acceptance Criteria

- [ ] 신규 프로젝트 경로가 한 곳으로 결정됨
- [ ] package/module 이름이 기존 reference 이름과 충돌하지 않음
- [ ] local 개발 포트가 `trip-plan`, `todo-ai`, `mind-plan`과 충돌하지 않음
- [ ] M1 scaffold 작업자가 이름 결정을 다시 물을 필요 없음

### Test / Verification

- [ ] `find projects/apps -maxdepth 2 -type d`로 기존 app name과 충돌 확인
- [ ] package root가 `app.tripplanner`, `app.todoai`, `app.mindplan`과 구분됨
- [ ] README/implementation docs에 쓰일 이름이 동일함

### Edge Cases

- repo 안에 새 app을 만들 경우 기존 reference와 import path가 섞일 수 있음
- 별도 repo로 만들 경우 이 문서 링크가 상대 경로 기준으로 깨질 수 있음
- 앱 이름이 제품명과 내부 package명에서 다르면 추적이 어려워질 수 있음

### Open Decisions

- `DEC-M0-05`: 신규 프로젝트 경로
- `DEC-M0-06`: Kotlin package root
- `DEC-M0-07`: frontend npm package name

## DEV-M0-T04 / Backend stack/bootstrap decision 작성

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `BE` |
| Screens | 전체 |
| Objects | `topic`, `conversation`, `run`, `source`, `memory`, `agent`, `connection` |
| Depends on | `DEV-M0-T03` |
| Blocks | `DEV-M0-T12` |
| Source docs | [Backend Blueprint](../../../../templates/docs/03_BACKEND_BLUEPRINT.md), [Core Data Model](../../../../templates/docs/02_CORE_DATA_MODEL.md), [Domain Model Policy](../../common/domain-model-and-state-policy.md) |

### 목적

Kotlin/Spring 기반 신규 backend의 bootstrap 결정을 문서로 고정한다. 기존 reference의 build 설정은 후보 확인용이며, 신규 프로젝트의 package, DB, migration, test, module boundary는 별도 결정한다.

### 구현 범위

- JDK/Kotlin/Spring Boot 버전 후보 결정
- DB 초기 선택 결정
- Flyway 사용 여부 결정
- module/package layout 결정
- 테스트 기본선 결정
- transaction boundary와 async/streaming boundary 원칙 정리

### 제외 범위

- 실제 `build.gradle.kts` 생성
- domain entity 작성
- migration 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T04-S01` | reference backend stack 비교 | `BE` | trip/todo/mind의 Kotlin/Spring/DB/test 차이가 표로 정리됨 |
| `DEV-M0-T04-S02` | 신규 backend stack 결정 | `BE` | JDK, Kotlin, Spring Boot, DB, migration, testcontainers 여부가 결정됨 |
| `DEV-M0-T04-S03` | package boundary 초안 작성 | `BE` | `common`, `topic`, `conversation`, `run`, `agent`, `connection`, `knowledge` 등의 package 후보가 정리됨 |
| `DEV-M0-T04-S04` | transaction/streaming 원칙 작성 | `BE` | DB transaction 안에 provider stream이나 외부 tool 호출을 넣지 않는 원칙이 명시됨 |
| `DEV-M0-T04-S05` | bootstrap test baseline 작성 | `BE` | empty migration, context load, API error, SSE skeleton 테스트 기준이 정의됨 |

### Acceptance Criteria

- [ ] backend stack 결정이 단일 표로 정리됨
- [ ] reference 앱의 build 설정과 신규 결정의 차이가 명시됨
- [ ] domain package가 화면 route가 아니라 canonical object 기준으로 설계됨
- [ ] M1 scaffold에서 바로 사용할 backend checklist가 있음

### Test / Verification

- [ ] `projects/apps/*/backend/build.gradle.kts` 기준 stack 후보가 누락되지 않음
- [ ] [Domain Model Policy](../../common/domain-model-and-state-policy.md)의 canonical object와 package 후보가 연결됨
- [ ] transaction boundary 항목이 external provider/tool 호출과 분리됨

### Edge Cases

- SQLite로 시작하면 k8s/PostgreSQL 전환 비용이 생김
- PostgreSQL로 시작하면 local setup이 무거워질 수 있음
- Spring WebMVC SSE와 coroutine Flow 경계가 모호하면 cancellation/cleanup 누락 가능
- package를 화면 단위로 자르면 API/domain 중복이 커짐

### Open Decisions

- `DEC-M0-08`: 초기 DB를 PostgreSQL로 갈지 SQLite로 갈지 결정 필요
- `DEC-M0-09`: Spring Boot 4 계열을 유지할지 안정 버전 기준을 다시 확인할지 결정 필요
- `DEC-M0-10`: backend module을 단일 module로 시작할지 multi-module로 시작할지 결정 필요

## DEV-M0-T05 / Frontend stack/bootstrap decision 작성

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `FE` |
| Screens | 전체 |
| Objects | `conversation`, `topic`, `run`, `source` |
| Depends on | `DEV-M0-T03` |
| Blocks | `DEV-M0-T12` |
| Source docs | [Frontend Blueprint](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md), [Screen Contracts](../../screen-contracts.md), [Documentation Format](../../common/documentation-format.md) |

### 목적

신규 frontend의 stack, route shell, style system, component boundary를 결정한다. 기존 reference의 React/Vite/chat 구현은 패턴 확인용이며, 신규 플랫폼의 IA와 screen contract에 맞춰 새로 설계한다.

### 구현 범위

- React/Vite/TypeScript 버전 후보 결정
- router 도입 여부 결정
- style system 결정
- component folder convention 결정
- chat surface와 workspace surface의 공통 interface 후보 작성
- icon/component library 후보 결정

### 제외 범위

- 실제 React app 생성
- 컴포넌트 구현
- CSS 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T05-S01` | reference frontend stack 비교 | `FE` | trip/todo/mind/reusable의 dependency와 UX 패턴이 표로 정리됨 |
| `DEV-M0-T05-S02` | route/shell bootstrap 결정 | `FE` | 15개 route placeholder를 어떤 router/shell 구조로 열지 결정됨 |
| `DEV-M0-T05-S03` | styling/design token 방향 결정 | `FE` | Tailwind/CSS module/plain CSS/design token 후보 중 하나가 선택됨 |
| `DEV-M0-T05-S04` | chat component contract 초안 작성 | `FE` | message list, composer, stream, tool preview, scope banner props 후보가 정의됨 |
| `DEV-M0-T05-S05` | viewport/responsive 기준 작성 | `FE` | PC 우선 화면과 mobile fallback의 최소 기준이 정리됨 |

### Acceptance Criteria

- [ ] 신규 frontend bootstrap 결정이 reference 의존 없이 설명됨
- [ ] route shell이 [Screen Contracts](../../screen-contracts.md)의 15개 route를 수용함
- [ ] chat-first UX와 workspace UX가 같은 component에 억지로 합쳐지지 않음
- [ ] M1에서 placeholder shell을 구현할 수 있는 기준이 있음

### Test / Verification

- [ ] `projects/apps/*/frontend/package.json`의 공통 dependency와 차이를 확인함
- [ ] `SCR-01`~`SCR-15` route 후보가 누락되지 않음
- [ ] chat component contract가 `global/topic/run/help/agent_test` scope를 표현 가능함

### Edge Cases

- 카드형 landing page를 만들면 실제 작업 화면 진입이 늦어짐
- router 없이 state만으로 화면을 바꾸면 deep link/fallback 구현이 어려워짐
- 하나의 ChatPanel이 모든 workspace UX를 삼키면 화면별 시각화가 약해짐
- style system을 늦게 결정하면 generated mockup과 실제 UI가 어긋남

### Open Decisions

- `DEC-M0-11`: route library 사용 여부
- `DEC-M0-12`: Tailwind 4, CSS module, plain CSS 중 선택
- `DEC-M0-13`: shadcn/ui 또는 AI Elements 도입 여부

## DEV-M0-T06 / Canonical domain model gap 분석

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | 전체 |
| Objects | `topic`, `conversation`, `run`, `task`, `source`, `memory`, `agent`, `connection`, `document` |
| Depends on | `DEV-M0-T01` |
| Blocks | `DEV-M0-T07`, `DEV-M0-T12` |
| Source docs | [Domain Model Policy](../../common/domain-model-and-state-policy.md), [Screen Contracts](../../screen-contracts.md), [Core Data Model](../../../../templates/docs/02_CORE_DATA_MODEL.md) |

### 목적

PRD의 canonical object와 template의 generic object를 비교해 신규 프로젝트의 첫 domain model 후보를 만든다. 기존 `workspace/data_space/source_record` 구조를 그대로 확정하지 않고, `topic`, `conversation`, `run`, `source`, `memory`, `agent`, `connection` 중심으로 필요한 mapping과 gap을 찾는다.

### 구현 범위

- PRD canonical object 목록 정리
- template generic model과의 매핑 후보 작성
- reference 앱이 제공하는 상태/관계 패턴 확인
- 신규 설계가 필요한 객체/관계/gap 정리
- M1에서 생성할 최소 schema 후보 작성

### 제외 범위

- DB migration 작성
- entity/DTO 구현
- seed data 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T06-S01` | canonical object inventory 작성 | `Fullstack` | 화면 계약의 primary objects가 중복 제거되어 목록화됨 |
| `DEV-M0-T06-S02` | generic model mapping 작성 | `Fullstack` | `data_space/source_record/chat_session`과 `topic/source/conversation` 관계 후보가 작성됨 |
| `DEV-M0-T06-S03` | 상태 enum gap 분석 | `BE` | `run`, `task`, `schedule`, `source`, `memory`, `agent` 상태의 reference 유무가 정리됨 |
| `DEV-M0-T06-S04` | relationship gap 분석 | `Fullstack` | topic-resource, source-memory, task-run, agent-connection 관계가 정리됨 |
| `DEV-M0-T06-S05` | M1 minimum schema 후보 작성 | `BE` | M1에서 반드시 필요한 table/object와 M2 이후로 미룰 object가 분리됨 |

### Acceptance Criteria

- [ ] 신규 프로젝트의 canonical object 기준이 화면 계약과 일치함
- [ ] template generic object를 그대로 제품 object로 확정하지 않음
- [ ] M1 schema 후보와 M2 이후 확장 후보가 분리됨
- [ ] relation 중복/삭제/보관/권한 전파 gap이 명시됨

### Test / Verification

- [ ] [Screen Contracts](../../screen-contracts.md)의 모든 primary object가 inventory에 포함됨
- [ ] [Domain Model Policy](../../common/domain-model-and-state-policy.md)의 ID/key/state 정책과 충돌 없음
- [ ] M1에서 필요 없는 객체가 foundation scope에 과도하게 들어가지 않음

### Edge Cases

- `topic`과 `workspace`를 같은 의미로 쓰면 route와 permission이 섞임
- `conversation`이 global/topic/run/help scope를 표현하지 못하면 chat history가 잘못 귀속됨
- `run`과 `task`를 합치면 사용자가 할 일과 AI 실행 이력이 혼동됨
- `source`와 `memory`를 합치면 원자료와 장기 참조 정보가 섞임

### Open Decisions

- `DEC-M0-14`: `topic`을 최상위 workspace로 볼지, workspace 하위 object로 볼지 결정 필요
- `DEC-M0-15`: `conversation` scope enum 후보 확정 필요
- `DEC-M0-16`: M1 minimum schema 범위 확정 필요

## DEV-M0-T07 / API/SSE/event/error contract baseline 결정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | 전체 |
| Objects | `conversation`, `topic`, `run`, `approval_request` |
| Depends on | `DEV-M0-T06` |
| Blocks | `DEV-M0-T08`, `DEV-M0-T12` |
| Source docs | [Backend Blueprint](../../../../templates/docs/03_BACKEND_BLUEPRINT.md), [AI Provider And Streaming](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md), [Navigation Policy](../../common/navigation-and-cross-screen-flows.md) |

### 목적

신규 프로젝트의 API, SSE event, error envelope, idempotency 기준을 M1 이전에 정한다. chat-first UX는 API와 event contract가 흔들리면 이후 모든 화면이 영향을 받는다.

### 구현 범위

- API resource naming baseline
- `conversation` message send/event stream baseline
- `run` lifecycle event 후보
- error response envelope
- idempotency key와 optimistic update 기준
- deep link fallback API 기준

### 제외 범위

- OpenAPI 작성
- controller 구현
- SSE broker 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T07-S01` | API resource 후보 작성 | `BE` | topic/conversation/run/source/agent/connection route 후보가 표로 정리됨 |
| `DEV-M0-T07-S02` | SSE event baseline 작성 | `Fullstack` | `run.started`, `assistant.message.delta`, `run.completed`, `run.failed` 등 event 후보가 정리됨 |
| `DEV-M0-T07-S03` | error envelope 결정 | `BE` | code/message/details/retryable/action fields 후보가 정리됨 |
| `DEV-M0-T07-S04` | idempotency/optimistic 기준 작성 | `Fullstack` | message send, retry, approval, schedule 변경의 중복 방지 기준이 명시됨 |
| `DEV-M0-T07-S05` | API naming conflict 점검 | `Docs` | screen contract route와 API route가 혼동되지 않게 구분됨 |

### Acceptance Criteria

- [ ] FE가 provider 종류를 몰라도 stream을 표시할 수 있는 event baseline이 있음
- [ ] error가 연결 CTA, 승인 CTA, 비용 차단 CTA로 변환 가능한 정보를 가짐
- [ ] retry/cancel/duplicate message edge case가 baseline에 포함됨
- [ ] API route와 화면 route가 같은 이름이어도 의미가 분리됨

### Test / Verification

- [ ] `todo-ai`와 `trip-plan`의 SSE/API 흐름을 reference로 비교함
- [ ] [Navigation Policy](../../common/navigation-and-cross-screen-flows.md)의 deep link/fallback 흐름을 표현 가능함
- [ ] [Screen Contracts](../../screen-contracts.md)의 Reads/Writes가 최소 API 후보로 매핑됨

### Edge Cases

- SSE 재연결 시 중복 delta가 표시될 수 있음
- cancel 이후 늦게 온 operation이 적용될 수 있음
- approval 처리 중복 클릭으로 상태가 꼬일 수 있음
- provider error body를 그대로 사용자에게 노출하면 보안/UX 문제가 생김

### Open Decisions

- `DEC-M0-17`: API versioning을 `/api/v1`로 시작할지 `/api`로 시작할지 결정 필요
- `DEC-M0-18`: SSE stream을 conversation 단위로 둘지 run 단위로 둘지 결정 필요
- `DEC-M0-19`: idempotency key를 client 생성으로 할지 server 발급으로 할지 결정 필요

## DEV-M0-T08 / AI provider와 credential 방향 결정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `AI`, `Security` |
| Screens | `SCR-03`, `SCR-05`, `SCR-06`, `SCR-11`, `SCR-13` |
| Objects | `model_route`, `provider_credential`, `connection`, `agent`, `run` |
| Depends on | `DEV-M0-T07` |
| Blocks | `DEV-M0-T11`, `DEV-M0-T12` |
| Source docs | [AI Provider And Streaming](../../../../templates/docs/05_AI_PROVIDER_AND_STREAMING.md), [Settings Contract](../../screen-contracts.md#scr-11--설정--settings), [Security Notes](../../../../templates/docs/13_SECURITY_NOTES.md) |

### 목적

OpenRouter 방식, local Codex app-server 방식, direct provider 방식의 역할을 M0에서 분리한다. provider 인증과 모델 선택은 이후 agent/run/cost/approval 전체에 영향을 주기 때문에, bootstrap 전에 방향을 결정한다.

### 구현 범위

- provider 종류와 bootstrap 우선순위 결정
- API key/OAuth/local auth 저장/표시 정책 결정
- model catalog와 model route baseline 결정
- provider status/health check 기준 결정
- 비용/사용량 수집 최소 기준 결정
- local Codex app-server 노출 경계 결정

### 제외 범위

- provider adapter 구현
- credential encryption 구현
- 실제 OAuth flow 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T08-S01` | provider 후보 matrix 작성 | `AI` | OpenRouter, local Codex app-server, direct provider의 장단점이 정리됨 |
| `DEV-M0-T08-S02` | bootstrap provider 결정 | `AI` | local dev와 production-like provider의 우선순위가 정해짐 |
| `DEV-M0-T08-S03` | credential storage policy 초안 작성 | `Security` | API key, OAuth, Codex local auth, dev token 저장/마스킹 기준이 정리됨 |
| `DEV-M0-T08-S04` | model routing baseline 작성 | `AI` | default model, fallback, per-agent override, cost cap 후보가 정리됨 |
| `DEV-M0-T08-S05` | usage/cost event 후보 작성 | `BE` | token/cost/provider/run 단위 기록 기준이 정리됨 |

### Acceptance Criteria

- [ ] provider 인증 방식이 browser에 노출되지 않는 전제로 정리됨
- [ ] local Codex app-server는 public network에 직접 노출하지 않는 정책이 포함됨
- [ ] OpenRouter와 local Codex app-server가 같은 UI contract로 표현 가능함
- [ ] 모델 선택/사용량/비용 표시가 `SCR-11` 설정 요구와 연결됨

### Test / Verification

- [ ] [Settings Contract](../../screen-contracts.md#scr-11--설정--settings)의 Reads/Writes를 모두 설명 가능함
- [ ] [Security Notes](../../../../templates/docs/13_SECURITY_NOTES.md)의 credential 원칙과 충돌 없음
- [ ] provider 실패/만료/비용 초과 edge가 error envelope로 표현 가능함

### Edge Cases

- fallback provider가 반복 실패하며 비용을 증가시킬 수 있음
- local Codex auth path가 API 응답이나 로그에 노출될 수 있음
- model catalog가 provider별로 다른 가격/컨텍스트 정보를 가질 수 있음
- OAuth 만료와 API key 삭제가 실행 중 run에 영향을 줄 수 있음

### Open Decisions

- `DEC-M0-20`: 첫 bootstrap provider를 local Codex app-server로 할지 OpenRouter로 할지 결정 필요
- `DEC-M0-21`: credential 저장소를 DB encrypted field로 시작할지 env/local file로 제한할지 결정 필요
- `DEC-M0-22`: 모델 catalog를 정적 seed로 시작할지 provider sync로 시작할지 결정 필요

## DEV-M0-T09 / Chat-first UX reference audit

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `FE`, `UX` |
| Screens | `SCR-01`, `SCR-02`, `SCR-03`, `SCR-12` |
| Objects | `conversation`, `message`, `run` |
| Depends on | `DEV-M0-T01` |
| Blocks | `DEV-M0-T05`, `DEV-M0-T12` |
| Source docs | [Frontend Blueprint](../../../../templates/docs/04_FRONTEND_BLUEPRINT.md), [Reusable Component Catalog](../../../../templates/docs/10_REUSABLE_COMPONENT_CATALOG.md), [Navigation Policy](../../common/navigation-and-cross-screen-flows.md) |

### 목적

기존 reference의 chat UX를 조사해 신규 프로젝트의 chat surface 요구사항을 정의한다. 코드나 컴포넌트를 가져오는 것이 아니라, 사용자가 채팅 하나에서 좋은 UX를 겪고 자연스럽게 workspace/도구 화면으로 넘어가는 기준을 만든다.

### 구현 범위

- message list, composer, streaming, copy, markdown, operation preview 패턴 조사
- scope banner와 workspace binding UX 기준 작성
- chat -> workspace 이동 로딩/전환 UX 기준 작성
- chat -> tool CRUD 결과 표시 기준 작성
- run/approval/status 메시지 노출 기준 작성

### 제외 범위

- ChatPanel 구현
- 기존 reusable component API 채택
- CSS 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T09-S01` | chat UX feature audit | `UX` | trip/todo/reusable의 chat feature가 기능별로 정리됨 |
| `DEV-M0-T09-S02` | conversation scope 기준 작성 | `UX` | global/topic/run/help/agent_test scope별 표시 기준이 정리됨 |
| `DEV-M0-T09-S03` | transition UX 기준 작성 | `UX` | 채팅에서 workspace 이동 중 표시, 완료 후 귀속 기준이 정리됨 |
| `DEV-M0-T09-S04` | streaming/copy/markdown 기준 작성 | `FE` | markdown, copy, scroll, stop/retry 최소 기준이 정리됨 |
| `DEV-M0-T09-S05` | operation/tool preview 기준 작성 | `FE` | CRUD/tool result를 채팅 안에서 어떻게 보여줄지 기준이 정리됨 |

### Acceptance Criteria

- [ ] chat-first UX가 화면 전환 없는 단발 답변과 workspace 귀속 작업을 구분함
- [ ] 기존 ChatPanel을 가져온다는 표현 없이 신규 component contract로 재정의됨
- [ ] `SCR-01`, `SCR-02`, `SCR-03`, `SCR-12`의 conversation 요구를 모두 포함함
- [ ] streaming 중 stop/retry/copy/scroll edge가 포함됨

### Test / Verification

- [ ] [Navigation Policy](../../common/navigation-and-cross-screen-flows.md)의 chat -> workspace, chat -> CRUD 흐름과 연결됨
- [ ] [Screen Contracts](../../screen-contracts.md)의 entry/exit와 충돌 없음
- [ ] reference chat feature 중 신규 프로젝트에서 의도적으로 제외할 항목이 명시됨

### Edge Cases

- workspace 이동 중 사용자가 메시지를 추가로 보내는 경우
- topic 생성 실패 후 global conversation에 남은 메시지 처리
- tool block이 사용자에게 노출되는 경우
- streaming delta 중 route 이동 또는 browser refresh 발생

### Open Decisions

- `DEC-M0-23`: chat composer를 모든 화면에 고정할지 화면별 panel로 둘지 결정 필요
- `DEC-M0-24`: workspace 이동 로딩을 full-screen으로 할지 inline transition card로 할지 결정 필요
- `DEC-M0-25`: tool/CRUD 결과를 message bubble 안에 둘지 side panel에도 반영할지 결정 필요

## DEV-M0-T10 / Workspace/topic bridge reference audit

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Product`, `Fullstack` |
| Screens | `SCR-02`, `SCR-09`, `SCR-14` |
| Objects | `topic`, `conversation`, `task`, `source`, `artifact` |
| Depends on | `DEV-M0-T02`, `DEV-M0-T06` |
| Blocks | `DEV-M0-T12` |
| Source docs | [Topics Contract](../../screen-contracts.md#scr-02--주제--topics), [Workspace Bridge Plan](../../common/implementation-plan.md#6-m3--workspace-bridge), [Domain Adapter Guide](../../../../templates/docs/06_DOMAIN_ADAPTER_GUIDE.md) |

### 목적

지속 발전하는 작업을 topic/workspace로 다루는 기준을 만든다. 여행, todo, mind reference는 workspace-like UX와 domain-specific view의 사례로만 분석하고, 신규 프로젝트에서는 topic subtype과 surface 계약을 새로 설계한다.

### 구현 범위

- topic과 workspace 용어 관계 결정 후보
- topic subtype 후보 정리
- chat에서 topic 생성/연결/전환 흐름 정리
- workspace 내부 chat scope 기준 정리
- 기존 여행 reference를 첫 subtype 후보로 볼 때 필요한 gap 정리

### 제외 범위

- 여행 workspace 구현
- topic CRUD API 구현
- markmap/todo map 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T10-S01` | workspace-like reference 비교 | `Product` | trip/todo/mind의 workspace 개념 차이가 정리됨 |
| `DEV-M0-T10-S02` | topic subtype 후보 작성 | `Product` | trip, research, todo-plan, report 등 subtype 후보와 공통 필드가 정리됨 |
| `DEV-M0-T10-S03` | chat binding rule 작성 | `Fullstack` | global conversation이 topic conversation으로 귀속되는 규칙 후보가 작성됨 |
| `DEV-M0-T10-S04` | surface contract 초안 작성 | `FE` | workspace 화면이 chat/sidebar/main view를 어떻게 조합할지 기준이 정리됨 |

### Acceptance Criteria

- [ ] topic/workspace/data_space 용어가 섞이지 않게 정의됨
- [ ] 기존 trip workspace를 첫 subtype으로 참고하되 platform core로 끌어오지 않음
- [ ] workspace 내부 대화 이력이 topic에 귀속되는 기준이 있음
- [ ] M3에서 여행 기능을 붙일 때 필요한 선행 gap이 명시됨

### Test / Verification

- [ ] [SCR-02](../../screen-contracts.md#scr-02--주제--topics)의 Entry/Exits/Reads/Writes와 연결됨
- [ ] `DEC-M0-14` topic/workspace 결정과 충돌 없음
- [ ] 단발 chat과 지속 workspace 전환 기준이 `DEV-M0-T02`와 동일함

### Edge Cases

- 하나의 conversation이 여러 topic에 동시에 귀속되는 경우
- topic이 삭제/보관됐는데 chat deep link가 남아 있는 경우
- workspace subtype이 필요한데 아직 surface renderer가 없는 경우
- 여행처럼 지도 중심 화면과 report처럼 문서 중심 화면이 같은 shell에 들어오는 경우

### Open Decisions

- `DEC-M0-26`: `topic.type` 또는 `workspace.type`의 초기 enum 후보
- `DEC-M0-27`: topic 내부 chat을 하나만 둘지 여러 session으로 둘지 결정 필요
- `DEC-M0-28`: workspace surface renderer registry 도입 여부

## DEV-M0-T11 / Security, local dev, Dev Mode bootstrap 결정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Security`, `Infra` |
| Screens | `SCR-06`, `SCR-11`, `SCR-12` |
| Objects | `credential`, `dev_token`, `audit_log`, `connection` |
| Depends on | `DEV-M0-T08` |
| Blocks | `DEV-M0-T12` |
| Source docs | [Security Notes](../../../../templates/docs/13_SECURITY_NOTES.md), [Settings Detail](../../screens/11-settings.md), [Help Detail](../../screens/12-help.md) |

### 목적

신규 프로젝트의 보안/로컬 개발/Dev Mode 기준을 bootstrap 전에 정한다. API key, local Codex OAuth, MCP/TUI 접근용 자체 token은 초기 설계에서 빠지면 나중에 수정 비용이 크다.

### 구현 범위

- local dev secret 처리 기준
- provider credential masking/export/logging 기준
- Dev Mode token scope/lifecycle 기준
- MCP/TUI/local API 접근 경계
- audit log 최소 이벤트 기준
- local/k8s 환경 변수 초안

### 제외 범위

- token 발급 구현
- encryption 구현
- MCP server 구현
- k8s manifest 작성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T11-S01` | credential threat model 작성 | `Security` | API key, OAuth, local Codex auth, dev token의 노출 위험이 정리됨 |
| `DEV-M0-T11-S02` | Dev Mode access policy 초안 작성 | `Security` | TUI/MCP/local API 접근 scope와 만료 기준이 정리됨 |
| `DEV-M0-T11-S03` | local dev env matrix 작성 | `Infra` | backend/frontend/provider/db/codex app-server 환경 변수가 정리됨 |
| `DEV-M0-T11-S04` | k8s bootstrap 고려사항 작성 | `Infra` | service, secret, ingress, network policy, app-server 노출 금지 기준이 정리됨 |
| `DEV-M0-T11-S05` | audit log 최소 기준 작성 | `BE` | credential 변경, token 발급/폐기, provider route 변경, destructive action 이벤트가 정리됨 |

### Acceptance Criteria

- [ ] browser가 provider credential을 직접 알지 않는 정책이 명시됨
- [ ] Dev Mode token이 workspace 정보 접근 범위와 만료/폐기 기준을 가짐
- [ ] local Codex app-server를 public network에 노출하지 않는 기준이 포함됨
- [ ] k8s 배포 전 필요한 secret/network 결정이 bootstrap checklist에 반영됨

### Test / Verification

- [ ] [Security Notes](../../../../templates/docs/13_SECURITY_NOTES.md)의 원칙이 모두 반영됨
- [ ] [Settings Detail](../../screens/11-settings.md)의 API key/local Codex OAuth/Dev Mode 요구와 연결됨
- [ ] provider error/logging 정책이 `DEV-M0-T07` error envelope와 충돌 없음

### Edge Cases

- dev token이 너무 넓은 scope를 갖고 장기간 유지되는 경우
- provider error body에 Authorization header나 token 일부가 포함되는 경우
- k8s ingress가 app-server WebSocket을 외부로 열어버리는 경우
- local TUI가 현재 workspace context 없이 destructive command를 실행하는 경우

### Open Decisions

- `DEC-M0-29`: dev token scope 단위를 user/workspace/topic 중 어디까지 둘지 결정 필요
- `DEC-M0-30`: credential 암호화 방식을 bootstrap에서 바로 넣을지 후속 milestone로 둘지 결정 필요
- `DEC-M0-31`: k8s 초기 배포를 M1 범위에 포함할지 별도 milestone로 둘지 결정 필요

## DEV-M0-T12 / Bootstrap checklist와 M1 Definition of Ready 확정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `Docs`, `Infra` |
| Screens | 전체 |
| Objects | 전체 |
| Depends on | `DEV-M0-T03`, `DEV-M0-T04`, `DEV-M0-T05`, `DEV-M0-T06`, `DEV-M0-T07`, `DEV-M0-T08`, `DEV-M0-T09`, `DEV-M0-T10`, `DEV-M0-T11` |
| Blocks | `M1` |
| Source docs | [Task Format](../00-task-format.md), [Implementation Plan](../../common/implementation-plan.md), [Quality Gates](../../../../templates/docs/12_QUALITY_GATES.md), [Customization Checklist](../../../../templates/docs/11_CUSTOMIZATION_CHECKLIST.md) |

### 목적

M0의 모든 조사/결정을 M1 개발 착수 가능한 bootstrap checklist로 압축한다. M1 작업자가 다시 reference를 훑으며 방향을 정하지 않도록 Definition of Ready를 만든다.

### 구현 범위

- M0 결정사항 요약
- 미결정 사항과 block 여부 분류
- 신규 프로젝트 생성 명령/수동 단계 checklist 초안
- M1 shell/domain foundation 착수 조건 정의
- 품질 gate baseline 정리

### 제외 범위

- 실제 명령 실행
- repository 생성
- dependency install
- 테스트 실행

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M0-T12-S01` | decision log 작성 | `Docs` | `DEC-M0-*` 상태와 선택값/미결정값이 표로 정리됨 |
| `DEV-M0-T12-S02` | bootstrap checklist 작성 | `Infra` | 프로젝트 생성 전/생성 직후/첫 빌드 전 체크가 분리됨 |
| `DEV-M0-T12-S03` | M1 Definition of Ready 작성 | `Docs` | M1 작업자가 필요한 stack/module/package/API/domain 결정을 모두 확인 가능함 |
| `DEV-M0-T12-S04` | quality gate baseline 작성 | `Docs` | frontend build, backend test, migration, SSE, security 최소 gate가 정리됨 |
| `DEV-M0-T12-S05` | reference usage warning 작성 | `Docs` | M1 문서 상단에 기존 reference를 복사 대상으로 오해하지 말라는 경고가 들어감 |

### Acceptance Criteria

- [ ] `DEV-M0-T01`~`DEV-M0-T11`의 결정/산출물이 checklist에 반영됨
- [ ] M1 시작 전에 반드시 확정해야 하는 open decision이 `blocked`로 분류됨
- [ ] M1에서 실제 scaffold 생성자가 더 이상 stack/package/API 방향을 추측하지 않음
- [ ] reference-only 경고가 명시됨

### Test / Verification

- [ ] 모든 `DEC-M0-*`가 decision log에 등장함
- [ ] [Quality Gates](../../../../templates/docs/12_QUALITY_GATES.md)의 최소 항목이 신규 프로젝트 기준으로 변환됨
- [ ] `docs/product-planning/tasks/00-task-format.md`의 Definition of Ready/Done과 충돌 없음
- [ ] M1 task 작성자가 이 문서만으로 scaffold 전제조건을 확인 가능함

### Edge Cases

- open decision이 남았는데 M1을 시작해 이후 구현이 흔들리는 경우
- checklist가 너무 일반적이라 실제 프로젝트 이름/package/API를 확인하지 못하는 경우
- reference warning이 약해 작업자가 기존 앱 코드를 출발점으로 삼는 경우
- quality gate가 bootstrap 단계에서 실행 불가능한 수준으로 과한 경우

### Open Decisions

- `DEC-M0-32`: M1 task 문서를 생성하기 전에 M0 decision log를 별도 파일로 분리할지 결정 필요
- `DEC-M0-33`: bootstrap checklist를 사람이 실행할지 AI agent가 실행할지 결정 필요

## 6. Milestone Completion Criteria

- [ ] M0 문서가 기존 앱 코드 복사/마이그레이션/이식을 지시하지 않음
- [ ] reference audit matrix가 feature/pattern, 버릴 것, 신규 설계할 것을 분리함
- [ ] 신규 프로젝트 이름, 위치, module, package root 후보가 결정되거나 block decision으로 남음
- [ ] backend stack, frontend stack, DB, provider, credential, Dev Mode, k8s bootstrap 고려사항이 M1 이전 결정 목록에 포함됨
- [ ] canonical object와 template generic model의 gap이 정리됨
- [ ] API/SSE/error/idempotency baseline이 M1 foundation 작업의 입력으로 준비됨
- [ ] chat-first UX와 workspace/topic bridge의 reference audit 기준이 준비됨
- [ ] `DEV-M0-T12`의 bootstrap checklist가 M1 Definition of Ready 역할을 수행함

## 7. M1 Handoff

M1 작업자는 이 문서를 읽고 바로 scaffold를 만들지 않는다. 먼저 `DEV-M0-T12`의 decision log와 bootstrap checklist가 채워졌는지 확인한다. 미결정 `P0` decision이 남아 있으면 M1은 `blocked` 상태로 두고, 신규 프로젝트 생성 전에 결정을 확정한다.
