# M4 / Execution Core 개발 태스크

이 문서는 신규 개인형 Agent 플랫폼의 `Execution Core`를 실제 구현 가능한 작은 작업으로 나눈다. 기존 앱은 reference-only이며, 복사/마이그레이션 태스크는 포함하지 않는다.

M4의 목적은 사용자가 할 일을 만들고, AI에게 맡기고, 실행 상태를 확인하고, 승인/중지/재시도/예약/캘린더 표시까지 제어할 수 있는 최소 실행 루프를 완성하는 것이다.

## 1. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [00-task-format.md](../00-task-format.md) |
| 기획 인덱스 | [product-planning README](../../README.md) |
| 화면 계약 | [screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [implementation-plan.md](../../common/implementation-plan.md#7-m4--execution-core) |
| 공통 동선 | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule) |
| 공통 객체/상태 | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 맡긴 일 | [03-delegated-work.md](../../screens/03-delegated-work.md) |
| 캘린더 | [08-calendar.md](../../screens/08-calendar.md) |
| 할 일 | [09-todo.md](../../screens/09-todo.md) |

## 2. M4 범위

| 포함 | 제외 |
| --- | --- |
| task CRUD, checklist, link, board/list/detail | 에이전트 빌더 graph 편집 |
| task delegate preflight와 run 생성 | 실제 LLM provider/model routing 고도화 |
| run 목록/상세/log/artifact/status transition | 장기 지식/파일/스크랩 처리 파이프라인 구현 |
| pause/resume/stop/retry/run message | 외부 캘린더 양방향 동기화 완성 |
| approval request 생성/조회/처리 | 결제/예약 같은 실제 외부 write connector 구현 |
| schedule CRUD, run-now, active/paused toggle | 복잡한 rrule UI 전체 기능 |
| calendar range, occurrence projection, manual event | 팀/공유 허브 권한 모델 고도화 |
| task-run-schedule-calendar 동기화 | 모바일 전용 UX polish |

## 3. 공통 구현 규약

| 항목 | 기준 |
| --- | --- |
| API enum | `domain-model-and-state-policy.md`의 canonical enum 우선 |
| 상태 전이 | run/task/schedule/calendar_event 상태 전이는 서버에서 검증 |
| 위험한 쓰기 | approval 처리, stop, retry, schedule toggle은 독립 task로 분리 |
| 감사 로그 | run 제어, approval 처리, schedule 변경, task 삭제/보관은 `audit_log` 기록 |
| 멱등성 | run 생성, delegate, approval approve/reject, stop/retry, schedule toggle/run-now는 `idempotencyKey` 사용 |
| 동시성 | PATCH/상태 변경은 `version` 또는 ETag 기반 충돌 감지 |
| UI key | task/run/schedule/event/approval/list relation은 안정 ID 사용 |
| 기존 앱 | reference-only. 기능 확인 외 복사/마이그레이션 전제 금지 |

## 4. Task Index

| ID | 제목 | Size | Area | 핵심 결과 |
| --- | --- | --- | --- | --- |
| `DEV-M4-T01` | Execution Core 도메인 리소스 골격 | `M` | `BE` | task/run/schedule/approval/calendar_event persistence와 공통 enum 준비 |
| `DEV-M4-T02` | task 조회 API | `S` | `BE` | task list/board/detail read API |
| `DEV-M4-T03` | task 생성/수정/checklist/link API | `M` | `BE` | task 기본 CRUD와 상세 편집 |
| `DEV-M4-T04` | task 상태/보관/삭제 영향 분석 | `M` | `BE` | 상태 변경, archive/delete, impact 처리 |
| `DEV-M4-T05` | Todo board 조회 UI | `M` | `FE` | 할 일 보드/목록/상세 read UX |
| `DEV-M4-T06` | Todo 편집 UI | `M` | `FE` | task 생성/수정/drag/checklist/link UI |
| `DEV-M4-T07` | task delegate preflight | `S` | `Fullstack` | AI에게 맡기기 전 권한/비용/입력 검증 |
| `DEV-M4-T08` | run 생성 API | `M` | `BE` | task/direct/schedule 기반 run 생성 |
| `DEV-M4-T09` | run 목록 API | `S` | `BE` | 맡긴 일 탭/필터/검색/카운트 |
| `DEV-M4-T10` | run 상세/log/artifact API | `M` | `BE` | run detail, logs, artifacts, event stream |
| `DEV-M4-T11` | run 상태 전이 엔진 | `M` | `BE` | canonical run transition, event, audit |
| `DEV-M4-T12` | run pause/resume 제어 | `S` | `Fullstack` | pause/resume API와 버튼 |
| `DEV-M4-T13` | run stop 제어 | `S` | `Fullstack` | 중지 확인/전이/감사 |
| `DEV-M4-T14` | run retry 제어 | `M` | `Fullstack` | 재시도 preflight와 새 실행/전이 |
| `DEV-M4-T15` | run scope message | `S` | `Fullstack` | 이 작업에 말하기 |
| `DEV-M4-T16` | approval request 생성/조회 | `M` | `Fullstack` | 승인 카드와 대기 목록 |
| `DEV-M4-T17` | approval approve/reject 처리 | `M` | `Fullstack` | 승인/거절 실행, 재검증, audit |
| `DEV-M4-T18` | schedule CRUD API | `M` | `BE` | 예약/반복 규칙 생성/수정/조회 |
| `DEV-M4-T19` | schedule active/paused toggle | `S` | `Fullstack` | 반복 자동 작업 토글 |
| `DEV-M4-T20` | schedule run-now | `S` | `Fullstack` | 즉시 실행과 occurrence 연결 |
| `DEV-M4-T21` | calendar range/manual event API | `M` | `BE` | 기간 조회와 수동 일정 CRUD |
| `DEV-M4-T22` | schedule occurrence projection/override | `M` | `BE` | 반복 occurrence와 예외/리스케줄 |
| `DEV-M4-T23` | Calendar 화면 UI | `M` | `FE` | 주/월/일/목록, 우측 패널, 제안/토글 표시 |
| `DEV-M4-T24` | task-run-schedule 동기화 E2E | `M` | `Fullstack` | 할 일 -> 맡긴 일 -> 캘린더 일관성 검증 |

## DEV-M4-T01 / Execution Core 도메인 리소스 골격

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-03`, `SCR-08`, `SCR-09` |
| Objects | `task`, `run`, `schedule`, `approval_request`, `calendar_event` |
| Depends on | `M1 Shell + Domain Foundation` |
| Blocks | `DEV-M4-T02`, `DEV-M4-T08`, `DEV-M4-T16`, `DEV-M4-T18`, `DEV-M4-T21` |
| Source docs | [공통 객체/상태](../../common/domain-model-and-state-policy.md), [공통 동선](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule) |

### 목적

Execution Core에서 반복 사용하는 도메인 리소스, 상태 enum, 공통 필드, repository/service/API skeleton을 먼저 세움. 이후 task/run/schedule/approval/calendar API가 서로 다른 상태명과 ID 규칙을 만들지 않게 하는 기반 작업임.

### 구현 범위

- `task`, `checklist_item`, `task_link`, `run`, `run_log`, `run_artifact`, `schedule`, `calendar_event`, `approval_request` 리소스 정의
- canonical status enum과 상태 전이 validator 기본 구조
- `hubId`, `ownerId`, `version`, `permissionState`, `createdAt`, `updatedAt`, `archivedAt`, `deletedAt` 공통 필드 적용
- id prefix, `clientRequestId`, `idempotencyKey`, audit metadata 저장 위치 결정

### 제외 범위

- 실제 LLM/agent 실행 엔진
- 외부 connector 호출
- UI 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T01-S01` | M4 객체 schema 초안 작성 | `BE` | 필수 객체와 relation이 공통 문서 용어와 일치 |
| `DEV-M4-T01-S02` | canonical enum 등록 | `BE` | task/run/schedule/approval/calendar_event 상태가 서버 타입으로 고정 |
| `DEV-M4-T01-S03` | 상태 전이 validator skeleton 작성 | `BE` | 허용되지 않은 transition이 공통 에러로 차단 |
| `DEV-M4-T01-S04` | audit/idempotency 공통 필드 연결 | `BE` | 위험 작업에서 사용할 request/audit 필드가 모든 리소스에 연결 가능 |

### Acceptance Criteria

- [ ] M4 모든 객체가 안정 ID와 `hubId`를 가진다.
- [ ] 화면 문서의 유사 상태명이 canonical enum으로 매핑된다.
- [ ] `task -> run -> schedule -> calendar_event -> approval_request` 관계를 표현할 수 있다.
- [ ] 위험 상태 전이를 audit log로 연결할 수 있는 공통 입력 구조가 있다.

### Test / Verification

- [ ] enum serialization/deserialization 단위 테스트
- [ ] 상태 전이 validator 허용/거부 케이스 테스트
- [ ] idempotency key 중복 요청 기본 테스트
- [ ] schema 또는 migration 검증

### Edge Cases

- 화면 라벨과 API enum이 다른 경우
- schedule이 없는 ad-hoc run
- task 없이 직접 생성된 run
- approval_request가 run/task/schedule 중 하나만 참조하는 경우

### Open Decisions

- `DEC-M4-01`: run retry가 기존 run 상태를 바꿀지, 새 run을 생성하고 원본을 참조할지 결정 필요
- `DEC-M4-02`: calendar_event 상태 enum을 공통 문서 후보 그대로 쓸지, `needs_approval`을 approval_request relation으로만 표현할지 결정 필요

## DEV-M4-T02 / task 조회 API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `BE` |
| Screens | `SCR-09` |
| Objects | `task`, `checklist_item`, `task_link` |
| Depends on | `DEV-M4-T01` |
| Blocks | `DEV-M4-T05`, `DEV-M4-T24` |
| Source docs | [할 일 상세](../../screens/09-todo.md#10-데이터-필드--api-힌트) |

### 목적

Todo 화면이 task 목록, 보드 컬럼, 상세 패널을 안정적으로 읽을 수 있는 read API를 제공함.

### 구현 범위

- `GET /api/tasks`
- `GET /api/tasks/board`
- `GET /api/tasks/{taskId}`
- 탭, view, status, priority, deadlineRange, topicId, createdBy, sort query 지원
- 목록 경량 필드와 상세 확장 필드 분리

### 제외 범위

- task 생성/수정
- AI 제안 생성
- task 위임

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T02-S01` | task list query 설계 | `BE` | 필터/정렬/cursor/pageSize 입력이 정의됨 |
| `DEV-M4-T02-S02` | board query 설계 | `BE` | 컬럼별 task와 카운트를 한 응답으로 제공 |
| `DEV-M4-T02-S03` | detail query 설계 | `BE` | checklist, links, suggestions, activity를 상세에서만 제공 |
| `DEV-M4-T02-S04` | permission summary 계산 | `BE` | 목록에서도 카드 액션 활성 판단 가능 |

### Acceptance Criteria

- [ ] 오늘/이번 주/주제별/자동 생성 탭을 API query로 표현 가능하다.
- [ ] 보드 컬럼 `today`, `scheduled`, `in_progress`, `done`별 카운트를 제공한다.
- [ ] 필터 결과가 비어도 컬럼 메타와 빈 상태 판단값을 반환한다.
- [ ] 삭제/보관 task deep link 상세는 fallback에 필요한 상태를 반환한다.

### Test / Verification

- [ ] status/priority/deadline/topic 필터 조합 테스트
- [ ] board count와 list count 일치 테스트
- [ ] 권한 없는 task가 목록/상세에서 안전하게 처리되는지 테스트
- [ ] cursor pagination 정렬 안정성 테스트

### Edge Cases

- task가 여러 topic에 연결됨
- 선택 task가 현재 필터 밖에 있음
- archived task deep link 접근
- deadline timezone이 사용자 timezone과 다름

### Open Decisions

- `DEC-M4-03`: `오늘` 탭과 `today` 상태 컬럼의 이름 충돌을 API에서는 어떻게 구분할지 결정 필요

## DEV-M4-T03 / task 생성/수정/checklist/link API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-09` |
| Objects | `task`, `checklist_item`, `task_link` |
| Depends on | `DEV-M4-T01`, `DEV-M4-T02` |
| Blocks | `DEV-M4-T06`, `DEV-M4-T07` |
| Source docs | [할 일 상세](../../screens/09-todo.md#5-컴포넌트별-상세-기능) |

### 목적

수동 task 생성, 채팅/파일/주제 기반 task 생성, 체크리스트와 연결 정보 편집을 지원함.

### 구현 범위

- `POST /api/tasks`
- `PATCH /api/tasks/{taskId}`
- `POST/PATCH/DELETE /api/tasks/{taskId}/checklist`
- `POST /api/tasks/{taskId}/links`
- `DELETE /api/tasks/{taskId}/links/{linkId}`
- task activity 기록

### 제외 범위

- 삭제/보관과 impact
- task delegate
- task dependency map

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T03-S01` | task 생성 API | `BE` | 제목 최소 입력으로 task 생성 가능 |
| `DEV-M4-T03-S02` | task 부분 수정 API | `BE` | title/status/priority/deadline/topic/checklist 입력 검증 |
| `DEV-M4-T03-S03` | checklist CRUD | `BE` | 추가/수정/완료/삭제/순서 변경 가능 |
| `DEV-M4-T03-S04` | task link CRUD | `BE` | topic/conversation/file/source/run/schedule/calendar_event relation 연결/해제 가능 |
| `DEV-M4-T03-S05` | activity 기록 | `BE` | 생성/수정/checklist/link 변경 이력이 상세에서 조회됨 |

### Acceptance Criteria

- [ ] task 생성 응답에 새 task ID와 version이 포함된다.
- [ ] checklist 완료율이 task progress 계산에 사용 가능하다.
- [ ] link 삭제는 원본 resource를 삭제하지 않고 relation만 제거한다.
- [ ] PATCH 충돌 시 409와 최신 version 정보를 반환한다.

### Test / Verification

- [ ] task 생성/수정 통합 테스트
- [ ] checklist 순서 변경 테스트
- [ ] link 중복 생성 방지 테스트
- [ ] optimistic locking 충돌 테스트

### Edge Cases

- 같은 conversation에서 유사 task 반복 생성
- 삭제된 source/file을 link로 추가 시도
- 권한 없는 topic에 task 연결
- checklist가 남아 있는 상태에서 task 완료 시도

### Open Decisions

- `DEC-M4-04`: 자동 생성 task의 신뢰도/검토 상태를 `task.createdBy`만으로 표현할지 별도 `ai_suggestion`으로 표현할지 결정 필요

## DEV-M4-T04 / task 상태/보관/삭제 영향 분석

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-09`, `SCR-08`, `SCR-03` |
| Objects | `task`, `run`, `schedule`, `calendar_event`, `audit_log` |
| Depends on | `DEV-M4-T03` |
| Blocks | `DEV-M4-T06`, `DEV-M4-T24` |
| Source docs | [공통 객체/상태](../../common/domain-model-and-state-policy.md#9-동시성--중복--삭제--보관), [할 일 상세](../../screens/09-todo.md#9-edge-case) |

### 목적

task 상태 변경, 완료, 보관, 삭제를 연결된 run/schedule/calendar_event와 안전하게 처리함.

### 구현 범위

- task status transition API 또는 PATCH validation
- `GET /api/tasks/{taskId}/impact`
- archive/delete 처리
- 연결 run/schedule이 있을 때 사용자 선택지 반환
- audit log 기록

### 제외 범위

- run stop 실제 수행
- schedule pause 실제 수행
- bulk action 전체 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T04-S01` | task status transition validator | `BE` | 허용되지 않은 상태 이동 차단 |
| `DEV-M4-T04-S02` | 완료 처리 정책 | `BE` | checklist/run 진행 상태에 따라 완료 가능 여부 계산 |
| `DEV-M4-T04-S03` | impact API | `BE` | 연결 run/schedule/calendar_event/link 수와 위험도를 반환 |
| `DEV-M4-T04-S04` | archive/delete API | `BE` | archive 우선, hard delete는 별도 확인 신호 필요 |
| `DEV-M4-T04-S05` | audit 기록 | `BE` | 상태/보관/삭제 변경의 before/after summary 저장 |

### Acceptance Criteria

- [ ] 완료 처리 시 `completedAt`과 activity가 기록된다.
- [ ] 실행 중 run이 연결된 task 삭제는 즉시 삭제되지 않고 영향 선택지를 반환한다.
- [ ] archived task는 목록 기본 결과에서 제외되고 deep link 상세는 가능하다.
- [ ] 상태 변경 실패 시 기존 task 상태가 보존된다.

### Test / Verification

- [ ] 상태별 허용/거부 transition 테스트
- [ ] 실행 중 run 연결 task 삭제 impact 테스트
- [ ] archive 후 목록/상세 조회 테스트
- [ ] audit log 생성 테스트

### Edge Cases

- 완료 task에 run이 아직 running
- task 삭제 중 schedule nextRunAt 존재
- 여러 브라우저에서 같은 task 상태 변경
- topic 권한 축소 후 task 수정 시도

### Open Decisions

- `DEC-M4-05`: run 완료 시 task를 자동 완료할지, 사용자 확인 후 완료할지 정책 결정 필요

## DEV-M4-T05 / Todo board 조회 UI

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-09` |
| Objects | `task`, `checklist_item`, `task_link` |
| Depends on | `DEV-M4-T02`, `M1 Shell + Route Foundation` |
| Blocks | `DEV-M4-T06`, `DEV-M4-T24` |
| Source docs | [할 일 상세](../../screens/09-todo.md#2-정보-구조) |

### 목적

할 일 화면의 읽기 UX를 구현함. 사용자는 보드, 탭, 필터, 상세 패널을 통해 task를 확인할 수 있어야 함.

### 구현 범위

- `/tasks`, `/tasks/:taskId` route surface
- 탭 `오늘/이번 주/주제별/자동 생성`
- 보드 컬럼 `오늘/예정/진행 중/완료`
- task 카드, 상세 패널 read-only 상태
- empty/loading/error/deep link fallback

### 제외 범위

- task 생성/수정
- drag 상태 변경
- AI에게 맡기기

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T05-S01` | route와 URL 상태 연결 | `FE` | tab/view/filter/selected task가 URL로 복원됨 |
| `DEV-M4-T05-S02` | task board 렌더링 | `FE` | 컬럼별 카드와 카운트가 표시됨 |
| `DEV-M4-T05-S03` | 상세 패널 read view | `FE` | 체크리스트, 연결 대화/파일, 추천, 활동이 표시됨 |
| `DEV-M4-T05-S04` | 상태 처리 | `FE` | empty/loading/error/권한 없음/fallback 상태가 분리됨 |

### Acceptance Criteria

- [ ] task 없는 첫 진입에서 `할 일 추가`, `채팅에서 만들기`, `자동 생성 확인` CTA가 표시된다.
- [ ] 카드 key는 `task.id`를 사용한다.
- [ ] 필터 결과 없음과 권한 때문에 비어 보임이 구분된다.
- [ ] `/tasks/{taskId}` 직접 접근 시 목록과 상세가 독립적으로 복구된다.

### Test / Verification

- [ ] 주요 route 렌더링 테스트
- [ ] 탭/필터 URL 복원 테스트
- [ ] empty/error 상태 스토리 또는 UI 테스트
- [ ] 접근성: 카드/상세 패널 키보드 이동 확인

### Edge Cases

- 선택 task가 현재 탭 범위 밖
- task 상세 조회 실패, 목록 조회 성공
- 보관된 task deep link
- 긴 제목/긴 topic 이름이 카드 안에서 넘침

### Open Decisions

- `DEC-M4-06`: 칸반/목록/맵 view 중 M4에서 목록 view를 어디까지 구현할지 결정 필요

## DEV-M4-T06 / Todo 편집 UI

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-09` |
| Objects | `task`, `checklist_item`, `task_link` |
| Depends on | `DEV-M4-T03`, `DEV-M4-T04`, `DEV-M4-T05` |
| Blocks | `DEV-M4-T07`, `DEV-M4-T24` |
| Source docs | [할 일 상세](../../screens/09-todo.md#5-컴포넌트별-상세-기능) |

### 목적

사용자가 할 일을 생성/수정하고, 체크리스트를 관리하고, 보드에서 상태를 바꾸는 기본 편집 UX를 제공함.

### 구현 범위

- `+ 할 일 추가`
- 상세 패널 title/priority/deadline/topic/checklist 편집
- drag/drop 또는 상태 메뉴로 task status 변경
- task link 추가/해제 UI
- 실패 rollback과 toast

### 제외 범위

- task dependency map
- bulk action 전체 기능
- AI 제안 생성

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T06-S01` | task 생성 모달 | `FE` | 제목 최소 입력으로 task 생성 후 보드에 반영 |
| `DEV-M4-T06-S02` | 상세 패널 편집 | `FE` | 주요 필드 수정과 version 충돌 표시 |
| `DEV-M4-T06-S03` | checklist UI | `FE` | 추가/완료/삭제/순서 변경 가능 |
| `DEV-M4-T06-S04` | status 이동 UI | `FE` | 컬럼 이동 실패 시 원위치 rollback |
| `DEV-M4-T06-S05` | archive/delete 확인 UI | `FE` | impact 결과를 표시하고 위험 선택지를 분리 |

### Acceptance Criteria

- [ ] task 생성 후 생성된 task가 선택되고 상세 패널이 열린다.
- [ ] drag 실패 시 이전 컬럼과 정렬로 되돌아간다.
- [ ] 미완료 checklist가 있는 task 완료 시 확인 절차가 있다.
- [ ] task 삭제/보관은 impact 확인 없이는 실행되지 않는다.

### Test / Verification

- [ ] 생성/수정/체크리스트 UI 흐름 테스트
- [ ] drag 실패 rollback 테스트
- [ ] archive/delete impact 모달 테스트
- [ ] 중복 클릭 방지 확인

### Edge Cases

- 네트워크 지연 중 같은 task 여러 필드 수정
- 권한 없는 task의 편집 버튼 노출
- 완료 컬럼 task를 다시 today로 이동
- task 생성 직후 board query가 stale

### Open Decisions

- `DEC-M4-07`: task bulk action을 M4에 포함할지, M7 이후로 미룰지 결정 필요

## DEV-M4-T07 / task delegate preflight

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-09`, `SCR-03` |
| Objects | `task`, `run`, `approval_request`, `connection` |
| Depends on | `DEV-M4-T03`, `DEV-M4-T06`, `M6 provider/connection 기본 결정` |
| Blocks | `DEV-M4-T08`, `DEV-M4-T16`, `DEV-M4-T24` |
| Source docs | [할 일 상세](../../screens/09-todo.md#513-ai에게-맡기기), [공통 동선](../../common/navigation-and-cross-screen-flows.md#12-권한비용연결-미비-시-공통-ux) |

### 목적

`AI에게 맡기기` 클릭 전 task 입력값, 연결 파일/대화/source, agent/tool, 비용, 권한, approval 필요 여부를 미리 계산함.

### 구현 범위

- delegate preview API 또는 command preview
- task 입력 pack 생성
- 권한/connection/cost/capability 점검 결과 반환
- approval 필요 시 approval_request 후보 반환
- UI preflight sheet

### 제외 범위

- 실제 run 생성
- approval approve/reject 처리
- provider별 세부 비용 계산 고도화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T07-S01` | delegate input pack 설계 | `BE` | task/checklist/links/conversation/file/source를 run 입력으로 요약 |
| `DEV-M4-T07-S02` | permission/cost/connection preflight | `BE` | 실행 가능/승인 필요/차단 상태가 구분됨 |
| `DEV-M4-T07-S03` | preflight UI | `FE` | agent/tool/cost/approval/결과 저장 위치를 사용자가 확인 |
| `DEV-M4-T07-S04` | 실패/차단 CTA | `FE` | 연결 설정, 비용 설정, 권한 요청 경로 제공 |

### Acceptance Criteria

- [ ] 외부 쓰기/비용 초과/예약 실행 필요 시 즉시 run을 만들지 않고 approval 후보를 보여준다.
- [ ] 파일 권한 부족과 provider 미연결이 다른 사유로 표시된다.
- [ ] preflight 결과에 idempotencyKey 또는 clientRequestId가 포함된다.
- [ ] 사용자가 취소해도 task 상태는 변하지 않는다.

### Test / Verification

- [ ] 승인 불필요 task preflight 테스트
- [ ] 비용 초과 task preflight 테스트
- [ ] connection expired task preflight 테스트
- [ ] UI에서 차단 사유별 CTA 확인

### Edge Cases

- task 연결 파일 중 일부만 AI 참조 가능
- agent가 비활성 connection을 참조
- 비용 추정 불가
- task가 이미 delegatedRunId를 가짐

### Open Decisions

- `DEC-M4-08`: M4에서 기본 agent 선택을 자동으로 할지, 사용자가 매번 선택하게 할지 결정 필요

## DEV-M4-T08 / run 생성 API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-03`, `SCR-09`, `SCR-08` |
| Objects | `run`, `task`, `schedule`, `approval_request` |
| Depends on | `DEV-M4-T01`, `DEV-M4-T07` |
| Blocks | `DEV-M4-T09`, `DEV-M4-T10`, `DEV-M4-T11`, `DEV-M4-T24` |
| Source docs | [공통 동선](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule), [맡긴 일 상세](../../screens/03-delegated-work.md#115-api-힌트) |

### 목적

task 위임, 직접 작업 맡기기, schedule 실행에서 공통 run을 생성함.

### 구현 범위

- `POST /api/runs`
- `POST /api/tasks/{taskId}/delegate`
- schedule 기반 내부 run creation entrypoint
- task 상태 `in_progress` 또는 `waiting_approval` 반영
- run 생성 event와 activity 기록

### 제외 범위

- 실제 agent 작업 수행
- run logs 상세
- approval 처리

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T08-S01` | run 생성 요청 모델 | `BE` | task/direct/schedule origin을 구분 |
| `DEV-M4-T08-S02` | delegate run 생성 | `BE` | task에 delegatedRunId와 상태가 반영됨 |
| `DEV-M4-T08-S03` | direct run 생성 | `BE` | 맡긴 일 화면의 `작업 맡기기`에서 run 생성 가능 |
| `DEV-M4-T08-S04` | schedule run 생성 entrypoint | `BE` | schedule occurrence와 run이 연결됨 |
| `DEV-M4-T08-S05` | 생성 멱등성 | `BE` | 같은 idempotencyKey 중복 요청이 같은 run 또는 approval 결과 반환 |

### Acceptance Criteria

- [ ] task 기반 run 생성 시 task와 run relation이 저장된다.
- [ ] approval이 필요하면 run 생성 대신 또는 run paused 상태와 함께 approval_request가 생성된다.
- [ ] schedule 기반 run은 `scheduleId`와 occurrence key를 가진다.
- [ ] 생성 실패 시 task 상태가 원복되거나 변경되지 않는다.

### Test / Verification

- [ ] task delegate run 생성 테스트
- [ ] direct run 생성 테스트
- [ ] schedule run 생성 테스트
- [ ] 중복 요청 멱등성 테스트

### Edge Cases

- 같은 task에서 동시에 delegate 클릭
- schedule occurrence가 중복 실행됨
- task가 archived/deleted 상태
- approval 필요 작업에서 run을 먼저 만들지 나중에 만들지 정책 차이

### Open Decisions

- `DEC-M4-09`: approval 필요 시 run을 `approval_waiting`으로 먼저 만들지, approval 승인 후 run을 만들지 결정 필요

## DEV-M4-T09 / run 목록 API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `BE` |
| Screens | `SCR-03` |
| Objects | `run`, `approval_request`, `schedule`, `agent` |
| Depends on | `DEV-M4-T08` |
| Blocks | `DEV-M4-T10`, `DEV-M4-T24` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#23-중앙-목록-정보-구조) |

### 목적

맡긴 일 화면의 탭, 필터, 검색, 목록 컬럼을 제공하는 조회 API를 구현함.

### 구현 범위

- `GET /api/runs?status=&topicId=&agentId=&toolId=&query=&cursor=`
- 탭 매핑: 진행 중, 승인 대기, 예약됨, 완료
- 목록 카운트와 필터
- 경량 run 카드/행 필드

### 제외 범위

- run detail/log/artifact
- run 제어
- realtime event stream

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T09-S01` | status tab query | `BE` | canonical run 상태가 화면 탭으로 매핑됨 |
| `DEV-M4-T09-S02` | filter/search query | `BE` | topic/agent/tool/cost/date/query 필터 지원 |
| `DEV-M4-T09-S03` | list row projection | `BE` | 진행률, 비용, 최근 로그, 담당 agent 요약 반환 |
| `DEV-M4-T09-S04` | tab count projection | `BE` | 탭별 카운트가 필터 적용 전 기준으로 제공 |

### Acceptance Criteria

- [ ] `approval_waiting` run은 승인 대기 탭에 표시된다.
- [ ] `scheduled` run 또는 예약 준비 상태는 예약됨 탭에 표시된다.
- [ ] 목록 row는 상세 API 없이 기본 컬럼을 렌더링할 수 있다.
- [ ] 검색은 현재 탭/필터를 유지한다.

### Test / Verification

- [ ] 상태별 탭 매핑 테스트
- [ ] 필터 조합 테스트
- [ ] 최근 로그 projection 테스트
- [ ] pagination 안정성 테스트

### Edge Cases

- run 상태 이벤트가 역순으로 도착
- cost가 추정값임
- agent가 삭제/비활성화됨
- schedule origin이 있지만 다음 실행 없음

### Open Decisions

- `DEC-M4-10`: 예약됨 탭에서 반복 schedule의 다음 실행만 보여줄지, 미래 occurrence 여러 개를 보여줄지 결정 필요

## DEV-M4-T10 / run 상세/log/artifact API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-03` |
| Objects | `run`, `run_log`, `run_artifact`, `run_agent`, `approval_request` |
| Depends on | `DEV-M4-T08`, `DEV-M4-T09` |
| Blocks | `DEV-M4-T12`, `DEV-M4-T13`, `DEV-M4-T14`, `DEV-M4-T15`, `DEV-M4-T16` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#24-우측-상세-패널-정보-구조) |

### 목적

run 상세 패널의 개요, 로그, 파일/결과, 설정 탭을 렌더링하는 read API와 event 갱신 기반을 제공함.

### 구현 범위

- `GET /api/runs/{runId}`
- `GET /api/runs/{runId}/logs?cursor=&agentId=`
- `GET /api/runs/{runId}/artifacts`
- run detail의 approval summary
- SSE/WebSocket 또는 polling fallback 계약

### 제외 범위

- artifact 생성 파이프라인
- run 제어 mutation
- 실제 multi-agent tree engine

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T10-S01` | run detail projection | `BE` | header/status/progress/cost/agent tree/settings 반환 |
| `DEV-M4-T10-S02` | run log query | `BE` | cursor와 agentId 필터로 로그 조회 |
| `DEV-M4-T10-S03` | artifact query | `BE` | 연결 파일/문서/결과물 요약 반환 |
| `DEV-M4-T10-S04` | realtime event contract | `BE` | `run.status_changed`, `run.log_created`, `run.artifact_created` 이벤트 계약 정의 |

### Acceptance Criteria

- [ ] 상세 조회 실패가 목록 전체 실패로 번지지 않는다.
- [ ] 승인 요청이 여러 개면 긴급 approval summary가 반환된다.
- [ ] 로그는 오래된 run에서도 cursor 기반으로 조회 가능하다.
- [ ] artifact 링크는 파일/문서/주제 중 연결 대상 route 정보를 포함한다.

### Test / Verification

- [ ] run detail projection 테스트
- [ ] logs pagination 테스트
- [ ] artifact permission 테스트
- [ ] event payload schema 테스트

### Edge Cases

- 로그가 매우 많음
- artifact 권한이 없음
- run이 삭제 대신 보관됨
- 승인 요청이 만료됨

### Open Decisions

- `DEC-M4-11`: M4에서 realtime은 SSE로 시작할지 polling fallback만 먼저 둘지 결정 필요

## DEV-M4-T11 / run 상태 전이 엔진

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-03`, `SCR-08`, `SCR-09` |
| Objects | `run`, `task`, `schedule`, `calendar_event`, `audit_log` |
| Depends on | `DEV-M4-T01`, `DEV-M4-T08`, `DEV-M4-T10` |
| Blocks | `DEV-M4-T12`, `DEV-M4-T13`, `DEV-M4-T14`, `DEV-M4-T24` |
| Source docs | [공통 객체/상태](../../common/domain-model-and-state-policy.md#52-주요-상태-전이), [맡긴 일 상세](../../screens/03-delegated-work.md#6-run-상태-모델) |

### 목적

run 상태를 임의 문자열 변경이 아니라 서버 전이 규칙과 이벤트로 관리함. 이 작업은 task, calendar, schedule 동기화의 기준점임.

### 구현 범위

- run transition command 내부 API
- 허용 전이: `draft -> scheduled -> queued -> running`, `running -> approval_waiting`, `paused`, `stopping`, `retrying`, `succeeded`, `failed` 등
- 상태 변경 event 발행
- audit log 기록
- task/schedule/calendar_event downstream hook 진입점

### 제외 범위

- pause/resume/stop/retry 버튼별 UX
- 실제 runner worker orchestration
- 외부 connector 취소

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T11-S01` | transition matrix 구현 | `BE` | 공통 문서의 run 상태 전이와 일치 |
| `DEV-M4-T11-S02` | transition command idempotency | `BE` | 중복 이벤트/중복 command가 상태를 망가뜨리지 않음 |
| `DEV-M4-T11-S03` | event 발행 | `BE` | 상태 변경 시 payload에 이전/이후 상태와 원인 포함 |
| `DEV-M4-T11-S04` | audit 기록 | `BE` | 사용자/시스템/agent actor 구분 |

### Acceptance Criteria

- [ ] 허용되지 않은 상태 전이는 409 또는 domain error로 차단된다.
- [ ] 상태 변경 이벤트에 `runId`, `previousStatus`, `nextStatus`, `reason`, `occurredAt`이 포함된다.
- [ ] 동일 requestId로 같은 상태 전이를 반복해도 결과가 멱등이다.
- [ ] task/schedule/calendar 동기화 task가 이벤트를 구독할 수 있다.

### Test / Verification

- [ ] 전체 transition matrix 테스트
- [ ] 중복 이벤트 테스트
- [ ] 역순 이벤트 처리 테스트
- [ ] audit log 생성 테스트

### Edge Cases

- `stopping` 중 `succeeded` 이벤트 도착
- approval 만료와 stop 요청 동시 발생
- runner heartbeat 유실
- provider가 이미 완료한 뒤 실패 이벤트 전달

### Open Decisions

- `DEC-M4-12`: runner heartbeat timeout을 `expired`로 볼지 `failed`로 볼지 결정 필요

## DEV-M4-T12 / run pause/resume 제어

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-03` |
| Objects | `run`, `run_log`, `audit_log` |
| Depends on | `DEV-M4-T10`, `DEV-M4-T11` |
| Blocks | `DEV-M4-T24` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#81-pause), [공통 객체/상태](../../common/domain-model-and-state-policy.md#8-optimistic-update--rollback) |

### 목적

실행 중인 run을 일시정지하고, 조건 재검증 후 재개하는 안전 제어를 제공함.

### 구현 범위

- `POST /api/runs/{runId}/pause`
- `POST /api/runs/{runId}/resume`
- 상세 패널 버튼 상태
- pause 중 안내와 resume 전 검증 결과

### 제외 범위

- stop/retry
- 외부 호출 강제 취소

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T12-S01` | pause API | `BE` | running/일부 approval_waiting에서 paused 전이 |
| `DEV-M4-T12-S02` | resume API | `BE` | credential/cost/approval 만료 재검증 후 running 전이 |
| `DEV-M4-T12-S03` | 제어 버튼 UI | `FE` | 상태별 pause/resume 버튼 노출과 pending 처리 |
| `DEV-M4-T12-S04` | 로그/감사 표시 | `Fullstack` | pause/resume 결과가 logs/activity/audit에 남음 |

### Acceptance Criteria

- [ ] running run에서 pause를 누르면 새 tool call 생성이 중단된다.
- [ ] paused run에서 resume을 누르면 사전 검증 후 재개된다.
- [ ] resume 불가 사유는 credential/cost/approval/permission으로 구분된다.
- [ ] 버튼 중복 클릭은 멱등 처리된다.

### Test / Verification

- [ ] pause/resume API 테스트
- [ ] resume preflight 실패 테스트
- [ ] 버튼 pending/disabled UI 테스트
- [ ] audit log 확인

### Edge Cases

- 이미 완료된 run에 pause 요청
- pause 요청 후 running 이벤트 도착
- pause 중 사용자가 run message 입력
- resume 직전 credential 만료

### Open Decisions

- `DEC-M4-13`: pause 중 이미 시작된 취소 불가 step의 UI 상태명을 `정리 중`으로 둘지 결정 필요

## DEV-M4-T13 / run stop 제어

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-03`, `SCR-09`, `SCR-08` |
| Objects | `run`, `task`, `schedule`, `calendar_event`, `audit_log` |
| Depends on | `DEV-M4-T10`, `DEV-M4-T11` |
| Blocks | `DEV-M4-T14`, `DEV-M4-T24` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#83-stop) |

### 목적

중지라는 위험한 쓰기를 독립 플로우로 구현함. 이미 발생한 비용, 취소 불가 외부 작업, 연결 task/schedule 영향을 사용자에게 보여준 뒤 실행함.

### 구현 범위

- `POST /api/runs/{runId}/stop`
- stop impact/preflight
- 확인 모달
- `stopping -> stopped` 전이
- task/schedule/calendar_event 영향 event 발행

### 제외 범위

- retry
- 외부 예약/결제 취소 자동화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T13-S01` | stop impact 계산 | `BE` | 비용/외부 작업/생성 artifact/연결 task/schedule 영향 반환 |
| `DEV-M4-T13-S02` | stop API | `BE` | running/paused/approval_waiting에서 stopping 후 stopped 처리 |
| `DEV-M4-T13-S03` | 중지 확인 UI | `FE` | 영향과 이미 발생한 비용 표시 후 확인 가능 |
| `DEV-M4-T13-S04` | downstream event | `BE` | task/calendar/schedule가 stopped 상태를 반영할 수 있음 |

### Acceptance Criteria

- [ ] stop은 확인 없이 실행되지 않는다.
- [ ] stop 후 중간 결과, 로그, 비용 기록은 유지된다.
- [ ] 연결 task에는 run stopped 상태가 활동 기록으로 남는다.
- [ ] schedule이 만든 run을 중지해도 schedule 자체 active/paused는 별도 유지된다.

### Test / Verification

- [ ] stop impact 테스트
- [ ] stop transition 테스트
- [ ] 중복 stop 요청 멱등성 테스트
- [ ] UI 확인 모달 테스트

### Edge Cases

- 외부 결제가 이미 완료됨
- stop 중 run이 succeeded로 완료됨
- schedule occurrence 하나만 중지하고 schedule은 유지
- 중지 권한 없는 사용자

### Open Decisions

- `DEC-M4-14`: stopped run을 완료 탭에 둘지 별도 중지 필터로 강조할지 결정 필요

## DEV-M4-T14 / run retry 제어

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-03`, `SCR-09`, `SCR-08` |
| Objects | `run`, `task`, `schedule`, `approval_request`, `audit_log` |
| Depends on | `DEV-M4-T11`, `DEV-M4-T13` |
| Blocks | `DEV-M4-T24` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#84-retry), [공통 객체/상태](../../common/domain-model-and-state-policy.md#13-오픈-질문) |

### 목적

재시도는 외부 쓰기 중복과 비용 중복 위험이 있어 별도 task로 분리함. 실패 step부터 재시도할지 전체 복제 실행할지 정책을 preflight에서 명확히 보여줌.

### 구현 범위

- `POST /api/runs/{runId}/retry`
- retry preflight
- 실패 step 재시도 또는 새 run 생성 정책 적용
- approval/credential/cost 재검증
- UI 재시도 확인

### 제외 범위

- provider별 step replay 구현 고도화
- 수동 step 선택 상세 UI

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T14-S01` | retry eligibility 계산 | `BE` | failed/stopped/expired 중 재시도 가능 여부 반환 |
| `DEV-M4-T14-S02` | retry preflight | `BE` | 비용/권한/외부 쓰기 중복 위험 표시 |
| `DEV-M4-T14-S03` | retry API | `BE` | retrying 전이 또는 새 run 생성 후 원본 relation 저장 |
| `DEV-M4-T14-S04` | retry UI | `FE` | 실패 원인, 재시도 범위, 승인 필요 여부를 확인 |
| `DEV-M4-T14-S05` | task/schedule 연결 갱신 | `BE` | retry 결과 run이 원본 task/schedule에서 추적됨 |

### Acceptance Criteria

- [ ] 권한/credential/cost가 바뀌었으면 재시도 전 다시 검증한다.
- [ ] 외부 쓰기 step은 idempotency/fingerprint 없이는 자동 재시도하지 않는다.
- [ ] retry 결과는 원본 run과 연결된다.
- [ ] 실패 원인이 사용자에게 요약 표시된다.

### Test / Verification

- [ ] retry eligibility 테스트
- [ ] 외부 쓰기 위험 retry 차단 테스트
- [ ] retry 후 task progress 연결 테스트
- [ ] UI retry confirmation 테스트

### Edge Cases

- 원본 run artifact가 삭제됨
- approval 만료 후 retry
- stopped run retry 허용 여부
- schedule occurrence retry가 다음 occurrence와 충돌

### Open Decisions

- `DEC-M4-15`: retry를 원본 run 상태 전이로 둘지 새 run 생성으로 둘지 `DEC-M4-01`과 함께 확정 필요

## DEV-M4-T15 / run scope message

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-03` |
| Objects | `run`, `conversation`, `message`, `run_log` |
| Depends on | `DEV-M4-T10`, `M2 conversation scope foundation` |
| Blocks | `DEV-M4-T24` |
| Source docs | [맡긴 일 상세](../../screens/03-delegated-work.md#514-이-작업에-말하기), [공통 동선](../../common/navigation-and-cross-screen-flows.md#41-채팅-scope) |

### 목적

`이 작업에 말하기` 입력을 전역 채팅이 아니라 run scope conversation으로 저장하고, 실행 계획 변경 또는 로그 질의로 연결함.

### 구현 범위

- `POST /api/runs/{runId}/messages`
- run scope conversation 생성/조회
- 상세 패널 message 입력 UI
- 빠른 지시 버튼

### 제외 범위

- 복잡한 LLM 응답 streaming
- run plan 자동 수정 고도화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T15-S01` | run conversation 연결 | `BE` | run마다 scopeType=`run`, scopeId=`runId` conversation 연결 |
| `DEV-M4-T15-S02` | message API | `BE` | run message 저장과 run_log/activity 연결 |
| `DEV-M4-T15-S03` | message UI | `FE` | 입력/전송/빠른 지시/pending 표시 |
| `DEV-M4-T15-S04` | 권한/상태 validation | `BE` | 종료/보관/권한 없음 상태에서 쓰기 차단 |

### Acceptance Criteria

- [ ] run message가 global/topic conversation에 섞이지 않는다.
- [ ] 종료된 run에는 추가 지시 대신 질문/조회만 허용하거나 차단 사유를 표시한다.
- [ ] message 전송 실패 시 입력 내용이 보존된다.
- [ ] message가 비용/외부 쓰기를 유발하면 approval flow로 전환된다.

### Test / Verification

- [ ] run scope conversation 저장 테스트
- [ ] 종료 run message 차단 테스트
- [ ] UI 입력 실패 복구 테스트
- [ ] scope 혼동 회귀 테스트

### Edge Cases

- run이 중지되는 순간 message 전송
- pause 중 message를 계획에 반영
- 사용자가 같은 지시를 여러 번 클릭
- run 상세 deep link에서 conversation 미생성

### Open Decisions

- `DEC-M4-16`: run chat 메시지를 전역 대화 히스토리 검색에 노출할지 결정 필요

## DEV-M4-T16 / approval request 생성/조회

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-03`, `SCR-08`, `SCR-09` |
| Objects | `approval_request`, `run`, `task`, `schedule` |
| Depends on | `DEV-M4-T01`, `DEV-M4-T07`, `DEV-M4-T08` |
| Blocks | `DEV-M4-T17`, `DEV-M4-T24` |
| Source docs | [공통 동선 Approval Flow](../../common/navigation-and-cross-screen-flows.md#11-approval-flow), [맡긴 일 상세](../../screens/03-delegated-work.md#512-승인-대기-카드) |

### 목적

외부 쓰기, 비용 초과, 권한 상승, 예약/반복 실행 변경 전에 approval_request를 생성하고 조회하는 기반을 제공함.

### 구현 범위

- approval_request 생성 내부 API
- `GET /api/approval-requests?runId=&status=pending`
- run/detail/list approval summary
- 승인 카드 UI read state
- sidebar/today/runs badge에 필요한 count event

### 제외 범위

- approve/reject 처리
- 외부 connector 실제 실행

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T16-S01` | approval 생성 모델 | `BE` | requestType/target/run/task/schedule/cost/permission 필드 저장 |
| `DEV-M4-T16-S02` | 중복 approval 방지 | `BE` | idempotencyKey와 targetFingerprint로 중복 외부 쓰기 방지 |
| `DEV-M4-T16-S03` | approval 조회 API | `BE` | runId/status 기준 pending approval 조회 |
| `DEV-M4-T16-S04` | 승인 카드 UI | `FE` | 대상/변경 요약/비용/권한/만료/버튼 표시 |
| `DEV-M4-T16-S05` | approval badge event | `BE` | `approval.requested` 이벤트 발행 |

### Acceptance Criteria

- [ ] 승인 카드에는 대상, payload 요약, 예상 비용, 권한 scope, 영향 범위, 만료 시각이 표시된다.
- [ ] 같은 외부 쓰기 fingerprint로 중복 approval이 생성되지 않는다.
- [ ] 승인 권한 없는 사용자는 버튼이 비활성화된다.
- [ ] approval이 생성되면 run/task/schedule 상태가 사용자 조치 필요 상태로 갱신 가능하다.

### Test / Verification

- [ ] approval 생성 테스트
- [ ] 중복 approval 방지 테스트
- [ ] approval 조회/필터 테스트
- [ ] 승인 카드 권한별 UI 테스트

### Edge Cases

- 승인 중 대상 payload 변경
- 가격/비용 추정 불가
- approval 만료
- run 하나에 approval 여러 개 존재

### Open Decisions

- `DEC-M4-17`: 승인 대기 탭을 approval_request 단위로 보여줄지 run 단위로 보여줄지 결정 필요

## DEV-M4-T17 / approval approve/reject 처리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-03`, `SCR-08`, `SCR-09` |
| Objects | `approval_request`, `run`, `task`, `schedule`, `audit_log` |
| Depends on | `DEV-M4-T16`, `DEV-M4-T11` |
| Blocks | `DEV-M4-T24` |
| Source docs | [공통 동선 Approval 처리 정책](../../common/navigation-and-cross-screen-flows.md#113-승인-처리-정책) |

### 목적

승인/거절은 위험한 쓰기이므로 별도 task로 구현함. 승인 직전 대상/비용/권한/credential을 재검증하고, 원 작업을 실행 또는 보류함.

### 구현 범위

- `POST /api/approval-requests/{approvalId}/approve`
- `POST /api/approval-requests/{approvalId}/reject`
- approve 전 최신 impact/cost/permission 재검증
- 승인/거절 후 run/task/schedule 상태 반영
- audit log

### 제외 범위

- 실제 외부 결제/예약 connector
- 이메일/푸시 알림

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T17-S01` | approve API | `BE` | pending approval만 승인 가능하고 재검증 후 처리 |
| `DEV-M4-T17-S02` | reject API | `BE` | 원 작업은 실행하지 않고 run/task/schedule에 거절 결과 반영 |
| `DEV-M4-T17-S03` | 승인 직전 재검증 | `BE` | payload/cost/permission/credential 변화 시 재승인 요구 |
| `DEV-M4-T17-S04` | 승인/거절 UI | `FE` | pending, success, rejected, expired 상태 처리 |
| `DEV-M4-T17-S05` | audit/event | `BE` | approval.resolved와 audit log 저장 |

### Acceptance Criteria

- [ ] expired/cancelled approval은 승인되지 않는다.
- [ ] 승인 직전 가격 또는 대상이 의미 있게 바뀌면 기존 approval은 무효화된다.
- [ ] 거절 시 원 작업은 실행되지 않는다.
- [ ] 승인/거절 결과는 맡긴 일, 캘린더, 할 일 화면에 동기화된다.

### Test / Verification

- [ ] approve/reject API 테스트
- [ ] expired approval 처리 테스트
- [ ] payload 변경 재승인 테스트
- [ ] UI 중복 클릭 멱등성 테스트

### Edge Cases

- 두 탭에서 동시에 승인 클릭
- 승인 권한이 중간에 사라짐
- approval 승인 후 외부 작업 실패
- schedule occurrence approval이 만료됨

### Open Decisions

- `DEC-M4-18`: 승인 만료 후 run을 `paused`로 둘지 `failed`로 둘지 requestType별 정책 결정 필요

## DEV-M4-T18 / schedule CRUD API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-08`, `SCR-03`, `SCR-09` |
| Objects | `schedule`, `task`, `run`, `calendar_event`, `approval_request` |
| Depends on | `DEV-M4-T01`, `DEV-M4-T07` |
| Blocks | `DEV-M4-T19`, `DEV-M4-T20`, `DEV-M4-T21`, `DEV-M4-T22` |
| Source docs | [캘린더 상세](../../screens/08-calendar.md#62-자동-작업을-새로-예약), [공통 동선](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule) |

### 목적

예약/반복 자동 작업을 생성, 조회, 수정하는 schedule API를 구현함. schedule은 미래 run을 만드는 규칙이고, 캘린더에는 occurrence로 표시됨.

### 구현 범위

- `GET /api/schedules?status=&topicId=`
- `POST /api/schedules`
- `PATCH /api/schedules/{scheduleId}`
- recurrenceRule, timezone, nextRunAt, approvalPolicy, costLimit, taskId/topicId/agentId 연결
- schedule 생성/수정 preflight

### 제외 범위

- active/paused toggle
- run-now
- occurrence override
- 실제 cron/worker scheduler infra 고도화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T18-S01` | schedule 생성 API | `BE` | 시간/반복/timezone/승인/비용 정책을 저장 |
| `DEV-M4-T18-S02` | schedule 수정 API | `BE` | recurrence/timezone/approval/cost 변경과 version 충돌 처리 |
| `DEV-M4-T18-S03` | schedule 목록 API | `BE` | 반복 자동 작업 패널과 예약됨 탭에 필요한 projection 반환 |
| `DEV-M4-T18-S04` | nextRunAt 계산 | `BE` | timezone 기반 다음 실행 시각 계산 |
| `DEV-M4-T18-S05` | 생성/수정 audit | `BE` | schedule 생성/수정 전후 요약 기록 |

### Acceptance Criteria

- [ ] schedule은 `taskId` 또는 `topicId` 없이도 생성 가능하지만 실행 목표는 필수다.
- [ ] timezone이 요청/응답에 포함된다.
- [ ] 반복 규칙 수정 후 `nextRunAt`이 재계산된다.
- [ ] 예약/반복 실행이 approval 필요 조건이면 approval_request로 전환된다.

### Test / Verification

- [ ] schedule create/update 테스트
- [ ] timezone별 nextRunAt 테스트
- [ ] approvalPolicy별 생성 차단/대기 테스트
- [ ] version 충돌 테스트

### Edge Cases

- DST 전환일
- recurrenceRule이 과도하게 빈번함
- agent/connection이 비활성화됨
- 비용 한도보다 예상 비용이 큼

### Open Decisions

- `DEC-M4-19`: M4에서 지원할 recurrenceRule 범위를 daily/weekly/monthly 중 어디까지로 제한할지 결정 필요

## DEV-M4-T19 / schedule active/paused toggle

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-08`, `SCR-03` |
| Objects | `schedule`, `run`, `calendar_event`, `approval_request`, `audit_log` |
| Depends on | `DEV-M4-T18`, `DEV-M4-T11` |
| Blocks | `DEV-M4-T23`, `DEV-M4-T24` |
| Source docs | [캘린더 상세 반복 작업 토글](../../screens/08-calendar.md#94-반복-작업-토글), [공통 객체/상태](../../common/domain-model-and-state-policy.md#8-optimistic-update--rollback) |

### 목적

반복 자동 작업 토글은 위험한 쓰기이므로 별도 구현함. queued/running run 존재 여부에 따라 `이번 실행 후 끄기`, `지금 중지하고 끄기`, `취소` 분기를 제공함.

### 구현 범위

- `PATCH /api/schedules/{scheduleId}/status`
- active -> paused, paused -> active
- queued/running run 영향 분석
- optimistic toggle과 rollback
- audit log

### 제외 범위

- schedule 삭제
- 복잡한 occurrence별 toggle

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T19-S01` | toggle preflight | `BE` | queued/running run과 nextRunAt 영향 반환 |
| `DEV-M4-T19-S02` | status 변경 API | `BE` | active/paused 전이가 서버에서 검증됨 |
| `DEV-M4-T19-S03` | 토글 UI | `FE` | optimistic toggle, 영향 분기, 실패 rollback 제공 |
| `DEV-M4-T19-S04` | downstream 갱신 | `BE` | calendar occurrence와 runs 예약됨 탭 갱신 이벤트 발행 |

### Acceptance Criteria

- [ ] active -> paused 시 다음 실행 예약이 해제된다.
- [ ] running run이 있으면 즉시 pause하지 않고 선택지를 표시한다.
- [ ] failed schedule 재활성화 시 실패 원인 해결 여부를 확인한다.
- [ ] toggle 실패 시 UI가 이전 상태로 복구된다.

### Test / Verification

- [ ] active/paused toggle API 테스트
- [ ] queued/running run 존재 분기 테스트
- [ ] optimistic rollback UI 테스트
- [ ] audit log 확인

### Edge Cases

- 토글 중 schedule이 삭제/보관됨
- owner가 아닌 사용자의 토글
- schedule active와 cost policy 축소 동시 발생
- 네트워크 재시도로 토글 두 번 전송

### Open Decisions

- `DEC-M4-20`: schedule 생성자만 토글할지 hub 관리자도 토글할지 권한 정책 결정 필요

## DEV-M4-T20 / schedule run-now

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-08`, `SCR-03` |
| Objects | `schedule`, `run`, `calendar_event`, `approval_request` |
| Depends on | `DEV-M4-T08`, `DEV-M4-T18`, `DEV-M4-T16` |
| Blocks | `DEV-M4-T22`, `DEV-M4-T24` |
| Source docs | [캘린더 상세 리스케줄 적용](../../screens/08-calendar.md#93-리스케줄-적용-방식) |

### 목적

schedule 규칙을 유지하면서 사용자가 즉시 실행을 요청할 수 있게 함. 결과는 ad-hoc occurrence와 run으로 연결됨.

### 구현 범위

- `POST /api/schedules/{scheduleId}/run-now`
- 실행 전 permission/cost/connection 재검증
- approval 필요 시 approval_request 생성
- 생성된 run과 calendar_event/run_occurrence 연결
- UI `지금 실행` 액션

### 제외 범위

- schedule recurrenceRule 변경
- 자동 retry 정책

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T20-S01` | run-now preflight | `BE` | schedule 실행 가능 여부와 승인 필요 여부 반환 |
| `DEV-M4-T20-S02` | run-now API | `BE` | scheduleId를 가진 ad-hoc run 생성 |
| `DEV-M4-T20-S03` | calendar occurrence 연결 | `BE` | run-now 이벤트가 캘린더에 표시 가능 |
| `DEV-M4-T20-S04` | UI 액션 | `FE` | 반복 작업 패널/상세에서 지금 실행 가능 |

### Acceptance Criteria

- [ ] run-now는 schedule의 `nextRunAt` 규칙을 변경하지 않는다.
- [ ] 같은 idempotencyKey로 중복 run이 생성되지 않는다.
- [ ] 승인 필요 시 run 실행 전 approval_request가 표시된다.
- [ ] 생성된 run은 맡긴 일 상세로 이동할 수 있다.

### Test / Verification

- [ ] run-now 성공 테스트
- [ ] approval 필요 run-now 테스트
- [ ] idempotency 테스트
- [ ] 캘린더 표시 테스트

### Edge Cases

- paused schedule에서 run-now 허용 여부
- failed schedule에서 run-now
- 기존 running occurrence가 있음
- 비용 한도 초과

### Open Decisions

- `DEC-M4-21`: paused schedule의 run-now를 허용할지, 먼저 active 전환을 요구할지 결정 필요

## DEV-M4-T21 / calendar range/manual event API

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-08`, `SCR-09`, `SCR-03` |
| Objects | `calendar_event`, `schedule`, `task`, `run` |
| Depends on | `DEV-M4-T18` |
| Blocks | `DEV-M4-T22`, `DEV-M4-T23`, `DEV-M4-T24` |
| Source docs | [캘린더 상세 데이터/API](../../screens/08-calendar.md#12-데이터-필드--api-힌트) |

### 목적

캘린더가 수동 일정, task due/scheduled, run occurrence, schedule occurrence를 같은 기간 조회 API로 표시할 수 있게 함.

### 구현 범위

- `GET /api/calendar/events?from=&to=&view=&timezone=&topicId=`
- `GET /api/calendar/day-summary?date=&timezone=`
- `POST /api/calendar/events`
- `PATCH /api/calendar/events/{eventId}`
- `DELETE /api/calendar/events/{eventId}`
- manual event와 task/run/schedule projection 구분

### 제외 범위

- occurrence override
- 외부 캘린더 sync
- schedule toggle

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T21-S01` | range query | `BE` | from/to/timezone/topicId 기준 이벤트 반환 |
| `DEV-M4-T21-S02` | day summary query | `BE` | 우측 날짜 패널의 일정/제안/반복 작업 요약 반환 |
| `DEV-M4-T21-S03` | manual event CRUD | `BE` | 수동 일정 생성/수정/삭제 가능 |
| `DEV-M4-T21-S04` | sourceType/eventType 분리 | `BE` | manual/task/topic/schedule/run 이벤트가 구분됨 |
| `DEV-M4-T21-S05` | audit/event | `BE` | 수동 일정 변경과 위험 변경 기록 |

### Acceptance Criteria

- [ ] API 요청/응답에 timezone이 포함된다.
- [ ] 수동 일정과 자동 작업은 같은 event 리스트에서 구분 가능하다.
- [ ] task due date와 schedule occurrence는 원본 resource route를 가진다.
- [ ] 삭제/권한 없음 이벤트는 화면 전체 오류가 아니라 해당 이벤트 fallback으로 처리 가능하다.

### Test / Verification

- [ ] range query timezone 테스트
- [ ] manual event CRUD 테스트
- [ ] topicId 필터 테스트
- [ ] sourceType별 route projection 테스트

### Edge Cases

- 기간이 매우 넓음
- 이벤트가 자정 넘김
- task deadlineAt과 scheduledAt 모두 존재
- schedule이 paused라 future occurrence 없음

### Open Decisions

- `DEC-M4-22`: task due date를 calendar_event로 materialize할지 query-time projection으로 둘지 결정 필요

## DEV-M4-T22 / schedule occurrence projection/override

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `BE` |
| Screens | `SCR-08`, `SCR-03` |
| Objects | `schedule`, `calendar_event`, `run`, `approval_request` |
| Depends on | `DEV-M4-T18`, `DEV-M4-T20`, `DEV-M4-T21` |
| Blocks | `DEV-M4-T23`, `DEV-M4-T24` |
| Source docs | [캘린더 상세 리스케줄](../../screens/08-calendar.md#93-리스케줄-적용-방식) |

### 목적

반복 schedule을 캘린더 occurrence로 투영하고, 특정 occurrence 이동/skip/override를 지원함.

### 구현 범위

- occurrence key 모델
- `exceptionDates`, `overrides`
- 단일 occurrence 이동
- 반복 규칙 변경과 단일 override 구분
- 리스케줄 suggestion 적용을 위한 내부 API

### 제외 범위

- 외부 캘린더 recurrence 완전 호환
- 복잡한 natural language rrule parser

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T22-S01` | occurrence key 설계 | `BE` | scheduleId + originalStartAt 기준 안정 식별 |
| `DEV-M4-T22-S02` | occurrence projection | `BE` | 기간 내 occurrence가 calendar range에 표시됨 |
| `DEV-M4-T22-S03` | override 저장 | `BE` | 단일 occurrence 이동/skip이 schedule 규칙을 깨지 않음 |
| `DEV-M4-T22-S04` | approval/permission 검증 | `BE` | 자동 작업 시간 변경은 승인 정책을 따른다 |
| `DEV-M4-T22-S05` | run occurrence 연결 | `BE` | 실행된 occurrence와 run이 연결됨 |

### Acceptance Criteria

- [ ] 반복 작업의 특정 occurrence를 옮기면 `overrides`가 남는다.
- [ ] schedule rule 수정과 occurrence override가 API에서 구분된다.
- [ ] 이미 queued/running run이 있는 occurrence는 바로 이동하지 않고 영향 분기를 반환한다.
- [ ] occurrence override 후 캘린더와 맡긴 일 예약됨 탭이 동기화된다.

### Test / Verification

- [ ] daily/weekly occurrence projection 테스트
- [ ] exceptionDates/overrides 테스트
- [ ] queued/running occurrence 이동 차단 테스트
- [ ] timezone/DST 테스트

### Edge Cases

- DST로 존재하지 않는 시각
- 같은 occurrence에 override 여러 번 적용
- schedule paused 후 occurrence deep link 접근
- occurrence 실행 중 rule 변경

### Open Decisions

- `DEC-M4-23`: M4에서 occurrence override UI를 노출할지, API만 준비할지 결정 필요

## DEV-M4-T23 / Calendar 화면 UI

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-08` |
| Objects | `calendar_event`, `schedule`, `calendar_suggestion`, `task`, `run` |
| Depends on | `DEV-M4-T19`, `DEV-M4-T21`, `DEV-M4-T22` |
| Blocks | `DEV-M4-T24` |
| Source docs | [캘린더 상세](../../screens/08-calendar.md) |

### 목적

캘린더 화면에서 수동 일정과 AI 자동 작업을 같은 시간축으로 표시하고, 우측 패널에서 날짜 상세/제안/반복 작업 토글을 처리함.

### 구현 범위

- `/calendar` route surface
- 월/주/일/목록 view shell
- week grid 우선 구현
- 우측 날짜 패널
- 반복 자동 작업 목록과 toggle UI
- schedule/event deep link
- 일정 채팅 입력 시작점

### 제외 범위

- 외부 캘린더 동기화
- 완전한 drag/drop 편집
- 모든 suggestion 생성 알고리즘

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T23-S01` | route/date/view 상태 | `FE` | from/view/timezone/topicId가 URL로 복원됨 |
| `DEV-M4-T23-S02` | calendar grid | `FE` | 주간 grid와 event 카드가 표시됨 |
| `DEV-M4-T23-S03` | event card action | `FE` | sourceType별 상세/연결 route CTA 제공 |
| `DEV-M4-T23-S04` | 우측 날짜 패널 | `FE` | 선택 날짜 일정, 제안, 반복 자동 작업 표시 |
| `DEV-M4-T23-S05` | 반복 작업 토글 UI | `FE` | active/paused toggle과 영향 분기/rollback 처리 |
| `DEV-M4-T23-S06` | empty/loading/error | `FE` | range/day-summary/schedule 부분 실패 분리 |

### Acceptance Criteria

- [ ] 수동 일정과 AI 자동 작업이 색상/배지/텍스트로 구분된다.
- [ ] timezone이 화면에 표시된다.
- [ ] 반복 자동 작업 toggle 결과가 캘린더와 우측 패널에 즉시 반영된다.
- [ ] 이벤트 클릭 시 task/run/schedule/topic 원본으로 이동 가능하다.

### Test / Verification

- [ ] calendar route 렌더링 테스트
- [ ] view/date URL 복원 테스트
- [ ] toggle optimistic rollback 테스트
- [ ] event 카드 overflow/접근성 테스트

### Edge Cases

- 한 시간대에 이벤트가 너무 많음
- range API 성공, day-summary 실패
- event permission blocked
- 긴 schedule 제목과 작은 카드

### Open Decisions

- `DEC-M4-24`: 캘린더 UI 라이브러리를 쓸지 직접 grid를 만들지 결정 필요

## DEV-M4-T24 / task-run-schedule 동기화 E2E

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-03`, `SCR-08`, `SCR-09`, `SCR-01`, `SCR-02` |
| Objects | `task`, `run`, `schedule`, `calendar_event`, `approval_request`, `audit_log` |
| Depends on | `DEV-M4-T05`, `DEV-M4-T06`, `DEV-M4-T08`, `DEV-M4-T11`, `DEV-M4-T17`, `DEV-M4-T19`, `DEV-M4-T23` |
| Blocks | `M5 Knowledge Core`, `M6 Agent + Connection Core` |
| Source docs | [공통 동선 Task -> Run/Schedule](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule), [구현 순서 M4](../../common/implementation-plan.md#7-m4--execution-core) |

### 목적

M4의 마지막 통합 검증 태스크임. 사용자가 할 일을 만들고 AI에게 맡기고, run 상태가 변하고, 승인/예약/캘린더 표시가 이어지는 흐름이 한 데이터 모델로 닫히는지 확인함.

### 구현 범위

- `task.created -> task.delegated -> run.status_changed -> task progress/status update`
- `schedule.status_changed -> calendar range/upcoming/runs 예약됨 갱신`
- `approval.requested/resolved -> run/task/schedule 상태 갱신`
- Today/Topics에 필요한 event projection smoke
- E2E 시나리오와 regression checklist 작성

### 제외 범위

- 모든 M5/M6 화면 상세 구현
- 실제 provider 비용 정산
- production scheduler 운영 자동화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M4-T24-S01` | 동기화 이벤트 매핑 | `Fullstack` | task/run/schedule/approval/calendar 이벤트별 구독/갱신 대상 정의 |
| `DEV-M4-T24-S02` | task delegate E2E | `Fullstack` | task 생성 -> delegate -> run 생성 -> task progress 반영 |
| `DEV-M4-T24-S03` | approval E2E | `Fullstack` | approval 생성 -> 승인/거절 -> run/task/schedule 상태 반영 |
| `DEV-M4-T24-S04` | schedule/calendar E2E | `Fullstack` | schedule 생성/toggle/run-now -> calendar/runs 갱신 |
| `DEV-M4-T24-S05` | cross-screen fallback 검증 | `Fullstack` | 삭제/권한/보관/deep link fallback이 화면별로 일관 |
| `DEV-M4-T24-S06` | 회귀 체크리스트 문서화 | `Docs` | M4 완료 전 실행할 수동/자동 검증 목록 정리 |

### Acceptance Criteria

- [ ] task에서 `AI에게 맡기기` 실행 시 run 또는 approval_request가 생성된다.
- [ ] run 상태 변화가 task, 맡긴 일, 캘린더에 반영된다.
- [ ] schedule toggle/수정은 calendar와 runs 예약됨 탭에 동기화된다.
- [ ] approval 처리 결과가 승인 카드, run 상태, task 상태, schedule occurrence에 반영된다.
- [ ] 위험 작업은 audit log에 남는다.

### Test / Verification

- [ ] task -> run 생성 E2E
- [ ] run pause/resume/stop/retry E2E
- [ ] approval approve/reject E2E
- [ ] schedule create/toggle/run-now/calendar range E2E
- [ ] deep link/fallback regression

### Edge Cases

- approval 만료와 run stop 동시 발생
- schedule toggle 중 queued run 존재
- task 완료와 run running 상태 충돌
- run event가 역순으로 도착
- 캘린더 timezone 변경 후 nextRunAt 재계산

### Open Decisions

- `DEC-M4-25`: M4 완료 기준에서 Today 화면의 active run/upcoming schedule 요약을 smoke 수준으로 포함할지 결정 필요

## 5. M4 완료 기준

- [ ] task CRUD, board/detail, checklist, link가 동작한다.
- [ ] task에서 run 또는 approval_request를 생성할 수 있다.
- [ ] run 목록/상세/log/artifact/status transition이 동작한다.
- [ ] pause/resume/stop/retry가 상태 모델과 audit 정책을 따른다.
- [ ] approval request 생성/조회/승인/거절이 task/run/schedule에 반영된다.
- [ ] schedule CRUD, active/paused toggle, run-now가 동작한다.
- [ ] calendar range와 occurrence projection이 task/run/schedule을 함께 표시한다.
- [ ] task-run-schedule-calendar 상태 동기화가 E2E로 검증된다.
- [ ] 위험 작업은 impact/preflight, idempotency, audit log 중 필요한 안전장치를 가진다.
- [ ] 신규 프로젝트 전제와 reference-only 원칙을 위반하는 복사/마이그레이션 작업이 없다.
