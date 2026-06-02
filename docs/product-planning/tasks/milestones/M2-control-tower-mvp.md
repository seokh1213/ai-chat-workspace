# M2 / Control Tower MVP 개발 태스크

이 문서는 신규 개인형 Agent 플랫폼을 처음부터 구축한다는 전제로 `오늘(Control Tower)`과 `주제(Topics)`의 첫 사용 가능 흐름을 작은 개발 태스크로 분해한다. 기존 `trip-plan`, `todo-ai`, `mind-plan`, `templates`는 reference-only이며, 코드 복사/마이그레이션/기존 앱 기반 재구축은 M2 범위가 아니다.

## 1. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [../00-task-format.md](../00-task-format.md) |
| 제품 문서 진입점 | [../../README.md](../../README.md) |
| 화면 계약 | [../../screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [../../common/implementation-plan.md](../../common/implementation-plan.md#5-m2--control-tower-mvp) |
| 공통 동선 | [../../common/navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md) |
| 공통 객체/상태/API | [../../common/domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 오늘 화면 | [../../screens/01-today-control-tower.md](../../screens/01-today-control-tower.md) |
| 주제 화면 | [../../screens/02-topics.md](../../screens/02-topics.md) |

## 2. M2 범위

| 포함 | 제외 |
| --- | --- |
| 전역 채팅 입력과 global conversation 메시지 저장 | 실제 multi-agent swarm 실행 엔진 |
| Today summary, recent topics, active runs/upcoming schedules 요약 | run pause/resume/stop/retry 제어 |
| topic 생성, 목록, 검색, 필터, 상세 패널 | full workspace surface 구현 |
| conversation-to-topic 승격과 relation 저장 | 여행 지도/일정 편집 workspace 구현 |
| quick intent 버튼과 추천 action 표시 | provider credential, 모델 라우팅, API key 설정 |
| topic quick chat과 작업실 진입 handoff | schedule 생성/수정/반복 규칙 전체 |
| 빈/로딩/에러/권한/비용/연결 미비 표시 | 외부 write 승인 실행 |

## 3. M1 Foundation 의존성

M2 태스크의 `Depends on`에는 아직 구체적인 `DEV-M1-Tnn` 문서가 없으므로 아래 foundation 이름을 사용한다. M1 태스크 문서가 생기면 이 문서의 dependency를 실제 M1 task ID로 치환한다.

| Foundation | M2에서 필요한 내용 |
| --- | --- |
| `M1-SHELL` | `/today`, `/topics`, `/topics/:topicId` route skeleton, 공통 sidebar, active menu, responsive shell |
| `M1-AUTH-HUB` | session user, activeHub, hub 변경, permission summary |
| `M1-DOMAIN` | canonical object/status enum, stable ID/key, relation id, optimistic locking 기준 |
| `M1-API` | API client, request id, error mapping, idempotency key, loading/error 공통 컴포넌트 |
| `M1-CHAT` | conversation/message 기본 schema, message status, attachment placeholder |
| `M1-EVENT` | run/schedule 상태 갱신을 위한 polling 또는 SSE skeleton |
| `M1-TEST` | unit/component/e2e 테스트 실행 환경과 fixture seed 방식 |

## 4. Task Index

| Task | 제목 | Size | Area | Depends on | Blocks |
| --- | --- | --- | --- | --- | --- |
| `DEV-M2-T01` | M2 reference check와 fixture 기준 정리 | `XS` | `Docs` | `M1-SHELL`, `M1-DOMAIN` | `DEV-M2-T02` |
| `DEV-M2-T02` | Today summary 조회 계약과 페이지 bootstrap | `M` | `Fullstack` | `M1-SHELL`, `M1-AUTH-HUB`, `M1-API` | `DEV-M2-T03`, `DEV-M2-T06`, `DEV-M2-T13` |
| `DEV-M2-T03` | 전역 채팅 입력 UI와 draft/submit 상태 | `M` | `FE` | `M1-SHELL`, `M1-CHAT`, `DEV-M2-T02` | `DEV-M2-T04`, `DEV-M2-T05`, `DEV-M2-T11` |
| `DEV-M2-T04` | global conversation 메시지 API와 응답 lifecycle | `M` | `Fullstack` | `M1-CHAT`, `M1-API`, `DEV-M2-T03` | `DEV-M2-T11` |
| `DEV-M2-T05` | quick intent와 추천 action 카드 | `S` | `FE` | `DEV-M2-T03` | `DEV-M2-T11`, `DEV-M2-T13` |
| `DEV-M2-T06` | Today recent topics 카드 | `S` | `Fullstack` | `DEV-M2-T02` | `DEV-M2-T09`, `DEV-M2-T12` |
| `DEV-M2-T07` | Topics 목록, 검색, 필터, 페이지네이션 | `M` | `Fullstack` | `M1-SHELL`, `M1-DOMAIN`, `M1-API` | `DEV-M2-T08`, `DEV-M2-T09` |
| `DEV-M2-T08` | topic 생성 플로우 | `M` | `Fullstack` | `DEV-M2-T07` | `DEV-M2-T09`, `DEV-M2-T11` |
| `DEV-M2-T09` | topic 상세 패널과 activity/resource 요약 | `M` | `Fullstack` | `DEV-M2-T06`, `DEV-M2-T07`, `DEV-M2-T08` | `DEV-M2-T10`, `DEV-M2-T12` |
| `DEV-M2-T10` | topic quick chat | `M` | `Fullstack` | `DEV-M2-T04`, `DEV-M2-T09` | `DEV-M2-T14` |
| `DEV-M2-T11` | conversation-to-topic 승격 | `M` | `Fullstack` | `DEV-M2-T04`, `DEV-M2-T08`, `DEV-M2-T09` | `DEV-M2-T12`, `DEV-M2-T14` |
| `DEV-M2-T12` | topic 열기와 workspace handoff | `S` | `Fullstack` | `DEV-M2-T09`, `DEV-M2-T11` | `DEV-M3` |
| `DEV-M2-T13` | 실행 상태 요약: active runs와 upcoming schedules | `M` | `Fullstack` | `DEV-M2-T02`, `M1-EVENT` | `DEV-M2-T14`, `DEV-M4` |
| `DEV-M2-T14` | M2 E2E 검수와 회귀 체크 | `S` | `QA` | `DEV-M2-T01` ~ `DEV-M2-T13` | `M3` |

## 5. 태스크 상세

## DEV-M2-T01 / M2 reference check와 fixture 기준 정리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `XS` |
| Area | `Docs` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic`, `conversation`, `run` |
| Depends on | `M1-SHELL`, `M1-DOMAIN` |
| Blocks | `DEV-M2-T02` |
| Source docs | [구현 순서](../../common/implementation-plan.md#5-m2--control-tower-mvp), [오늘 상세](../../screens/01-today-control-tower.md), [주제 상세](../../screens/02-topics.md) |

### 목적

M2 구현 전에 신규 프로젝트 기준 fixture와 reference-only 확인 범위를 고정한다. 기존 앱은 기능 이해용으로만 보고, 코드 구조나 화면을 복사하지 않는다.

### 구현 범위

- M2 fixture seed 목록 정의: 사용자, hub, global conversation, topics 3~6개, active runs, upcoming schedules.
- 기존 `trip-plan`에서 확인할 reference 항목을 `여행 주제 카드`, `작업공간 진입 문맥`, `여행 feature 용어`로 제한.
- M2에서 쓰는 mock/seed 데이터가 canonical object/status를 따르는지 점검.

### 제외 범위

- 기존 앱 코드 복사.
- 기존 앱 route/API를 신규 프로젝트 route/API로 직접 매핑.
- M0 reference audit 전체 재수행.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T01-S01` | M2 fixture object 목록 작성 | `Docs` | `topic`, `conversation`, `run`, `schedule` seed 최소 필드가 정의됨 |
| `DEV-M2-T01-S02` | reference-only 체크 항목 작성 | `Docs` | 기존 앱 확인 항목이 기능/용어/UX 참고로 제한됨 |
| `DEV-M2-T01-S03` | 신규 프로젝트 금지 조건 기록 | `Docs` | 복사/마이그레이션/기반 구축 금지가 M2 문서에 명시됨 |

### Acceptance Criteria

- [ ] M2 fixture가 `domain-model-and-state-policy.md`의 canonical object/status를 사용한다.
- [ ] reference check가 기존 기능 확인으로만 제한된다.
- [ ] 이후 태스크가 기존 프로젝트 경로나 모듈명을 구현 의존성으로 삼지 않는다.

### Test / Verification

- [ ] fixture 필드와 screen contract의 `Reads/Writes`를 대조한다.
- [ ] 문서 내 `migration`, `copy`, `base on existing app` 의미의 작업이 없는지 확인한다.

### Edge Cases

- 기존 여행 서비스의 완성도가 높아도 M2 topic/workspace 구조를 trip-plan route에 맞추지 않는다.
- reference에서 나온 용어가 canonical object와 충돌하면 canonical object를 우선한다.

### Open Decisions

- `DEC-M2-01`: M2 fixture를 정적 JSON으로 시작할지, BE seed endpoint로 시작할지 결정 필요.

## DEV-M2-T02 / Today summary 조회 계약과 페이지 bootstrap

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01` |
| Objects | `conversation`, `topic`, `run`, `schedule` |
| Depends on | `M1-SHELL`, `M1-AUTH-HUB`, `M1-API`, `DEV-M2-T01` |
| Blocks | `DEV-M2-T03`, `DEV-M2-T06`, `DEV-M2-T13` |
| Source docs | [오늘 계약](../../screen-contracts.md#scr-01--오늘--control-tower), [오늘 상세 8장](../../screens/01-today-control-tower.md#8-데이터-필드api-힌트) |

### 목적

오늘 화면의 첫 렌더링에 필요한 사용자/허브/summary 데이터를 한 번에 가져오고, 섹션별 부분 실패를 분리한다.

### 구현 범위

- `GET /api/today` 응답 계약 정의 또는 구현.
- 중앙 인사말, onboarding guide, recent topics placeholder, active runs placeholder, upcoming schedules placeholder 연결.
- 각 섹션별 loading/error/empty 상태 분리.
- `/today` route 진입 시 active hub 기준 데이터 재조회.

### 제외 범위

- 채팅 메시지 전송.
- topic 목록 전체 검색/필터.
- run/schedule 제어 액션.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T02-S01` | `GET /api/today` response model 정의 | `BE` | `user`, `activeHub`, `navigation`, `todaySummary`, `recentTopics`, `activeRuns`, `upcomingSchedules`, `onboardingGuide` 필드가 명시됨 |
| `DEV-M2-T02-S02` | Today page bootstrap query 연결 | `FE` | `/today` 진입 시 hub 기준 summary query가 실행됨 |
| `DEV-M2-T02-S03` | 섹션별 skeleton/error/empty 처리 | `FE` | 한 섹션 실패가 전체 화면 실패로 번지지 않음 |
| `DEV-M2-T02-S04` | hub 변경 시 재조회 처리 | `FE` | activeHub 변경 후 이전 hub 데이터가 잔류하지 않음 |

### Acceptance Criteria

- [ ] `/today`에서 공통 shell과 `오늘` active menu가 표시된다.
- [ ] 사용자 이름이 있으면 인사말에 반영되고 없으면 fallback 문구가 표시된다.
- [ ] recent topics, active runs, upcoming schedules, onboarding guide가 독립 상태로 렌더링된다.
- [ ] Today summary 조회 실패 시 재시도 CTA가 보인다.
- [ ] hub 변경 시 모든 summary 데이터가 새 hub 기준으로 바뀐다.

### Test / Verification

- [ ] `GET /api/today` success fixture로 화면 렌더링 검증.
- [ ] recent topics만 실패한 fixture에서 중앙 채팅과 run summary가 유지되는지 검증.
- [ ] hub 변경 후 query key 또는 request parameter가 바뀌는지 검증.

### Edge Cases

- 최초 사용자라 topic/run/schedule이 모두 없는 상태.
- activeHub 권한은 있으나 일부 topic/run만 읽기 불가인 상태.
- navigation badge가 실패해도 Today 본문 조회가 가능해야 하는 상태.

### Open Decisions

- `DEC-M2-02`: `GET /api/today` 단일 API를 MVP 기본으로 둘지, 섹션별 API 조합을 기본으로 둘지 결정 필요.

## DEV-M2-T03 / 전역 채팅 입력 UI와 draft/submit 상태

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-01` |
| Objects | `conversation`, `message` |
| Depends on | `M1-SHELL`, `M1-CHAT`, `DEV-M2-T02` |
| Blocks | `DEV-M2-T04`, `DEV-M2-T05`, `DEV-M2-T11` |
| Source docs | [오늘 상세 5장 - 전역 채팅 입력 카드](../../screens/01-today-control-tower.md#전역-채팅-입력-카드), [공통 동선 4장](../../common/navigation-and-cross-screen-flows.md#4-채팅-scope와-화면-승격) |

### 목적

사용자가 메뉴 구조를 몰라도 오늘 화면 중앙에서 바로 요청을 입력할 수 있는 global chat input을 만든다.

### 구현 범위

- 메시지 textarea, 첨부/웹/도구/음성 placeholder, 전송 버튼 UI.
- 입력 draft 저장과 화면 전환/새로고침 최소 보존 정책.
- 빈 입력 전송 비활성화.
- 전송 pending/failed 상태 표시를 위한 FE state.

### 제외 범위

- 실제 음성 입력 구현.
- 파일 업로드와 URL 스크랩 처리.
- 도구 선택 modal의 실제 tool catalog.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T03-S01` | global chat input 컴포넌트 작성 | `FE` | textarea, action icons, send button이 Today 중앙 영역에 배치됨 |
| `DEV-M2-T03-S02` | draft 보존 정책 연결 | `FE` | route 전환 또는 hub 유지 상태에서 입력 중 draft가 의도대로 유지/초기화됨 |
| `DEV-M2-T03-S03` | submit 가능 조건 구현 | `FE` | 빈 텍스트와 빈 첨부 상태에서는 전송이 불가함 |
| `DEV-M2-T03-S04` | pending/failed UI hook 준비 | `FE` | API 연결 전후 message status를 표시할 slot이 있음 |

### Acceptance Criteria

- [ ] Today 화면 중앙에 global chat input이 표시된다.
- [ ] 빈 메시지는 전송되지 않는다.
- [ ] 사용자가 입력 중 사이드바를 이동했다 돌아와도 정책에 맞게 draft가 처리된다.
- [ ] 전송 중 중복 클릭이 방지된다.
- [ ] 아이콘 버튼은 접근 가능한 label을 가진다.

### Test / Verification

- [ ] 빈 입력, 공백 입력, 정상 입력 submit 상태를 component test로 확인한다.
- [ ] keyboard focus, Enter/Shift+Enter 정책을 확인한다.
- [ ] pending 상태에서 send button이 중복 제출을 만들지 않는지 확인한다.

### Edge Cases

- hub 변경 시 이전 hub draft를 새 hub에 잘못 전송하지 않는다.
- 첨부 placeholder가 있는 상태에서 첨부 기능 미구현이면 사용자에게 명확히 비활성 사유를 보여준다.
- 긴 입력이 카드 영역을 깨지 않는다.

### Open Decisions

- `DEC-M2-03`: Enter는 전송, Shift+Enter는 줄바꿈으로 할지 결정 필요.
- `DEC-M2-04`: draft를 local storage에 저장할지 in-memory session state로만 유지할지 결정 필요.

## DEV-M2-T04 / global conversation 메시지 API와 응답 lifecycle

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01` |
| Objects | `conversation`, `message`, `approval_request` |
| Depends on | `M1-CHAT`, `M1-API`, `DEV-M2-T03` |
| Blocks | `DEV-M2-T10`, `DEV-M2-T11` |
| Source docs | [공통 동선 5장](../../common/navigation-and-cross-screen-flows.md#5-chat-first---workspace-전환), [공통 객체 4.2 conversation](../../common/domain-model-and-state-policy.md#42-conversation) |

### 목적

전역 채팅 메시지를 `global` scope conversation에 저장하고, 응답/실패/재시도/승격 후보를 lifecycle로 표현한다.

### 구현 범위

- global conversation 생성 또는 active global conversation 조회.
- `POST /api/conversations/{conversationId}/messages` 또는 `POST /api/conversations/messages` 계약.
- message status: pending, streaming/processing, succeeded, failed.
- 응답에 `suggestedActions`, `promotionCandidate`, `approvalRequest` 후보 포함.
- 실패 메시지 재전송과 idempotency key 처리.

### 제외 범위

- 모델 provider 선택/라우팅.
- tool 실행 engine.
- 장시간 run 생성의 실제 실행.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T04-S01` | global conversation resolve API | `BE` | hub 기준 active global conversation이 생성/조회됨 |
| `DEV-M2-T04-S02` | message create API | `BE` | message, assistant response placeholder, cost summary 후보가 저장됨 |
| `DEV-M2-T04-S03` | FE message lifecycle 렌더링 | `FE` | pending/succeeded/failed 상태가 채팅 카드에 표시됨 |
| `DEV-M2-T04-S04` | retry/idempotency 처리 | `Fullstack` | 재전송이 중복 message/run을 만들지 않음 |

### Acceptance Criteria

- [ ] 메시지는 항상 `scopeType=global` conversation에 저장된다.
- [ ] API 실패 시 사용자 메시지는 failed 상태로 남고 재시도가 가능하다.
- [ ] assistant 응답에는 단발 답변 또는 승격 CTA를 연결할 수 있다.
- [ ] 같은 `clientRequestId` 재전송은 중복 message를 만들지 않는다.
- [ ] 비용/승인/연결 미비가 있으면 일반 실패가 아니라 별도 상태로 표현된다.

### Test / Verification

- [ ] message create success/failure/idempotency API test.
- [ ] FE에서 pending -> succeeded, pending -> failed 전이를 확인한다.
- [ ] global conversation이 topic conversation으로 잘못 저장되지 않는지 확인한다.

### Edge Cases

- 응답 생성 중 사용자가 route를 이동한 경우.
- 네트워크 재시도로 같은 메시지가 두 번 전송되는 경우.
- 모델 응답은 성공했지만 suggested action 생성만 실패한 경우.

### Open Decisions

- `DEC-M2-05`: streaming transport를 SSE로 바로 시작할지, M2는 polling/완료 응답으로 시작할지 결정 필요.
- `DEC-M2-06`: global conversation을 사용자별 하나로 둘지 날짜/세션별로 나눌지 결정 필요.

## DEV-M2-T05 / quick intent와 추천 action 카드

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `FE` |
| Screens | `SCR-01` |
| Objects | `conversation`, `topic`, `run`, `schedule`, `source` |
| Depends on | `DEV-M2-T03` |
| Blocks | `DEV-M2-T11`, `DEV-M2-T13` |
| Source docs | [오늘 상세 2장 - 빠른 의도](../../screens/01-today-control-tower.md#중앙-메인-영역), [공통 동선 4.2](../../common/navigation-and-cross-screen-flows.md#42-화면-승격-기준) |

### 목적

사용자가 처음부터 정확한 명령어를 몰라도 `빠른 답변`, `자료 정리`, `여행 계획`, `여러 담당에게 맡기기`, `자동으로 해두기` 중 하나로 요청 방향을 잡게 한다.

### 구현 범위

- quick intent 5개 버튼 렌더링.
- intent 선택 시 입력 placeholder/template, 추천 action 정렬, 필요한 비활성 안내 변경.
- 추천 action 4개: 작업면으로 펼치기, 주제로 저장, 자료 스크랩, 자동 실행 등록.
- 실행 불가 action은 연결/비용/후속 milestone 안내로 처리.

### 제외 범위

- intent 기반 실제 agent 실행.
- 자동 schedule 생성.
- scrap/source 생성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T05-S01` | quick intent model 정의 | `FE` | intent key, label, description, placeholder, disabledReason이 정의됨 |
| `DEV-M2-T05-S02` | intent 선택 UI 구현 | `FE` | 선택 상태가 입력 카드와 추천 action에 반영됨 |
| `DEV-M2-T05-S03` | 추천 action 카드 구현 | `FE` | 4개 action이 표시되고 가능한 action만 CTA 활성화됨 |
| `DEV-M2-T05-S04` | 후속 milestone action guard | `FE` | M2 제외 기능은 명확한 안내와 관련 화면/후속 링크로 처리됨 |

### Acceptance Criteria

- [ ] quick intent 5개가 Today 화면에 표시된다.
- [ ] intent 선택 후 입력 placeholder 또는 template이 바뀐다.
- [ ] `주제로 저장`은 승격 후보가 있을 때 `DEV-M2-T11` 흐름으로 연결된다.
- [ ] `여러 담당에게 맡기기`, `자동으로 해두기`는 M2에서 즉시 실행하지 않고 실행/예약 요약 또는 후속 CTA로 안내한다.
- [ ] disabled action은 왜 사용할 수 없는지 표시한다.

### Test / Verification

- [ ] 각 intent 선택 시 UI 상태 변화를 component test로 확인한다.
- [ ] 비활성 action 클릭 시 no-op이 아니라 안내가 나오는지 확인한다.
- [ ] quick intent 선택이 message scope를 변경하지 않는지 확인한다.

### Edge Cases

- 사용자가 intent 선택 후 직접 문장을 바꾸는 경우 intent가 과도하게 명령을 강제하지 않는다.
- 연결/모델 설정이 없는 첫 사용자에게 고비용 실행 버튼을 활성화하지 않는다.
- quick intent가 이미 topic context처럼 보이더라도 Today에서는 global scope로 시작한다.

### Open Decisions

- `DEC-M2-07`: quick intent 5개를 고정할지, 사용 패턴 기반으로 재정렬할지 결정 필요.

## DEV-M2-T06 / Today recent topics 카드

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic` |
| Depends on | `DEV-M2-T02` |
| Blocks | `DEV-M2-T09`, `DEV-M2-T12` |
| Source docs | [오늘 상세 - 최근 주제 카드](../../screens/01-today-control-tower.md#최근-주제-카드), [주제 계약](../../screen-contracts.md#scr-02--주제--topics) |

### 목적

오늘 화면에서 사용자가 최근 지속 작업을 바로 찾고 다시 들어갈 수 있게 recent topic 카드를 제공한다.

### 구현 범위

- `GET /api/topics/recent?hubId=` 또는 `GET /api/today`의 `recentTopics` 사용.
- 카드 필드: cover/thumbnail, title, description, status, progressPercent, counts, lastActiveAt.
- 카드 클릭 시 `/topics/:topicId`로 이동.
- fallback thumbnail과 긴 제목 처리.

### 제외 범위

- topic 전체 검색/필터.
- 카드 overflow 위험 액션.
- full workspace 이동.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T06-S01` | recent topic query 계약 | `BE` | Today 카드 렌더링용 경량 topic 필드가 제공됨 |
| `DEV-M2-T06-S02` | recent topic card UI | `FE` | 카드가 썸네일/제목/진행률/count/최근 활동을 표시함 |
| `DEV-M2-T06-S03` | card route 연결 | `FE` | 클릭 시 `/topics/:topicId`로 이동하고 선택 topic이 복원됨 |
| `DEV-M2-T06-S04` | empty/fallback 처리 | `FE` | topic 없음/이미지 없음/권한 제한 상태가 표시됨 |

### Acceptance Criteria

- [ ] recent topics가 Today 화면에 카드 목록으로 표시된다.
- [ ] 각 카드 key는 `topic.id`를 사용한다.
- [ ] 카드 클릭 시 Topics 화면에서 해당 topic이 선택된다.
- [ ] recent topic이 없으면 새 주제 만들기 또는 채팅 시작 CTA가 보인다.
- [ ] 이미지 실패 시 카드 전체가 깨지지 않는다.

### Test / Verification

- [ ] recent topics 0개/1개/여러 개 fixture 렌더링.
- [ ] 긴 제목/긴 설명에서 레이아웃이 깨지지 않는지 확인.
- [ ] 카드 클릭 route와 selected topic query를 확인.

### Edge Cases

- topic이 방금 보관되었는데 recent cache에 남아 있는 경우.
- count 일부만 조회 실패한 경우.
- 권한이 사라진 topic을 deep link로 클릭한 경우.

### Open Decisions

- `DEC-M2-08`: recent topics 기본 정렬을 `lastActiveAt`으로 할지 `lastOpenedAt`으로 할지 결정 필요.
- `DEC-M2-09`: Today 카드 count 3개를 `conversation/source/artifact`로 고정할지 결정 필요.

## DEV-M2-T07 / Topics 목록, 검색, 필터, 페이지네이션

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic` |
| Depends on | `M1-SHELL`, `M1-DOMAIN`, `M1-API`, `DEV-M2-T01` |
| Blocks | `DEV-M2-T08`, `DEV-M2-T09` |
| Source docs | [주제 상세 3장](../../screens/02-topics.md#3-정보-구조), [주제 상세 9장](../../screens/02-topics.md#9-데이터-필드--api-힌트) |

### 목적

지속 작업공간인 topic을 목록에서 찾고 필터링할 수 있는 Topics 기본 화면을 만든다.

### 구현 범위

- `/topics` route의 목록 화면.
- `GET /api/topics?q=&type=&status=&archived=&sort=&page=&pageSize=` 계약.
- 검색, 유형 필터, 상세 필터 placeholder, 페이지네이션.
- 카드 그리드와 선택 상태.

### 제외 범위

- full workspace surface.
- 삭제/보관/유형 변경 위험 액션 실행.
- topic quick chat.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T07-S01` | topics list API 계약 | `BE` | 검색/유형/상태/정렬/page query와 경량 topic 응답이 정의됨 |
| `DEV-M2-T07-S02` | Topics list route UI | `FE` | header, search, type filter, card grid, pagination이 표시됨 |
| `DEV-M2-T07-S03` | URL query와 선택 상태 동기화 | `FE` | 검색/필터/page/selected topic이 새로고침 후 복원됨 |
| `DEV-M2-T07-S04` | list empty/loading/error 처리 | `FE` | 전체 빈 상태와 검색 빈 상태가 구분됨 |

### Acceptance Criteria

- [ ] `/topics`에서 topic card grid가 표시된다.
- [ ] 검색어 입력 시 주제명/설명/다음 액션 기준으로 결과가 좁혀진다.
- [ ] 유형 필터 선택 시 목록과 선택 topic이 일관되게 갱신된다.
- [ ] 페이지네이션은 현재 검색/필터 조건을 유지한다.
- [ ] 목록 key는 `topic.id`를 사용한다.

### Test / Verification

- [ ] list API query parameter mapping test.
- [ ] 검색 결과 있음/없음, 유형 필터 결과 있음/없음 fixture 확인.
- [ ] URL 직접 접근 `/topics?type=travel&page=2` 복원 확인.

### Edge Cases

- 현재 선택 topic이 필터 결과 밖으로 밀려난 경우.
- page가 범위를 초과한 경우.
- 보관된 topic만 남아 있는 경우.

### Open Decisions

- `DEC-M2-10`: `⌘K`를 화면 내 검색 focus로 쓸지 전역 command palette로 쓸지 결정 필요.
- `DEC-M2-11`: 목록 정렬 기본값을 최근 활동순/고정 우선/다음 액션 임박순 중 결정 필요.

## DEV-M2-T08 / topic 생성 플로우

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic` |
| Depends on | `DEV-M2-T07` |
| Blocks | `DEV-M2-T09`, `DEV-M2-T11` |
| Source docs | [오늘 상세 - 새 주제 만들기](../../screens/01-today-control-tower.md#인사말과-새-주제-만들기), [주제 상세 5.2](../../screens/02-topics.md#52-새-주제-만들기) |

### 목적

사용자가 Today 또는 Topics에서 새로운 지속 작업공간을 만들 수 있게 한다.

### 구현 범위

- `새 주제 만들기` CTA 연결.
- topic type, title, description, cover fallback 입력.
- `POST /api/topics`와 idempotency key.
- 생성 성공 후 목록 삽입, 선택 상태 갱신, Today recent topics 갱신.

### 제외 범위

- 유형별 full workspace template 생성.
- 여행 지도/일정 초기 생성.
- 외부 자료 자동 스크랩.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T08-S01` | topic create form | `FE` | type/title/description 입력과 validation이 제공됨 |
| `DEV-M2-T08-S02` | create API | `BE` | `POST /api/topics`가 canonical topic을 생성함 |
| `DEV-M2-T08-S03` | 생성 후 선택/목록 갱신 | `Fullstack` | 새 topic이 목록과 상세 패널에 반영됨 |
| `DEV-M2-T08-S04` | 중복 submit 방지 | `Fullstack` | 같은 client request가 중복 topic을 만들지 않음 |

### Acceptance Criteria

- [ ] Today와 Topics의 `새 주제 만들기`가 같은 생성 플로우로 연결된다.
- [ ] title 없는 topic은 생성되지 않는다.
- [ ] 생성된 topic은 `status=active` 또는 정책상 초기 상태로 저장된다.
- [ ] 생성 성공 후 `/topics/:topicId` 또는 Topics 선택 상태로 진입한다.
- [ ] 생성 실패 시 입력값이 사라지지 않는다.

### Test / Verification

- [ ] create API validation/idempotency test.
- [ ] 생성 후 topic list query cache 또는 재조회 결과 확인.
- [ ] Today에서 생성한 topic이 recent topics에 반영되는지 확인.

### Edge Cases

- 같은 제목의 topic이 이미 있는 경우 자동 병합하지 않고 중복 후보만 안내한다.
- 사용자가 create modal을 닫았다 다시 열 때 draft 정책이 명확해야 한다.
- cover image가 없으면 유형별 fallback을 사용한다.

### Open Decisions

- `DEC-M2-12`: topic 초기 상태를 `draft`로 둘지 `active`로 둘지 결정 필요.
- `DEC-M2-13`: topic type 기본 목록을 여행/투자/글쓰기/리서치/자동화로 고정할지 결정 필요.

## DEV-M2-T09 / topic 상세 패널과 activity/resource 요약

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `source`, `memory`, `run` |
| Depends on | `DEV-M2-T06`, `DEV-M2-T07`, `DEV-M2-T08` |
| Blocks | `DEV-M2-T10`, `DEV-M2-T12` |
| Source docs | [주제 상세 6.6](../../screens/02-topics.md#66-우측-상세-패널), [주제 상세 10.3](../../screens/02-topics.md#103-상세-패널) |

### 목적

Topics 목록에서 선택한 topic의 상태, 최근 활동, 연결 자료, 빠른 채팅 진입, 작업실 열기 CTA를 우측 패널로 보여준다.

### 구현 범위

- `GET /api/topics/{topicId}/summary` 또는 상세 panel API.
- 헤더, 진행률, 탭, 최근 활동, 연결된 기억/자료 summary.
- 목록 선택과 상세 패널 부분 로딩/오류 분리.
- 읽기 전용/권한 제한 표시.

### 제외 범위

- 자료 연결/해제 mutation.
- 위험 액션 삭제/보관/유형 변경 실행.
- full workspace surface.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T09-S01` | topic summary API | `BE` | 진행률, stats, nextAction, activity, linked resources가 조회됨 |
| `DEV-M2-T09-S02` | 상세 패널 UI | `FE` | 선택 topic header/진행률/tabs/activity/resources가 표시됨 |
| `DEV-M2-T09-S03` | 목록-상세 독립 오류 처리 | `FE` | 상세 실패가 목록 전체를 비우지 않음 |
| `DEV-M2-T09-S04` | 권한/연결 warning 표시 | `FE` | 읽기 전용/연결 끊김/부분 제한 상태가 구분됨 |

### Acceptance Criteria

- [ ] topic card 클릭 시 우측 상세 패널이 해당 topic으로 갱신된다.
- [ ] 상세 패널 진행률과 카드 진행률이 같은 기준으로 표시된다.
- [ ] 최근 활동은 conversation/source/run/activity 유형을 구분한다.
- [ ] 연결 자료가 없으면 빈 상태와 연결 CTA가 표시된다.
- [ ] 상세 조회 실패 시 목록은 유지되고 패널 안에서 재시도 가능하다.

### Test / Verification

- [ ] selected topic 변경 시 summary API가 올바른 topicId로 호출되는지 확인.
- [ ] 활동 0개/여러 개/권한 제한 fixture 렌더링.
- [ ] 카드 진행률과 상세 진행률 불일치 fixture에서 상세값 우선 정책 확인.

### Edge Cases

- topic이 삭제/보관된 deep link로 진입한 경우.
- 연결 memory/source가 삭제되어 activity에만 남은 경우.
- 선택 topic이 목록 page 변경 후 사라진 경우.

### Open Decisions

- `DEC-M2-14`: 상세 패널 탭 상태를 URL query로 복원할지 local UI state로 둘지 결정 필요.

## DEV-M2-T10 / topic quick chat

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `message`, `approval_request` |
| Depends on | `DEV-M2-T04`, `DEV-M2-T09` |
| Blocks | `DEV-M2-T14` |
| Source docs | [주제 상세 6.8](../../screens/02-topics.md#68-빠른-채팅), [공통 동선 6장](../../common/navigation-and-cross-screen-flows.md#6-workspace---chat) |

### 목적

Topics 상세 패널에서 목록을 떠나지 않고 선택 topic에 대해 짧은 질문을 할 수 있게 한다.

### 구현 범위

- `topic` scope conversation resolve.
- `POST /api/topics/{topicId}/chat/messages` 계약.
- 빠른 질문/요약/자료 위치 확인 답변.
- 쓰기성 요청은 즉시 실행하지 않고 승인 카드 또는 작업실 이동 CTA로 반환.
- 답변을 topic activity에 반영.

### 제외 범위

- 작업면 직접 수정.
- 장시간 run 생성.
- 외부 write 실행.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T10-S01` | topic conversation resolve | `BE` | topicId 기준 conversation이 생성/조회됨 |
| `DEV-M2-T10-S02` | quick chat input/response UI | `FE` | 상세 패널 안에서 메시지 전송과 응답 표시가 가능함 |
| `DEV-M2-T10-S03` | topic scope 저장 검증 | `Fullstack` | quick chat message가 global이 아니라 topic scope로 저장됨 |
| `DEV-M2-T10-S04` | 쓰기성 요청 guard | `Fullstack` | 삭제/예약/외부 쓰기/고비용 실행은 approval/workspace CTA로 처리됨 |

### Acceptance Criteria

- [ ] 선택 topic이 없으면 quick chat 입력이 비활성화된다.
- [ ] 메시지는 `scopeType=topic`, `scopeId=topicId`로 저장된다.
- [ ] 답변과 사용 자료 요약이 최근 활동에 반영된다.
- [ ] 본격 편집이 필요한 답변은 `작업실 열기` CTA를 보여준다.
- [ ] 실패한 메시지는 재시도 가능하다.

### Test / Verification

- [ ] topic quick chat API가 global conversation을 쓰지 않는지 API test.
- [ ] topic 변경 직후 이전 topic으로 메시지가 전송되지 않는지 UI test.
- [ ] 쓰기성 intent fixture가 approval/workspace CTA로 반환되는지 확인.

### Edge Cases

- 사용자가 메시지 전송 직전에 다른 topic을 선택한 경우.
- 읽기 전용 topic에서 수정 요청을 한 경우.
- 연결된 자료가 권한 제한 상태라 AI가 참조할 수 없는 경우.

### Open Decisions

- `DEC-M2-15`: quick chat 답변을 개요 탭 하단에 inline 표시할지 채팅 탭으로 자동 전환할지 결정 필요.

## DEV-M2-T11 / conversation-to-topic 승격

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `conversation`, `message`, `topic`, `topic_relation` |
| Depends on | `DEV-M2-T04`, `DEV-M2-T08`, `DEV-M2-T09` |
| Blocks | `DEV-M2-T12`, `DEV-M2-T14` |
| Source docs | [공통 동선 5장](../../common/navigation-and-cross-screen-flows.md#5-chat-first---workspace-전환), [오늘 계약](../../screen-contracts.md#scr-01--오늘--control-tower) |

### 목적

전역 채팅에서 단발로 끝나지 않는 대화를 topic으로 저장하거나 기존 topic에 연결한다.

### 구현 범위

- assistant response의 `promotionCandidate` 표시.
- 기존 topic 후보 조회: `GET /api/topics/candidates?conversationId=`.
- 새 topic 생성 또는 기존 topic 연결.
- `POST /api/topics/{topicId}/relations`로 conversation/message relation 저장.
- 승격 성공 후 Topics 상세로 이동하거나 Today에 성공 카드 표시.

### 제외 범위

- 자동 topic 연결.
- full workspace surface 생성.
- artifact/document 생성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T11-S01` | promotion candidate UI | `FE` | `주제로 저장`, `기존 주제에 연결` CTA가 메시지 하단에 표시됨 |
| `DEV-M2-T11-S02` | topic candidate 조회 | `BE` | conversation 기준 기존 topic 후보가 제공됨 |
| `DEV-M2-T11-S03` | relation create API | `BE` | conversation/message와 topic relation이 안정 ID로 저장됨 |
| `DEV-M2-T11-S04` | 승격 후 navigation | `FE` | 새/기존 topic으로 이동하고 원본 conversation 연결 표시가 가능함 |
| `DEV-M2-T11-S05` | 실패 fallback | `Fullstack` | topic 생성/연결 실패 시 원래 global chat이 유지됨 |

### Acceptance Criteria

- [ ] 전역 메시지 결과에서 지속 작업 후보를 topic으로 승격할 수 있다.
- [ ] 기존 topic 후보가 있으면 사용자가 직접 선택한다.
- [ ] 자동 연결은 하지 않는다.
- [ ] 승격 relation에는 `conversationId`, `messageIds`, `topicId`, `relationId`가 저장된다.
- [ ] 승격 실패 시 원본 메시지와 답변이 사라지지 않는다.

### Test / Verification

- [ ] 새 topic 승격 API 흐름 test.
- [ ] 기존 topic 연결 API 흐름 test.
- [ ] topic 생성 성공 후 relation 실패 시 복구 정책 확인.
- [ ] UI E2E: global chat -> 주제로 저장 -> Topics 선택 상태 확인.

### Edge Cases

- 같은 메시지를 두 번 승격하려는 경우.
- 기존 topic 후보가 권한 없음/보관 상태인 경우.
- conversation에 여러 message가 있을 때 일부만 topic에 연결하는 경우.

### Open Decisions

- `DEC-M2-16`: 승격 relation을 전체 conversation 기준으로 저장할지 선택 message 기준으로 저장할지 결정 필요.
- `DEC-M2-17`: 승격 후 즉시 `/topics/:topicId`로 이동할지 Today에 성공 카드만 보여줄지 결정 필요.

## DEV-M2-T12 / topic 열기와 workspace handoff

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic`, `conversation` |
| Depends on | `DEV-M2-T09`, `DEV-M2-T11` |
| Blocks | `M3` |
| Source docs | [주제 상세 6.9](../../screens/02-topics.md#69-작업실-열기), [공통 동선 13장](../../common/navigation-and-cross-screen-flows.md#13-deep-link와-fallback) |

### 목적

M2에서는 topic 상세 재진입을 안정화하고, full workspace는 M3로 넘길 수 있게 handoff 계약과 fallback을 만든다.

### 구현 범위

- `/topics/:topicId` deep link 복원.
- `POST /api/topics/{topicId}/open` 또는 FE event로 `lastOpenedAt` 갱신.
- `작업실 열기` CTA 클릭 시 M3 workspace route 후보로 이동하거나 M2 placeholder/fallback 표시.
- 권한 없음/삭제/보관/hub 불일치 fallback.

### 제외 범위

- `/topics/:topicId/workspace`의 실제 작업면 구현.
- 여행 지도/문서/표 surface.
- topic 내부 navigation 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T12-S01` | topic deep link restore | `FE` | `/topics/:topicId` 직접 접근 시 목록과 상세가 복원됨 |
| `DEV-M2-T12-S02` | topic open event/API | `BE` | topic open 시 `lastOpenedAt`이 갱신됨 |
| `DEV-M2-T12-S03` | workspace handoff CTA | `FE` | 작업실 열기 클릭 시 M3 대상 route 또는 준비중 상태가 명확히 표시됨 |
| `DEV-M2-T12-S04` | fallback 처리 | `Fullstack` | 삭제/권한 없음/허브 불일치 상태에서 상위 화면 fallback 제공 |

### Acceptance Criteria

- [ ] Today recent topic 또는 승격 성공 후 `/topics/:topicId`로 이동 가능하다.
- [ ] 직접 URL 접근 시 해당 topic이 선택된다.
- [ ] `lastOpenedAt` 또는 재진입 기준 시간이 갱신된다.
- [ ] full workspace 미구현 상태가 사용자를 막지 않고 M3 handoff로 남는다.
- [ ] 접근 불가 topic은 안전한 fallback을 제공한다.

### Test / Verification

- [ ] `/topics/:topicId` refresh 복원 E2E.
- [ ] 권한 없음/삭제됨/보관됨 fixture deep link 확인.
- [ ] `작업실 열기`가 M2 범위를 넘어 실제 workspace 데이터를 만들지 않는지 확인.

### Edge Cases

- filter query와 selected topic이 불일치하는 deep link.
- 다른 hub topicId로 접근한 경우.
- archived topic은 읽기 가능하지만 편집 불가인 경우.

### Open Decisions

- `DEC-M2-18`: MVP workspace route를 `/topics/{topicId}/workspace`로 선점할지, M3에서 확정할지 결정 필요.

## DEV-M2-T13 / 실행 상태 요약: active runs와 upcoming schedules

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01` |
| Objects | `run`, `schedule`, `approval_request`, `connection` |
| Depends on | `DEV-M2-T02`, `M1-EVENT`, `M1-DOMAIN` |
| Blocks | `DEV-M2-T14`, `M4` |
| Source docs | [오늘 상세 - 진행 중인 맡긴 일 카드](../../screens/01-today-control-tower.md#진행-중인-맡긴-일-카드), [오늘 상세 - 예정된 자동 작업 카드](../../screens/01-today-control-tower.md#예정된-자동-작업-카드), [공통 객체 run/schedule](../../common/domain-model-and-state-policy.md#47-run) |

### 목적

Today 우측 패널에서 AI에게 맡긴 일과 예정된 자동 작업의 현재 상태를 요약해 사용자가 “자동으로 꼼지락거리는 것”을 볼 수 있게 한다.

### 구현 범위

- `GET /api/runs/active?hubId=` summary.
- `GET /api/schedules/upcoming?hubId=` summary.
- run status/progress/last update/cost warning 표시.
- schedule nextRunAt/status/connection warning 표시.
- 클릭 시 M4 상세가 없으면 route placeholder 또는 disabled reason 표시.

### 제외 범위

- run 제어: pause/resume/stop/retry.
- schedule 생성/수정/토글 저장.
- approval approve/reject.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T13-S01` | active runs summary API | `BE` | running/approval_waiting/failed recent run summary가 제공됨 |
| `DEV-M2-T13-S02` | upcoming schedules summary API | `BE` | active/paused/failed schedule summary와 nextRunAt이 제공됨 |
| `DEV-M2-T13-S03` | Today right panel UI | `FE` | 진행 중인 맡긴 일과 예정 자동 작업 카드가 표시됨 |
| `DEV-M2-T13-S04` | status update refresh | `Fullstack` | polling 또는 event skeleton으로 stale 상태를 줄임 |
| `DEV-M2-T13-S05` | 후속 상세 route guard | `FE` | M4 상세/제어 미구현 상태가 명확히 안내됨 |

### Acceptance Criteria

- [ ] active runs가 상태, 제목, 설명, 진행률, 마지막 업데이트 시간으로 표시된다.
- [ ] upcoming schedules가 제목, 반복/다음 실행, 상태로 표시된다.
- [ ] run/schedule이 없으면 각각 빈 상태와 적절한 CTA가 보인다.
- [ ] approval waiting, cost blocked, connection expired는 일반 running과 다른 배지로 표시된다.
- [ ] M2에서 제어 불가한 액션은 실행되지 않고 후속 milestone 안내를 표시한다.

### Test / Verification

- [ ] run status별 fixture 렌더링.
- [ ] schedule active/paused/failed fixture 렌더링.
- [ ] stale update 상태에서 refresh/polling 결과가 UI에 반영되는지 확인.

### Edge Cases

- run progressPercent가 없는 경우 단계 라벨로 대체한다.
- schedule nextRunAt이 사용자 timezone 기준으로 변환되어야 한다.
- connection expired로 schedule은 존재하지만 실행 불가인 경우.
- 비용 한도 초과로 run이 pause/approval 상태인 경우.

### Open Decisions

- `DEC-M2-19`: M2 실행 상태 갱신을 polling으로 시작할지 SSE skeleton을 바로 쓸지 결정 필요.
- `DEC-M2-20`: schedule 토글 UI를 M2에서 숨길지, disabled 상태로 보여줄지 결정 필요.

## DEV-M2-T14 / M2 E2E 검수와 회귀 체크

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `QA` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `conversation`, `topic`, `run`, `schedule` |
| Depends on | `DEV-M2-T01` ~ `DEV-M2-T13` |
| Blocks | `M3` |
| Source docs | [태스크 포맷 DoD](../00-task-format.md#9-definition-of-done), [공통 동선 수용 기준](../../common/navigation-and-cross-screen-flows.md#16-수용-기준) |

### 목적

M2가 “채팅에서 시작해서 topic으로 저장하고 다시 들어오는” 첫 제품 흐름으로 동작하는지 검수한다.

### 구현 범위

- E2E 시나리오 정의와 자동/수동 검증.
- BE/FE object name, prop/API name, route parameter 일치 확인.
- M1 dependency 충족 여부 재점검.
- M3/M4로 넘길 미구현 handoff가 사용자에게 명확한지 확인.

### 제외 범위

- M3 workspace 구현.
- M4 execution core 구현.
- 성능 최적화 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M2-T14-S01` | Today happy path E2E | `QA` | `/today` 진입 -> global chat -> 승격 CTA 표시가 검증됨 |
| `DEV-M2-T14-S02` | Topic promotion E2E | `QA` | global conversation -> topic 생성/연결 -> `/topics/:topicId` 진입이 검증됨 |
| `DEV-M2-T14-S03` | Topics list/detail E2E | `QA` | 검색/필터/카드 선택/상세 패널/quick chat이 검증됨 |
| `DEV-M2-T14-S04` | 상태/권한/비용/연결 edge 검수 | `QA` | empty/loading/error/permission/cost/connection fixture가 검증됨 |
| `DEV-M2-T14-S05` | 문서/계약 갱신 확인 | `Docs` | 구현 중 route/object/status 변경이 있으면 화면 계약과 공통 정책 갱신됨 |

### Acceptance Criteria

- [ ] 사용자는 `/today`에서 전역 채팅을 시작할 수 있다.
- [ ] 단발 답변은 global conversation에 남고 topic으로 자동 연결되지 않는다.
- [ ] 지속 작업은 사용자가 명시적으로 topic으로 저장하거나 기존 topic에 연결할 수 있다.
- [ ] 사용자는 recent topic 또는 승격 결과로 Topics 상세에 재진입할 수 있다.
- [ ] active runs/upcoming schedules 요약이 Today 우측 패널에 표시된다.
- [ ] M2 제외 기능은 실패처럼 보이지 않고 후속 화면/준비중/disabled reason으로 안내된다.

### Test / Verification

- [ ] route E2E: `/today`, `/topics`, `/topics/:topicId`.
- [ ] API contract test: today, conversations/messages, topics list/create/detail/relations, runs active, schedules upcoming.
- [ ] component test: global chat input, quick intent, recent topic card, topic card, detail panel.
- [ ] accessibility check: sidebar, icon button labels, card keyboard navigation, quick chat submit.
- [ ] regression check: stable key, hubId, scopeType, scopeId, permission state, idempotency key.

### Edge Cases

- topic 승격 중 실패해도 global chat message가 유지된다.
- topic 상세 실패가 topic 목록을 비우지 않는다.
- hub 변경 후 이전 hub topicId로 메시지를 보내지 않는다.
- M2 placeholder가 실제 run/schedule/workspace mutation처럼 보이지 않는다.

### Open Decisions

- `DEC-M2-21`: M2 완료 판정에 자동 E2E를 필수로 둘지, 초기에는 fixture 기반 수동 검증을 허용할지 결정 필요.

## 6. M2 완료 조건

- [ ] `DEV-M2-T01` ~ `DEV-M2-T14`의 Acceptance Criteria가 충족된다.
- [ ] 모든 M2 task size가 `XS/S/M` 중 하나이고 `L` task가 없다.
- [ ] global/topic conversation scope가 섞이지 않는다.
- [ ] topic 생성/승격/재진입에 안정 ID와 idempotency key가 사용된다.
- [ ] Today summary, recent topics, active runs, upcoming schedules가 섹션별 상태를 가진다.
- [ ] M2에서 제외한 full workspace, execution control, provider 설정은 명확히 후속 milestone로 안내된다.
- [ ] 기존 프로젝트는 reference-only로만 확인되고 신규 프로젝트 코드의 기반이 되지 않는다.
