# M7 / Visual Planning + Help 개발 태스크

이 문서는 신규 개인형 Agent 플랫폼을 처음부터 구축한다는 전제로 `할 일 맵(Todo Map)`과 `도움말(Help)`을 실제 구현 가능한 작은 태스크로 분해한다. 기존 앱은 reference-only이며, 기존 화면/컴포넌트/API를 복사하거나 마이그레이션하는 작업은 M7 범위가 아니다.

M7의 목적은 두 가지다. 첫째, 사용자가 복잡한 작업을 markmap 형태로 시각화하고 의존성을 편집하며 AI에게 쪼개기/위임을 요청할 수 있게 한다. 둘째, 사용자가 Dev Mode, TUI, MCP, API token, 시스템 상태, 명령어 복사, 피드백을 도움말 안에서 안전하게 확인하게 한다.

## 1. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [../00-task-format.md](../00-task-format.md) |
| 제품 문서 진입점 | [../../README.md](../../README.md) |
| 화면 계약 | [../../screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [../../common/implementation-plan.md](../../common/implementation-plan.md#10-m7--visual-planning--help) |
| 공통 동선 | [../../common/navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md) |
| 공통 객체/상태/API | [../../common/domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 할 일 맵 상세 | [../../screens/14-todo-map.md](../../screens/14-todo-map.md) |
| 도움말 상세 | [../../screens/12-help.md](../../screens/12-help.md) |
| 설정 / Dev Mode 상세 | [../../screens/11-settings.md](../../screens/11-settings.md) |

## 2. Milestone Scope

| 포함 | 제외 |
| --- | --- |
| Todo Map route, view switch, graph bootstrap | 할 일 목록/보드 core CRUD 전체 재구현 |
| task graph node/edge 렌더링, 필터, saved view, layout | 범용 그래프 편집기 제품화 |
| dependency create/delete와 순환 dependency 검증 | 프로젝트 관리 도구 수준의 resource leveling |
| node drag, 좌표 저장, 충돌 처리, 대량 node 성능 최적화 | 실시간 다중 사용자 공동 편집 |
| AI task decomposition preview/apply | 범용 autonomous planner engine |
| task에서 run/schedule로 넘어가는 최소 연동 | agent 실행 엔진/스케줄러 core 구현 |
| Help IA, search, article list/detail | 외부 CMS 전체 구축 |
| Dev Mode tutorial, command copy, stale command 표시 | 실제 TUI/MCP client 구현 |
| system status panel/detail, stale 상태 처리 | 운영 모니터링 backend 전체 구축 |
| feedback 제출과 help scope context | 고객지원 티켓 시스템 전체 구축 |

## 3. 선행 조건

| Dependency | M7에서 필요한 내용 |
| --- | --- |
| `M1-SHELL` | `/tasks/map`, `/help`, `/help/:articleId` route, sidebar, empty/loading/error, permission state |
| `M1-DOMAIN` | `task`, `task_dependency`, `conversation`, `help_article`, `system_status`, `feedback`, `audit_log` canonical 계약 |
| `M1-API` | API client, error envelope, optimistic locking, idempotency key, request id |
| `M1-EVENT` | 상태 갱신 polling/SSE skeleton |
| `M4-TASK` | task list/detail/status/checklist 기본 CRUD |
| `M4-RUN-SCHEDULE` | task에서 run/schedule을 만들거나 상태를 조회하는 최소 계약 |
| `M6-SETTINGS-DEV` | Dev Mode token, access method, local endpoint, scope, audit log 계약 |
| `M6-CONNECTION-POLICY` | 권한/비용/연결 미비 CTA와 approval policy |

## 4. M7 완료 기준

- [ ] `/tasks/map`에서 task graph를 조회하고 node/edge를 시각화한다.
- [ ] dependency 생성/삭제 전 순환 dependency와 권한을 검증한다.
- [ ] 대량 node에서도 초기 렌더링, pan/zoom, 필터 변경이 사용 가능한 성능을 유지한다.
- [ ] node drag와 saved view 저장은 version 충돌을 감지하고 안전하게 재시도/병합/폐기할 수 있다.
- [ ] AI task decomposition은 preview를 먼저 보여주고 사용자가 선택 적용한다.
- [ ] dependency가 막힌 task는 run/schedule 생성 전 경고 또는 제한된다.
- [ ] `/help`에서 문서 IA, 검색, 카드 목록, article detail이 동작한다.
- [ ] Dev Mode tutorial은 권한 있는 사용자에게만 민감 문서와 설정 CTA를 노출한다.
- [ ] 명령어 복사는 최신 article version과 command checksum 기준으로 stale 상태를 표시한다.
- [ ] system status는 stale 여부와 마지막 점검 시간을 표시하고 장애/권한/설정 문제를 구분한다.
- [ ] feedback은 현재 article, section, search query, system status context를 포함해 제출된다.

## 5. Task Index

| Task | 제목 | Size | Area | Depends on | Blocks |
| --- | --- | --- | --- | --- | --- |
| `DEV-M7-T01` | M7 fixture와 cross-feature 계약 정리 | `XS` | `Docs` | `M1-DOMAIN`, `M4-TASK`, `M6-SETTINGS-DEV` | `DEV-M7-T02`, `DEV-M7-T10`, `DEV-M7-T11` |
| `DEV-M7-T02` | Task graph 조회 API와 graph model 계약 | `M` | `Fullstack` | `DEV-M7-T01`, `M4-TASK` | `DEV-M7-T03`, `DEV-M7-T04`, `DEV-M7-T06` |
| `DEV-M7-T03` | Todo Map route와 view switch shell | `S` | `FE` | `DEV-M7-T02`, `M1-SHELL` | `DEV-M7-T04`, `DEV-M7-T05` |
| `DEV-M7-T04` | Graph canvas node/edge 렌더링 | `M` | `FE` | `DEV-M7-T02`, `DEV-M7-T03` | `DEV-M7-T05`, `DEV-M7-T07`, `DEV-M7-T09` |
| `DEV-M7-T05` | 선택 node 상세 패널과 task edit sync | `M` | `Fullstack` | `DEV-M7-T03`, `DEV-M7-T04`, `M4-TASK` | `DEV-M7-T08`, `DEV-M7-T10` |
| `DEV-M7-T06` | Dependency 생성/삭제와 순환 검증 | `M` | `Fullstack` | `DEV-M7-T02`, `M4-TASK` | `DEV-M7-T08`, `DEV-M7-T10` |
| `DEV-M7-T07` | Layout, saved view, drag 저장 충돌 처리 | `M` | `Fullstack` | `DEV-M7-T04`, `M1-API` | `DEV-M7-T09` |
| `DEV-M7-T08` | AI task decomposition preview/apply | `M` | `Fullstack`, `AI` | `DEV-M7-T05`, `DEV-M7-T06`, `M6-CONNECTION-POLICY` | `DEV-M7-T10` |
| `DEV-M7-T09` | 대량 node 성능과 progressive rendering | `M` | `FE` | `DEV-M7-T04`, `DEV-M7-T07` | `DEV-M7-T16` |
| `DEV-M7-T10` | Todo Map에서 run/schedule 전환 guard | `S` | `Fullstack` | `DEV-M7-T05`, `DEV-M7-T06`, `DEV-M7-T08`, `M4-RUN-SCHEDULE` | `DEV-M7-T16` |
| `DEV-M7-T11` | Help IA, 검색, article card 목록 | `M` | `Fullstack` | `DEV-M7-T01`, `M1-SHELL` | `DEV-M7-T12`, `DEV-M7-T13` |
| `DEV-M7-T12` | Help article detail renderer와 version 표시 | `M` | `Fullstack` | `DEV-M7-T11` | `DEV-M7-T13`, `DEV-M7-T14`, `DEV-M7-T15` |
| `DEV-M7-T13` | Dev Mode tutorial과 권한별 문서 노출 | `S` | `Fullstack`, `Security` | `DEV-M7-T11`, `DEV-M7-T12`, `M6-SETTINGS-DEV` | `DEV-M7-T14` |
| `DEV-M7-T14` | Command copy와 stale command guard | `S` | `FE`, `Security` | `DEV-M7-T12`, `DEV-M7-T13` | `DEV-M7-T16` |
| `DEV-M7-T15` | System status panel/detail과 stale 처리 | `S` | `Fullstack` | `DEV-M7-T11`, `M1-EVENT` | `DEV-M7-T16` |
| `DEV-M7-T16` | Feedback, help bot context, M7 통합 검수 | `M` | `Fullstack`, `QA` | `DEV-M7-T09`, `DEV-M7-T10`, `DEV-M7-T14`, `DEV-M7-T15` | `M7 release` |

## 6. 개발 태스크

## DEV-M7-T01 / M7 fixture와 cross-feature 계약 정리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `XS` |
| Area | `Docs` |
| Screens | `SCR-14`, `SCR-12`, `SCR-11` |
| Objects | `task`, `task_dependency`, `help_article`, `system_status`, `dev_token` |
| Depends on | `M1-DOMAIN`, `M4-TASK`, `M6-SETTINGS-DEV` |
| Blocks | `DEV-M7-T02`, `DEV-M7-T10`, `DEV-M7-T11` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [도움말](../../screens/12-help.md), [설정](../../screens/11-settings.md) |

### 목적

M7 구현자가 Todo Map과 Help를 각각 독립 기능으로 만들면서도 `task`, `Dev Mode`, `system status`, `permission` 계약을 다르게 해석하지 않게 한다.

### 구현 범위

- Todo Map fixture: root task, child task, dependency, blocked task, completed task, 대량 node dataset 후보 정의.
- Help fixture: category, article, command block, Dev Mode article, 권한 제한 article, system status, feedback seed 정의.
- M7에서 쓰는 `task_dependency`, `task_map_view`, `task_map_node_position`, `help_article`, `help_command`, `system_status` 필드 후보 정리.
- 신규 프로젝트 기준임을 명시하고 reference-only 범위를 문서에 남긴다.

### 제외 범위

- 실제 task CRUD 구현.
- 실제 help CMS 구현.
- 실제 Dev Mode token 발급/폐기 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T01-S01` | Todo Map fixture 작성 | `Docs` | root/child/dependency/blocked/completed/large graph 케이스가 정의됨 |
| `DEV-M7-T01-S02` | Help fixture 작성 | `Docs` | category/article/command/status/feedback 케이스가 정의됨 |
| `DEV-M7-T01-S03` | M7 추가 객체 후보 정리 | `Docs` | `task_map_view`, `help_command`, `feedback` 같은 확장 객체가 canonical 객체와 충돌하지 않음 |
| `DEV-M7-T01-S04` | reference-only 경계 확인 | `Docs` | 기존 앱 복사/이관 없이 신규 구현한다는 문구가 유지됨 |

### Acceptance Criteria

- [ ] M7 fixture가 `task`, `credential`, `conversation`, `audit_log` canonical 정책과 충돌하지 않는다.
- [ ] 대량 node, 순환 dependency, stale command, 권한 제한 문서, stale status 케이스가 seed 후보에 포함된다.
- [ ] 후속 task가 기존 앱 경로나 컴포넌트를 구현 의존성으로 삼지 않는다.

### Test / Verification

- [ ] fixture 필드와 [화면 계약](../../screen-contracts.md)의 `SCR-14`, `SCR-12`, `SCR-11` reads/writes를 대조한다.
- [ ] 문서 내 기존 앱 복사/마이그레이션 전제가 없는지 검색한다.

### Edge Cases

- help article이 `document` 객체와 비슷해도 제품 산출물 `document`와 저장소/권한을 혼동하지 않는다.
- task graph fixture가 실제 task 상태 enum과 다른 임의 상태를 만들 수 있다.
- Dev Mode article fixture가 실제 token 원문을 담으면 안 된다.

### Open Decisions

- `DEC-M7-01`: `task_map_view`와 `task_map_node_position`을 별도 리소스로 둘지 `task.metadata`에 둘지 결정 필요.
- `DEC-M7-02`: help article을 정적 markdown으로 시작할지 DB/CMS 리소스로 시작할지 결정 필요.

## DEV-M7-T02 / Task graph 조회 API와 graph model 계약

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-14`, `SCR-09` |
| Objects | `task`, `task_dependency`, `topic` |
| Depends on | `DEV-M7-T01`, `M4-TASK`, `M1-API` |
| Blocks | `DEV-M7-T03`, `DEV-M7-T04`, `DEV-M7-T06` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [공통 객체/상태](../../common/domain-model-and-state-policy.md) |

### 목적

Todo Map이 목록/보드와 같은 task 데이터를 graph 형태로 읽을 수 있게 조회 계약을 만든다.

### 구현 범위

- `GET /api/tasks/graph` 또는 `/api/task-graphs` 후보 계약 정의/구현.
- topic, status, priority, rootTaskId, savedViewId 필터 지원.
- node는 task 요약, position, collapsed, metrics를 포함한다.
- edge는 parent-child와 dependency를 분리해 반환한다.
- graph response에 `version`, `generatedAt`, `hasMore`, `truncatedReason`, `permissionSummary`를 포함한다.

### 제외 범위

- 캔버스 렌더링.
- dependency 쓰기.
- AI task decomposition.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T02-S01` | graph response model 정의 | `BE` | node/edge/filter/version/permission 필드가 명시됨 |
| `DEV-M7-T02-S02` | graph 조회 endpoint 구현 | `BE` | hub/topic/root 기준 task graph를 반환함 |
| `DEV-M7-T02-S03` | FE graph query hook 작성 | `FE` | `/tasks/map`에서 필터 기준으로 graph를 조회할 수 있음 |
| `DEV-M7-T02-S04` | 부분 graph와 truncation 처리 | `Fullstack` | 대량 graph에서 `hasMore`와 축약 사유가 표시 가능함 |

### Acceptance Criteria

- [ ] parent-child edge와 dependency edge가 다른 타입으로 반환된다.
- [ ] 필터 적용 후 node count, edge count, hidden count가 계산된다.
- [ ] 권한 없는 task는 node를 숨기거나 redacted summary로 표시하는 정책이 응답에 포함된다.
- [ ] graph version이 포함되어 후속 저장 충돌 검증에 사용할 수 있다.

### Test / Verification

- [ ] root task 1개와 child 10개 fixture 조회 테스트.
- [ ] dependency edge가 있는 fixture 조회 테스트.
- [ ] 권한 제한 task fixture에서 redaction 또는 숨김 처리 테스트.
- [ ] 1,000개 이상 node fixture에서 truncation 응답 테스트.

### Edge Cases

- dependency edge의 한쪽 node가 필터로 숨겨진 상태.
- task는 존재하지만 topic 권한이 없어 title을 보여줄 수 없는 상태.
- deleted/archived task가 dependency edge의 endpoint로 남아 있는 상태.
- graph 생성 중 task가 변경되어 version이 stale한 상태.

### Open Decisions

- `DEC-M7-03`: graph 조회를 task API 하위에 둘지 독립 graph API로 둘지 결정 필요.
- `DEC-M7-04`: 권한 없는 node를 완전히 숨길지 redacted placeholder로 보여줄지 결정 필요.

## DEV-M7-T03 / Todo Map route와 view switch shell

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `FE` |
| Screens | `SCR-14`, `SCR-09` |
| Objects | `task`, `topic` |
| Depends on | `DEV-M7-T02`, `M1-SHELL` |
| Blocks | `DEV-M7-T04`, `DEV-M7-T05` |
| Source docs | [화면 계약 SCR-14](../../screen-contracts.md#scr-14--할-일-맵--todo-map), [할 일 맵](../../screens/14-todo-map.md) |

### 목적

사용자가 할 일 목록/보드/맵을 같은 task 데이터 위에서 전환할 수 있는 route와 shell을 만든다.

### 구현 범위

- route 후보 `/tasks/map`, `/topics/:topicId/tasks/map` 등록.
- sidebar `할 일` active state 유지.
- 상단 segmented control `목록`, `보드`, `맵` 구성.
- 필터 패널, 캔버스 outlet, 상세 패널, 하단 toolbar slot 배치.
- route query로 topic, savedView, selectedTaskId, layoutMode 복원.

### 제외 범위

- 실제 node/edge 렌더링.
- 목록/보드 화면 구현.
- 모바일 최적화 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T03-S01` | Todo Map route 등록 | `FE` | `/tasks/map` 직접 접근 시 shell이 표시됨 |
| `DEV-M7-T03-S02` | view switch 구현 | `FE` | `목록/보드/맵` 전환 UI가 있고 현재 `맵`이 활성 표시됨 |
| `DEV-M7-T03-S03` | layout skeleton 구성 | `FE` | 필터/캔버스/상세/toolbar slot이 stable size로 배치됨 |
| `DEV-M7-T03-S04` | query restore 처리 | `FE` | `topicId`, `savedViewId`, `selectedTaskId`를 읽고 잘못된 값은 fallback됨 |

### Acceptance Criteria

- [ ] `/tasks/map`에서 공통 shell과 `할 일` active menu가 표시된다.
- [ ] `/topics/:topicId/tasks/map`으로 들어오면 topic 필터가 적용된다.
- [ ] 잘못된 saved view나 task id query는 안전하게 무시된다.
- [ ] view switch는 현재 필터와 선택 task를 가능한 한 유지한다.

### Test / Verification

- [ ] `/tasks/map` 직접 접근 수동 검증.
- [ ] `/tasks/map?savedViewId=unknown` fallback 검증.
- [ ] view switch 클릭 시 route/query가 의도대로 바뀌는지 검증.
- [ ] 좁은 viewport에서 상세 패널이 캔버스를 완전히 가리지 않는지 검증.

### Edge Cases

- 선택 task가 필터 결과에서 사라진 상태.
- topic route로 들어왔지만 topic 권한이 없는 상태.
- 목록/보드가 아직 미구현인 MVP에서 view switch를 눌렀을 때 disabled reason이 필요한 상태.

### Open Decisions

- `DEC-M7-05`: `/tasks/map` route를 기본으로 둘지 `/tasks?view=map` query 기반으로 둘지 결정 필요.
- `DEC-M7-06`: 상세 패널을 우측 고정으로 둘지 drawer로 둘지 결정 필요.

## DEV-M7-T04 / Graph canvas node/edge 렌더링

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-14` |
| Objects | `task`, `task_dependency` |
| Depends on | `DEV-M7-T02`, `DEV-M7-T03` |
| Blocks | `DEV-M7-T05`, `DEV-M7-T07`, `DEV-M7-T09` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md) |

### 목적

Task graph를 사용자가 이해할 수 있는 markmap 스타일 캔버스로 렌더링한다.

### 구현 범위

- root node, task node, subtask node 컴포넌트.
- parent-child edge와 dependency edge 시각 구분.
- selected, hover, focused, disabled, blocked 상태.
- zoom, pan, fit, lock, minimap slot.
- priority/status/topic color legend 표시.

### 제외 범위

- drag 저장.
- dependency 편집.
- AI decomposition.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T04-S01` | node 컴포넌트 구현 | `FE` | title/status/progress/due/priority/count가 고정 폭 카드로 표시됨 |
| `DEV-M7-T04-S02` | edge 렌더링 구현 | `FE` | parent-child와 dependency가 다른 선 스타일과 방향으로 표시됨 |
| `DEV-M7-T04-S03` | 선택/hover 상태 연결 | `FE` | node 선택 시 edge와 인접 node가 강조됨 |
| `DEV-M7-T04-S04` | viewport control skeleton | `FE` | zoom/pan/fit/lock/minimap 영역이 동작 또는 placeholder로 제공됨 |

### Acceptance Criteria

- [ ] graph response가 없으면 empty state와 재시도 CTA를 보여준다.
- [ ] dependency edge는 dashed arrow와 `의존` 의미를 시각적으로 구분한다.
- [ ] 긴 task title은 캔버스 layout을 깨지 않고 상세 패널에서 전체를 볼 수 있다.
- [ ] 선택 node는 키보드 focus와 시각 선택 상태를 모두 가진다.
- [ ] lock 상태에서는 편집용 interaction이 비활성화된다.

### Test / Verification

- [ ] node/edge fixture 렌더링 component test.
- [ ] selectedTaskId 변경 시 선택 node와 상세 패널 연동 테스트.
- [ ] keyboard focus 이동과 aria label 수동 검증.
- [ ] 긴 제목/긴 날짜/카운트 많은 node visual regression 확인.

### Edge Cases

- edge endpoint node가 hidden 또는 permission redacted인 상태.
- root node가 여러 개라 forest 형태로 표시해야 하는 상태.
- 완료 task가 blocker로 남아 edge 색상이 혼란스러운 상태.
- 노드 크기가 동적으로 커져 layout이 흔들리는 상태.

### Open Decisions

- `DEC-M7-07`: canvas 구현 라이브러리를 사용할지, 직접 DOM/canvas 계층을 만들지 결정 필요.
- `DEC-M7-08`: minimap을 MVP에 포함할지 후속 개선으로 뺄지 결정 필요.

## DEV-M7-T05 / 선택 node 상세 패널과 task edit sync

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-14`, `SCR-09` |
| Objects | `task`, `checklist_item`, `conversation`, `file_asset`, `source`, `run`, `schedule` |
| Depends on | `DEV-M7-T03`, `DEV-M7-T04`, `M4-TASK` |
| Blocks | `DEV-M7-T08`, `DEV-M7-T10` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [공통 동선](../../common/navigation-and-cross-screen-flows.md) |

### 목적

캔버스에서 선택한 task를 우측 패널에서 읽고 수정하며, 목록/보드/맵의 상태가 같은 source of truth로 동기화되게 한다.

### 구현 범위

- selected task detail query 연결.
- 개요, 작업, 의존성, 활동 기록 탭 skeleton.
- status, priority, deadline, checklist 완료 수정.
- 연결 대화, 자료, 일정, run 요약 표시.
- optimistic update와 실패 rollback.

### 제외 범위

- task 전체 CRUD 재구현.
- 파일/스크랩/대화 상세 화면 구현.
- 활동 기록 전체 timeline.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T05-S01` | selected task detail 조회 | `Fullstack` | node 선택 시 상세 패널이 task detail을 표시함 |
| `DEV-M7-T05-S02` | task field edit 연결 | `Fullstack` | status/priority/deadline/checklist 변경이 저장됨 |
| `DEV-M7-T05-S03` | linked resource summary 표시 | `FE` | 대화/자료/일정/run 연결 요약과 이동 CTA가 표시됨 |
| `DEV-M7-T05-S04` | optimistic update rollback | `FE` | 저장 실패 시 이전 값으로 복구하고 오류를 표시함 |

### Acceptance Criteria

- [ ] node 선택 없이 진입하면 안내 empty state가 표시된다.
- [ ] task 수정 후 캔버스 node와 상세 패널 값이 일치한다.
- [ ] checklist 완료율 변경이 progress 표시와 동기화된다.
- [ ] 권한 없는 task는 읽기 전용으로 표시되고 write action이 비활성화된다.
- [ ] 삭제/보관된 연결 자료는 깨진 링크 상태로 표시된다.

### Test / Verification

- [ ] selected task query success/loading/error 테스트.
- [ ] status 변경 후 graph cache 갱신 테스트.
- [ ] optimistic update 실패 fixture에서 rollback 검증.
- [ ] 권한 없는 task detail fixture 수동 검증.

### Edge Cases

- 사용자가 node 선택 직후 필터를 바꿔 선택 node가 숨겨진 상태.
- task 수정 중 다른 화면에서 같은 task가 변경된 상태.
- 완료된 task의 하위 checklist가 다시 열리는 상태.
- 연결된 run이 삭제되거나 권한이 없어진 상태.

### Open Decisions

- `DEC-M7-09`: 상세 패널에서 inline edit을 기본으로 할지 edit mode를 따로 둘지 결정 필요.
- `DEC-M7-10`: task detail을 graph 응답에 포함할지 별도 detail API로 조회할지 결정 필요.

## DEV-M7-T06 / Dependency 생성/삭제와 순환 검증

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-14`, `SCR-09` |
| Objects | `task`, `task_dependency`, `audit_log` |
| Depends on | `DEV-M7-T02`, `M4-TASK` |
| Blocks | `DEV-M7-T08`, `DEV-M7-T10` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [공통 객체/상태](../../common/domain-model-and-state-policy.md) |

### 목적

사용자가 task 간 선후행 관계를 만들거나 삭제할 때 순환 dependency, 권한, 완료/삭제 상태를 검증해 graph 무결성을 유지한다.

### 구현 범위

- dependency create/delete endpoint.
- create 전 cycle validation API 또는 server-side validation.
- cycle 발생 시 순환 경로를 응답에 포함.
- dependency 삭제/변경 audit log.
- blocked status 계산 또는 해제 제안.

### 제외 범위

- 자동 일정 재계산.
- critical path 분석.
- 다중 사용자 실시간 충돌 해결.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T06-S01` | dependency mutation API 정의 | `BE` | create/delete 요청과 응답, idempotency key가 정의됨 |
| `DEV-M7-T06-S02` | cycle validation 구현 | `BE` | 순환 dependency가 저장 전에 차단되고 경로가 반환됨 |
| `DEV-M7-T06-S03` | edge edit UI 연결 | `FE` | edge 추가/삭제 시 검증 결과를 캔버스에 표시함 |
| `DEV-M7-T06-S04` | blocked status 영향 처리 | `Fullstack` | 선행 task 미완료 시 후행 task guard 또는 warning이 표시됨 |

### Acceptance Criteria

- [ ] A -> B, B -> C 상태에서 C -> A dependency 생성이 차단된다.
- [ ] cycle error는 관련 node/edge를 강조할 수 있는 path 정보를 포함한다.
- [ ] 권한 없는 task에 dependency를 만들 수 없다.
- [ ] deleted/archived task를 endpoint로 하는 신규 dependency는 저장되지 않는다.
- [ ] dependency 변경은 audit log에 actor, before/after summary를 남긴다.

### Test / Verification

- [ ] acyclic dependency 생성 테스트.
- [ ] cycle dependency 생성 차단 테스트.
- [ ] 중복 dependency idempotency 테스트.
- [ ] dependency 삭제 후 graph 조회에서 edge 제거 확인.

### Edge Cases

- 양방향 dependency를 거의 동시에 만드는 race condition.
- 필터로 숨겨진 node 때문에 사용자가 순환 경로 일부만 보는 상태.
- 완료 task를 선행 task로 두는 것을 허용할지 애매한 상태.
- parent-child 관계와 dependency 관계를 같은 두 node 사이에 동시에 만드는 상태.

### Open Decisions

- `DEC-M7-11`: 완료 task가 후행 task를 계속 block할 수 있는지, 완료 즉시 blocker에서 제외할지 결정 필요.
- `DEC-M7-12`: dependency validation을 mutation 내부에서만 할지 preview API로도 제공할지 결정 필요.

## DEV-M7-T07 / Layout, saved view, drag 저장 충돌 처리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-14` |
| Objects | `task_map_view`, `task_map_node_position`, `task` |
| Depends on | `DEV-M7-T04`, `M1-API` |
| Blocks | `DEV-M7-T09` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md) |

### 목적

사용자가 필터, layout mode, zoom, 중심 node, 수동 drag 좌표를 저장하고, 저장 중 충돌이 생겨도 데이터 손실 없이 복구하게 한다.

### 구현 범위

- saved view list/create/update/delete 최소 계약.
- layout mode: tree, radial, mindmap, auto layout metadata.
- node drag position 저장.
- graph/view version 기반 충돌 감지.
- 충돌 시 reload, overwrite, discard 선택 UX.

### 제외 범위

- 실시간 공동 편집.
- 사용자 간 shared view 권한 모델 전체.
- 이미지/PDF export.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T07-S01` | saved view API 정의 | `BE` | 필터/layout/viewport/selectedTask 저장 계약이 정의됨 |
| `DEV-M7-T07-S02` | layout mode 적용 | `FE` | tree/radial/mindmap/auto 선택 시 좌표가 재계산됨 |
| `DEV-M7-T07-S03` | node drag 저장 | `Fullstack` | drag 종료 후 position이 저장되고 reload 후 복원됨 |
| `DEV-M7-T07-S04` | version conflict UX 구현 | `Fullstack` | stale version 저장 시 reload/overwrite/discard 선택지가 표시됨 |

### Acceptance Criteria

- [ ] `+ 뷰 저장`으로 현재 필터/layout/viewport가 저장된다.
- [ ] saved view 선택 시 filter, layout, center node, zoom이 복원된다.
- [ ] node drag 저장 중 graph version이 바뀌면 silent overwrite하지 않는다.
- [ ] 자동 정렬은 dependency 관계를 변경하지 않고 좌표만 변경한다.
- [ ] lock 상태에서는 drag와 layout 저장이 비활성화된다.

### Test / Verification

- [ ] saved view 생성/선택/삭제 API 테스트.
- [ ] drag 후 reload로 position 복원 수동 검증.
- [ ] stale version fixture에서 conflict modal 표시 검증.
- [ ] 자동 정렬 후 dependency edge 수가 변하지 않는지 확인.

### Edge Cases

- drag 저장 중 사용자가 다른 saved view를 선택한 상태.
- 자동 정렬과 수동 drag 저장 요청이 동시에 발생한 상태.
- graph가 truncation된 상태에서 좌표를 저장하려는 상태.
- hidden node position이 stale해 다음 복원에서 edge가 이상하게 보이는 상태.

### Open Decisions

- `DEC-M7-13`: node position을 사용자별로 저장할지 hub 공통으로 저장할지 결정 필요.
- `DEC-M7-14`: conflict 발생 시 overwrite를 허용할지 reload-only로 제한할지 결정 필요.

## DEV-M7-T08 / AI task decomposition preview/apply

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-14`, `SCR-09`, `SCR-03` |
| Objects | `task`, `task_dependency`, `run`, `approval_request` |
| Depends on | `DEV-M7-T05`, `DEV-M7-T06`, `M6-CONNECTION-POLICY` |
| Blocks | `DEV-M7-T10` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [공통 동선](../../common/navigation-and-cross-screen-flows.md) |

### 목적

사용자가 큰 task를 선택하면 AI가 하위 task와 dependency 후보를 제안하고, 사용자가 선택한 항목만 적용하게 한다.

### 구현 범위

- selected task context 구성: 제목, 설명, checklist, 연결 자료, 기존 dependency, 마감일.
- `POST /api/tasks/{taskId}/decomposition/preview` 후보 계약.
- preview UI: 생성될 task, dependency, 우선순위, 근거, 비용 표시.
- 선택 적용 API와 idempotency key.
- 적용 후 graph 갱신과 rollback/failure summary.

### 제외 범위

- autonomous planner가 자동으로 전체 roadmap을 바꾸는 기능.
- 외부 도구 write 실행.
- 장기 multi-agent swarm 실행.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T08-S01` | decomposition context builder | `BE` | task/detail/resource/dependency context가 최소 입력으로 구성됨 |
| `DEV-M7-T08-S02` | preview API 구현 | `Fullstack` | AI 제안이 즉시 저장되지 않고 preview로 반환됨 |
| `DEV-M7-T08-S03` | preview review UI 구현 | `FE` | 사용자가 생성/수정/dependency 후보를 선택/해제할 수 있음 |
| `DEV-M7-T08-S04` | apply API와 partial failure 처리 | `Fullstack` | 선택 항목만 적용되고 실패 항목은 이유를 표시함 |

### Acceptance Criteria

- [ ] AI 제안은 사용자 승인 전 task graph에 저장되지 않는다.
- [ ] preview에는 예상 생성 task 수, dependency 수, 비용/모델 정보가 표시된다.
- [ ] 순환 dependency 후보는 apply 전에 차단된다.
- [ ] 중복 task 후보는 기존 task와 병합/스킵/별도 생성 선택지를 제공한다.
- [ ] apply 성공 후 graph와 상세 패널이 새 task/dependency를 반영한다.

### Test / Verification

- [ ] preview API가 실제 저장을 만들지 않는지 확인.
- [ ] cycle dependency 후보 fixture에서 apply 차단 테스트.
- [ ] 일부 task 생성 실패 fixture에서 partial failure UI 검증.
- [ ] 동일 idempotency key 재요청 시 중복 생성되지 않는지 검증.

### Edge Cases

- AI가 이미 존재하는 task와 거의 같은 제목을 제안하는 상태.
- 연결 자료 권한이 없어 AI context에 포함할 수 없는 상태.
- 비용 한도 때문에 preview는 가능하지만 apply나 추가 분석이 차단되는 상태.
- 사용자가 preview를 열어둔 동안 원본 task가 변경된 상태.

### Open Decisions

- `DEC-M7-15`: decomposition preview를 run으로 기록할지 단순 AI request로 기록할지 결정 필요.
- `DEC-M7-16`: AI가 parent-child와 dependency를 동시에 제안할 수 있게 할지 단계적으로 나눌지 결정 필요.

## DEV-M7-T09 / 대량 node 성능과 progressive rendering

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-14` |
| Objects | `task`, `task_dependency`, `task_map_view` |
| Depends on | `DEV-M7-T04`, `DEV-M7-T07` |
| Blocks | `DEV-M7-T16` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md) |

### 목적

대량 task graph에서도 사용자가 화면이 멈췄다고 느끼지 않게 초기 렌더링, pan/zoom, 필터 변경, saved view 복원을 최적화한다.

### 구현 범위

- large graph threshold 정의.
- progressive render 또는 level-of-detail 표시.
- collapsed branch, hidden count, load more 표시.
- pan/zoom interaction 중 비싼 연산 제한.
- 렌더링 성능 측정 지표와 fixture.

### 제외 범위

- backend graph query 최적화 전체.
- WebGL 기반 고성능 그래프 엔진 도입 결정.
- 실시간 공동 편집 성능.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T09-S01` | large graph 기준 정의 | `FE` | node/edge 수별 렌더링 모드 기준이 문서화됨 |
| `DEV-M7-T09-S02` | progressive render 구현 | `FE` | 우선 표시 node와 지연 표시 node가 분리됨 |
| `DEV-M7-T09-S03` | branch collapse UX 구현 | `FE` | 하위 node가 많은 branch를 접고 count로 표시함 |
| `DEV-M7-T09-S04` | performance measurement 추가 | `FE` | 초기 렌더링, filter, pan/zoom 지표를 측정할 수 있음 |

### Acceptance Criteria

- [ ] 1,000 node fixture에서 초기 화면이 빈 상태로 오래 멈추지 않는다.
- [ ] pan/zoom 중 node label 측정이나 layout 재계산이 과도하게 반복되지 않는다.
- [ ] 대량 graph에서 일부 node가 생략되면 생략 이유와 확장 CTA가 표시된다.
- [ ] filter 변경은 전체 화면 lock 없이 진행 상태를 표시한다.
- [ ] saved view 복원 실패 시 기본 view로 fallback한다.

### Test / Verification

- [ ] large graph fixture visual/performance 수동 검증.
- [ ] collapsed branch count 정확성 테스트.
- [ ] filter 변경 중 selected node가 hidden 되는 케이스 검증.
- [ ] 브라우저 performance profile로 layout thrashing 여부 확인.

### Edge Cases

- dependency edge가 collapsed branch 안팎을 가로지르는 상태.
- hidden node가 blocker라 사용자가 왜 막혔는지 모르는 상태.
- saved view가 너무 많은 node를 강제로 펼치려는 상태.
- 노드가 많아 minimap도 성능 문제가 되는 상태.

### Open Decisions

- `DEC-M7-17`: large graph threshold를 node 300/edge 500으로 시작할지 실제 프로파일 후 결정할지 필요.
- `DEC-M7-18`: DOM/canvas/WebGL 중 어떤 렌더링 계층을 장기 표준으로 둘지 결정 필요.

## DEV-M7-T10 / Todo Map에서 run/schedule 전환 guard

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-14`, `SCR-03`, `SCR-08`, `SCR-09` |
| Objects | `task`, `run`, `schedule`, `approval_request` |
| Depends on | `DEV-M7-T05`, `DEV-M7-T06`, `DEV-M7-T08`, `M4-RUN-SCHEDULE` |
| Blocks | `DEV-M7-T16` |
| Source docs | [할 일 맵](../../screens/14-todo-map.md), [공통 동선 10장](../../common/navigation-and-cross-screen-flows.md#10-task---runschedule) |

### 목적

Todo Map에서 `AI에게 맡기기` 또는 schedule 생성으로 넘어갈 때 dependency, 권한, 비용, 연결 상태를 확인한다.

### 구현 범위

- selected task에서 run/schedule 생성 CTA.
- blocker dependency 상태 확인.
- 비용/승인/연결 미비 preview.
- run/schedule 생성 후 node와 상세 패널에 연결 표시.
- 생성 실패 시 task 상태 rollback.

### 제외 범위

- run 실행 엔진 구현.
- schedule 반복 규칙 편집 전체.
- approval 처리 화면 전체.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T10-S01` | delegation readiness check | `BE` | task dependency/permission/cost/connection 상태를 반환함 |
| `DEV-M7-T10-S02` | CTA guard UI 구현 | `FE` | blocker가 있으면 이유와 선행 task 링크가 표시됨 |
| `DEV-M7-T10-S03` | run/schedule 생성 handoff | `Fullstack` | 생성 성공 시 `delegatedRunId` 또는 `scheduleId`가 task와 연결됨 |
| `DEV-M7-T10-S04` | failure rollback 처리 | `FE` | 생성 실패 시 pending 상태가 제거되고 재시도 CTA가 표시됨 |

### Acceptance Criteria

- [ ] 선행 dependency가 미완료인 task는 바로 실행하지 않고 경고 또는 차단한다.
- [ ] 비용/승인/연결 미비 사유는 사용자 조치 CTA와 함께 표시된다.
- [ ] run 생성 성공 후 `/runs/:runId`로 이동할 수 있다.
- [ ] schedule 생성 성공 후 캘린더 또는 schedule 상세로 이동할 수 있다.
- [ ] 실패한 handoff가 task를 `in_progress`로 잘못 남기지 않는다.

### Test / Verification

- [ ] blocker dependency fixture에서 CTA 차단 검증.
- [ ] connection missing fixture에서 설정/연결 CTA 표시 검증.
- [ ] run 생성 성공 후 task detail 연결 검증.
- [ ] run 생성 실패 후 rollback 검증.

### Edge Cases

- dependency는 완료됐지만 task 상세 cache가 stale한 상태.
- 사용자가 동시에 두 번 `AI에게 맡기기`를 누르는 상태.
- schedule 생성 중 timezone/마감일이 없는 상태.
- approval이 필요한데 승인 요청 생성이 실패한 상태.

### Open Decisions

- `DEC-M7-19`: blocker가 있어도 사용자가 강제 실행할 수 있게 할지 결정 필요.
- `DEC-M7-20`: run/schedule 생성 preview를 공통 command preview API와 통합할지 결정 필요.

## DEV-M7-T11 / Help IA, 검색, article card 목록

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-12` |
| Objects | `help_article`, `help_category`, `conversation` |
| Depends on | `DEV-M7-T01`, `M1-SHELL` |
| Blocks | `DEV-M7-T12`, `DEV-M7-T13` |
| Source docs | [도움말](../../screens/12-help.md) |

### 목적

사용자가 도움말 화면에서 문서 카테고리를 훑고 검색으로 필요한 article을 찾을 수 있게 한다.

### 구현 범위

- `/help` route와 sidebar active state.
- help category IA accordion.
- `GET /api/help/home` 또는 `GET /api/help/articles` 조회 계약.
- 검색 입력, debounce, result highlighting.
- article card: title, summary, badge, readTime, updatedAt, bookmark/link copy action slot.

### 제외 범위

- article 본문 renderer.
- help bot 답변 생성.
- 외부 검색 엔진 연동.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T11-S01` | Help route와 layout skeleton | `FE` | header/search/IA/card list/support panel slot이 배치됨 |
| `DEV-M7-T11-S02` | help IA/article list API | `BE` | category와 article card 목록을 반환함 |
| `DEV-M7-T11-S03` | search query 연결 | `Fullstack` | 제목/본문/태그/명령어 검색 결과가 카드 목록에 반영됨 |
| `DEV-M7-T11-S04` | empty/loading/error 상태 | `FE` | 검색 결과 없음, API 실패, 권한 제한 상태가 구분됨 |

### Acceptance Criteria

- [ ] `/help` 진입 시 기본 category와 추천 article 목록이 표시된다.
- [ ] 검색어 입력 시 관련 article이 관련도순으로 표시된다.
- [ ] `⌘K` 또는 platform shortcut과 충돌하지 않는 검색 진입이 제공된다.
- [ ] 권한 없는 article은 숨김 또는 잠금 상태로 표시된다.
- [ ] article card 선택 시 URL 또는 selected article 상태가 갱신된다.

### Test / Verification

- [ ] help home fixture 렌더링 테스트.
- [ ] 검색어 debounce와 결과 갱신 테스트.
- [ ] 결과 없음 fixture에서 empty state 검증.
- [ ] 권한 제한 article fixture 검증.

### Edge Cases

- 검색 결과가 많아도 card list가 layout을 밀어내지 않는 상태.
- 선택 article이 접힌 category 안에 있는 상태.
- article이 삭제되어 deep link가 깨진 상태.
- 검색 index가 article 최신 version보다 stale한 상태.

### Open Decisions

- `DEC-M7-21`: search를 client-side index로 시작할지 server-side search API로 시작할지 결정 필요.
- `DEC-M7-22`: 권한 없는 article을 숨길지 잠금 카드로 노출할지 결정 필요.

## DEV-M7-T12 / Help article detail renderer와 version 표시

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-12` |
| Objects | `help_article`, `help_command` |
| Depends on | `DEV-M7-T11` |
| Blocks | `DEV-M7-T13`, `DEV-M7-T14`, `DEV-M7-T15` |
| Source docs | [도움말](../../screens/12-help.md) |

### 목적

선택한 도움말 article을 제목, 메타데이터, 본문 섹션, 단계, 코드 블록, 보안 경고, 최신성 정보와 함께 렌더링한다.

### 구현 범위

- `GET /api/help/articles/{articleId}` detail API.
- article title, categoryPath, readTime, updatedAt, version, statusBadge 표시.
- markdown 또는 structured block renderer.
- code block metadata: commandId, checksum, requiredPermission, minAppVersion.
- article not found/permission denied/version stale 상태.

### 제외 범위

- full CMS editor.
- command 실행.
- feedback 제출.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T12-S01` | article detail API 정의 | `BE` | 본문 block, metadata, command block 정보가 반환됨 |
| `DEV-M7-T12-S02` | detail renderer 구현 | `FE` | heading, paragraph, step, code, tip, warning block이 표시됨 |
| `DEV-M7-T12-S03` | article version 표시 | `FE` | updatedAt/version/statusBadge가 카드와 상세에서 일치함 |
| `DEV-M7-T12-S04` | stale/not found fallback | `Fullstack` | stale/deleted/permission denied 상태가 구분됨 |

### Acceptance Criteria

- [ ] article card를 선택하면 detail이 같은 articleId로 갱신된다.
- [ ] command block은 복사 task가 사용할 수 있는 stable commandId를 가진다.
- [ ] article version과 updatedAt이 상세 상단에 보인다.
- [ ] 권한 없는 article deep link는 본문을 노출하지 않고 fallback을 제공한다.
- [ ] deleted article deep link는 Help home으로 돌아가는 CTA를 제공한다.

### Test / Verification

- [ ] article detail fixture 렌더링 테스트.
- [ ] code block commandId/checksum 표시 데이터 검증.
- [ ] permission denied fixture 검증.
- [ ] stale article fixture에서 경고 표시 검증.

### Edge Cases

- article 목록은 최신인데 detail cache는 이전 version인 상태.
- command block에 secret placeholder가 빠진 상태.
- 긴 code block이 본문 영역을 가로로 깨는 상태.
- article detail 요청 중 사용자가 다른 article을 선택한 상태.

### Open Decisions

- `DEC-M7-23`: help article 본문을 markdown으로 받을지 structured block JSON으로 받을지 결정 필요.
- `DEC-M7-24`: stale article을 읽게 둘지 최신 버전으로 강제 refresh할지 결정 필요.

## DEV-M7-T13 / Dev Mode tutorial과 권한별 문서 노출

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack`, `Security` |
| Screens | `SCR-12`, `SCR-11` |
| Objects | `help_article`, `dev_token`, `credential`, `audit_log` |
| Depends on | `DEV-M7-T11`, `DEV-M7-T12`, `M6-SETTINGS-DEV` |
| Blocks | `DEV-M7-T14` |
| Source docs | [도움말](../../screens/12-help.md), [설정](../../screens/11-settings.md) |

### 목적

Dev Mode tutorial에서 TUI, MCP, HTTP API, 자체 API token, localhost endpoint를 안내하되 권한 없는 사용자에게 민감한 문서와 CTA를 노출하지 않는다.

### 구현 범위

- Dev Mode category와 article seed.
- article별 requiredPermission, requiredScope, targetSettingRoute.
- 권한 있는 사용자의 설정 CTA: token 만들기, endpoint 보기, MCP 접근 열기.
- 권한 없는 사용자의 locked state와 권한 요청 안내.
- Dev Mode 문서 열람/CTA 클릭 audit event.

### 제외 범위

- 실제 token 생성/폐기 UI 구현.
- 실제 TUI/MCP 서버 실행.
- secret 원문 표시.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T13-S01` | Dev Mode article permission model | `BE` | article별 required permission/scope가 응답에 포함됨 |
| `DEV-M7-T13-S02` | 권한별 article 노출 처리 | `FE` | 권한 없는 문서는 locked/fallback 처리되고 본문 민감 정보가 숨김 |
| `DEV-M7-T13-S03` | Settings deep link CTA 연결 | `FE` | token/endpoint/MCP 설정 화면으로 이동 CTA가 제공됨 |
| `DEV-M7-T13-S04` | Dev Mode help audit event | `BE` | 민감 문서 열람/CTA 클릭이 audit log 후보로 남음 |

### Acceptance Criteria

- [ ] 권한 없는 사용자는 Dev Mode token 생성 절차의 민감 CTA를 볼 수 없다.
- [ ] 권한 있는 사용자는 설정 > 개발자 탭으로 정확히 이동할 수 있다.
- [ ] tutorial command에는 실제 token 원문이 포함되지 않고 placeholder를 사용한다.
- [ ] MCP/TUI/HTTP API 접근 방식은 서로 다른 scope로 설명된다.
- [ ] Dev Mode 문서 열람과 설정 CTA 클릭은 감사 가능한 이벤트로 남는다.

### Test / Verification

- [ ] 권한 있는 사용자 fixture에서 Dev Mode article detail 표시 검증.
- [ ] 권한 없는 사용자 fixture에서 locked state 검증.
- [ ] Settings deep link route/query 검증.
- [ ] article body에 실제 token pattern이 없는지 검색 검증.

### Edge Cases

- 사용자는 Help 접근 권한은 있지만 Settings 개발자 탭 권한은 없는 상태.
- Dev Mode token 기능이 feature flag off인 상태.
- localhost endpoint가 비활성인데 tutorial은 활성 예시를 보여주는 상태.
- MCP 접근은 허용되지만 files scope가 없는 상태.

### Open Decisions

- `DEC-M7-25`: Dev Mode article 자체를 숨길지, 개념 설명은 보여주고 실행 단계만 잠글지 결정 필요.
- `DEC-M7-26`: Dev Mode 문서 CTA 클릭을 audit log에 남길지 product analytics에만 남길지 결정 필요.

## DEV-M7-T14 / Command copy와 stale command guard

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `FE`, `Security` |
| Screens | `SCR-12` |
| Objects | `help_command`, `help_article`, `audit_log` |
| Depends on | `DEV-M7-T12`, `DEV-M7-T13` |
| Blocks | `DEV-M7-T16` |
| Source docs | [도움말](../../screens/12-help.md) |

### 목적

사용자가 문서의 명령어를 오타 없이 복사할 수 있게 하면서, 오래된 명령어 또는 권한 없는 명령어를 그대로 실행하지 않도록 막는다.

### 구현 범위

- code block copy button.
- command metadata: commandId, checksum, articleVersion, stale, requiredPermission, sensitivePlaceholder.
- copy success/failure toast.
- stale command 경고와 최신 문서 refresh CTA.
- clipboard 실패 시 수동 선택 fallback.

### 제외 범위

- 명령어 직접 실행.
- shell별 command 변환 자동화.
- secret vault 연동.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T14-S01` | command block copy UI | `FE` | 각 code block에 copy button과 성공/실패 상태가 있음 |
| `DEV-M7-T14-S02` | stale command guard | `FE` | stale command는 복사 전 경고와 refresh CTA를 표시함 |
| `DEV-M7-T14-S03` | permission guard | `FE` | 권한 없는 command는 복사 비활성 또는 잠금 처리됨 |
| `DEV-M7-T14-S04` | copy audit-safe event | `Fullstack` | commandId/articleVersion만 기록하고 원문 command는 저장하지 않음 |

### Acceptance Criteria

- [ ] 복사 버튼은 현재 code block의 command 원문만 복사한다.
- [ ] stale command는 사용자가 최신 문서를 확인하기 전 무심코 복사되지 않는다.
- [ ] secret placeholder가 포함된 command는 실제 secret 원문을 노출하지 않는다.
- [ ] clipboard 권한 실패 시 수동 복사 안내가 표시된다.
- [ ] audit/event에는 민감 command 원문이 저장되지 않는다.

### Test / Verification

- [ ] copy success/failure mocking 테스트.
- [ ] stale command fixture에서 guard 표시 검증.
- [ ] 권한 없는 command fixture에서 copy 비활성 검증.
- [ ] event payload에 command text가 없는지 확인.

### Edge Cases

- article detail은 최신이지만 특정 command만 deprecated된 상태.
- 사용자가 stale 경고 modal을 여러 번 빠르게 여는 상태.
- 브라우저 clipboard API가 차단된 상태.
- command에 local path, token placeholder, endpoint가 섞인 상태.

### Open Decisions

- `DEC-M7-27`: stale command 복사를 완전히 막을지 명시 확인 후 허용할지 결정 필요.
- `DEC-M7-28`: command별 checksum 검증을 backend에서 할지 article build 시 생성할지 결정 필요.

## DEV-M7-T15 / System status panel/detail과 stale 처리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-12`, `SCR-01` |
| Objects | `system_status`, `connection`, `schedule`, `run` |
| Depends on | `DEV-M7-T11`, `M1-EVENT` |
| Blocks | `DEV-M7-T16` |
| Source docs | [도움말](../../screens/12-help.md), [공통 동선](../../common/navigation-and-cross-screen-flows.md) |

### 목적

사용자가 문제가 제품 장애인지, 설정/권한/연결 문제인지 구분할 수 있게 도움말 우측에서 시스템 상태와 stale 여부를 보여준다.

### 구현 범위

- `GET /api/system-status` 또는 help home 포함 status summary.
- 서비스, API, 저장소, 자동 작업 상태.
- 마지막 점검 시간, status freshness, stale threshold.
- status detail modal/page: incident, degraded service, maintenance, user action.
- stale status 경고와 재조회 CTA.

### 제외 범위

- 실제 Prometheus/Grafana 연동.
- incident 관리 시스템.
- 알림 발송 시스템.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T15-S01` | status summary API | `BE` | service/API/storage/automation 상태와 checkedAt이 반환됨 |
| `DEV-M7-T15-S02` | status panel UI | `FE` | 우측 패널에 상태, 마지막 점검, 상세 보기 CTA가 표시됨 |
| `DEV-M7-T15-S03` | stale status 처리 | `Fullstack` | checkedAt이 오래된 경우 stale warning과 refresh CTA가 표시됨 |
| `DEV-M7-T15-S04` | status detail view | `FE` | incident/maintenance/user action을 구분해 표시함 |

### Acceptance Criteria

- [ ] 정상 상태에서는 `모두 정상`과 각 항목 정상 라벨이 표시된다.
- [ ] degraded/error 상태에서는 영향을 받는 기능과 사용자 액션이 표시된다.
- [ ] stale 상태는 정상으로 오인되지 않게 별도 경고를 표시한다.
- [ ] status detail은 도움말 봇 context에 전달 가능한 summary를 제공한다.
- [ ] status API 실패는 Help 전체 실패로 번지지 않는다.

### Test / Verification

- [ ] all green status fixture 렌더링 테스트.
- [ ] degraded/error fixture 렌더링 테스트.
- [ ] stale checkedAt fixture 검증.
- [ ] status API 실패 시 fallback UI 검증.

### Edge Cases

- system status는 정상인데 특정 사용자 credential만 만료된 상태.
- 자동 작업 worker만 지연되어 schedule/run 관련 도움말에 영향이 있는 상태.
- checkedAt이 client timezone과 다르게 표시되는 상태.
- status detail 권한이 없어 summary만 볼 수 있는 상태.

### Open Decisions

- `DEC-M7-29`: system status를 public summary로 둘지 hub/user별 상태를 섞어 보여줄지 결정 필요.
- `DEC-M7-30`: stale threshold를 5분으로 둘지 서비스별로 다르게 둘지 결정 필요.

## DEV-M7-T16 / Feedback, help bot context, M7 통합 검수

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `QA` |
| Screens | `SCR-12`, `SCR-14`, `SCR-11` |
| Objects | `feedback`, `conversation`, `help_article`, `system_status`, `task` |
| Depends on | `DEV-M7-T09`, `DEV-M7-T10`, `DEV-M7-T14`, `DEV-M7-T15` |
| Blocks | `M7 release` |
| Source docs | [도움말](../../screens/12-help.md), [할 일 맵](../../screens/14-todo-map.md), [설정](../../screens/11-settings.md) |

### 목적

M7에서 만든 시각 계획과 도움말 기능을 실제 사용자 흐름으로 검수하고, 문서 오류나 막힘을 feedback/help bot context로 남긴다.

### 구현 범위

- feedback submit API: articleId, sectionId, searchQuery, statusSummary, browser/app version, screenshot metadata 후보.
- feedback modal: 유형, 설명, 현재 context 포함 여부.
- help bot entry: help scope conversation 생성과 현재 article/status/search context 전달.
- Todo Map 통합 시나리오 검수: graph 조회, dependency 차단, AI decomposition, run handoff.
- Help 통합 시나리오 검수: search, article detail, Dev Mode permission, command copy, stale status, feedback.

### 제외 범위

- 실제 support ticket workflow.
- help bot 답변 품질 tuning.
- 운영 incident 자동 생성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M7-T16-S01` | feedback API와 modal | `Fullstack` | 현재 article/search/status context를 포함해 feedback 제출 가능함 |
| `DEV-M7-T16-S02` | help bot context handoff | `Fullstack` | help scope conversation 생성 시 article/status/permission context가 전달됨 |
| `DEV-M7-T16-S03` | Todo Map E2E 시나리오 검수 | `QA` | graph/dependency/AI decomposition/run handoff 주요 흐름이 검증됨 |
| `DEV-M7-T16-S04` | Help E2E 시나리오 검수 | `QA` | search/detail/Dev Mode/copy/status/feedback 주요 흐름이 검증됨 |
| `DEV-M7-T16-S05` | M7 문서/계약 회귀 점검 | `Docs` | 화면 계약과 task 문서의 route/object/read/write가 충돌하지 않음 |

### Acceptance Criteria

- [ ] feedback 제출 후 사용자는 원래 article/detail 위치에 머문다.
- [ ] feedback payload에 secret/token/command 원문이 포함되지 않는다.
- [ ] help bot은 현재 article과 system status를 context로 받지만 실제 설정 변경은 수행하지 않는다.
- [ ] Todo Map에서 순환 dependency, 대량 node, drag 저장 충돌, stale graph 시나리오가 검증된다.
- [ ] Help에서 stale command, 권한 없는 Dev Mode 문서, stale status 시나리오가 검증된다.

### Test / Verification

- [ ] feedback API validation 테스트.
- [ ] feedback payload 민감값 필터링 테스트.
- [ ] help bot context 생성 테스트.
- [ ] Todo Map E2E 수동 또는 자동 검수 체크리스트 실행.
- [ ] Help E2E 수동 또는 자동 검수 체크리스트 실행.

### Edge Cases

- feedback 제출 중 article이 바뀐 상태.
- help bot이 설정 변경을 제안하면서 실제 실행 CTA와 혼동되는 상태.
- system status가 stale인데 help bot이 정상이라고 답할 위험.
- 대량 graph 검수 중 브라우저 메모리 사용량이 급증하는 상태.
- Dev Mode 문서 피드백에 token이 첨부될 위험.

### Open Decisions

- `DEC-M7-31`: feedback을 내부 DB에 저장할지 외부 issue/ticket 시스템으로 보낼지 결정 필요.
- `DEC-M7-32`: help bot을 Help 화면 안 drawer로 열지 전역 chat으로 전환할지 결정 필요.
