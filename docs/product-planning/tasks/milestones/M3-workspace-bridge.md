# M3 Workspace Bridge 개발 태스크 / Generic Workspace Surface

## 1. 목적

M3의 목적은 `topic`을 단순 목록/상세 패널에서 실제 작업공간으로 확장하는 generic bridge를 만드는 것이다. 사용자는 전역 채팅이나 주제 목록에서 지속 작업을 선택하고, `/topics/{topicId}/workspace` 작업실로 이동한 뒤, 작업면을 보면서 같은 주제 scope의 채팅을 이어갈 수 있어야 한다.

이번 milestone은 신규 프로젝트 기준이다. 기존 `trip-plan`은 참고 자료이며, 여행 기능 연결/복사/마이그레이션은 범위에서 제외한다. 여행은 이후 workspace subtype 예시로 만들 수 있지만, M3에서는 모든 subtype에 적용되는 route, shell, surface, artifact link, activity, chat scope 계약을 먼저 만든다.

## 2. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 포맷 | [00-task-format.md](../00-task-format.md) |
| 기획 인덱스 | [README.md](../../README.md) |
| 화면 계약 | [screen-contracts.md](../../screen-contracts.md#scr-02--주제--topics) |
| 구현 순서 | [implementation-plan.md](../../common/implementation-plan.md#6-m3--workspace-bridge) |
| 공통 동선 | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md#6-workspace---chat) |
| 공통 객체/상태/API | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 주제 화면 상세 | [02-topics.md](../../screens/02-topics.md) |
| Reference-only | [trip-plan REBUILD_ARCHITECTURE.md](../../../../projects/apps/trip-plan/docs/REBUILD_ARCHITECTURE.md) |

## 3. Milestone 범위

### 포함

| 영역 | 포함 내용 |
| --- | --- |
| Topic subtype | `topic.type`, subtype registry, 기본 surface 결정 |
| Workspace route/shell | `/topics/{topicId}/workspace`, workspace header, 내부 내비, surface 영역, chat 패널 |
| Workspace bootstrap | topic detail, resources, current surface, permission, warnings 초기 조회 |
| Workspace chat scope | `conversation.scopeType=topic`, topic chat message 전송/조회 |
| Artifact/surface link | topic과 문서/지도/표/보드/placeholder surface relation |
| Activity 기록 | workspace 진입, chat message, surface 생성/변경, relation 변경 activity |
| 왕복 동선 | chat -> workspace, workspace -> chat, workspace -> topics 목록 복귀 |
| Reference check | trip-plan의 좋은 패턴만 추출하고 신규 generic 설계에 반영 가능성 검토 |

### 제외

| 제외 항목 | 이유 |
| --- | --- |
| 기존 trip-plan 연결/복사/마이그레이션 | 신규 프로젝트 기준이며 reference-only 전제 |
| 여행 일정/지도/장소 CRUD | 이후 travel subtype 구현 범위 |
| 투자/리포트/파일/스크랩 실제 surface 구현 | M5 이후 각 domain milestone 범위 |
| Agent 실행/run/schedule 구현 | M4/M6 범위 |
| 외부 provider/API key 관리 | M6 범위 |

## 4. 선행 조건

| 조건 | 설명 |
| --- | --- |
| M1 Shell + Domain Foundation | 공통 라우터, 사이드바, route placeholder, canonical enum, stable ID/key 정책 준비 |
| M2 Control Tower MVP | 전역 채팅, topic 생성, topic 목록/상세, conversation-to-topic promotion 준비 |
| 신규 프로젝트 bootstrap | 기존 앱 코드 복사 없이 새 앱 구조에서 구현 시작 |

## 5. Task Dependency Map

```text
DEV-M3-T01
  -> DEV-M3-T02
  -> DEV-M3-T03
  -> DEV-M3-T04

DEV-M3-T01
  -> DEV-M3-T05
  -> DEV-M3-T06

DEV-M3-T03 + DEV-M3-T04 + DEV-M3-T05 + DEV-M3-T06
  -> DEV-M3-T07
  -> DEV-M3-T08
  -> DEV-M3-T10
  -> DEV-M3-T12

DEV-M3-T09는 T02 이후 병렬 가능
DEV-M3-T11은 전체 구현 전/중 reference check로 병렬 가능
```

## 6. 개발 태스크

## DEV-M3-T01 / Topic subtype registry와 workspace surface 계약 정의

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `artifact`, `conversation` |
| Depends on | `M1 domain foundation`, `M2 topic create/list` |
| Blocks | `DEV-M3-T02`, `DEV-M3-T03`, `DEV-M3-T05`, `DEV-M3-T09` |
| Source docs | [domain model](../../common/domain-model-and-state-policy.md#41-topic), [topics detail](../../screens/02-topics.md#9-데이터-필드--api-힌트) |

### 목적

`topic.type`을 화면 장식용 태그가 아니라 작업실의 기본 surface와 허용 artifact를 결정하는 계약으로 승격한다.

### 구현 범위

- canonical topic type 후보 정의: `generic`, `travel`, `research`, `writing`, `investment`, `automation`, `review`.
- subtype별 기본 workspace surface key 정의.
- subtype별 허용 artifact type, 기본 빈 상태, fallback surface 정의.
- topic 상세 응답에 workspace 진입에 필요한 `workspaceSummary` 후보 필드 추가.
- subtype이 unknown이거나 삭제된 type일 때 `generic` fallback 정책 정의.

### 제외 범위

- subtype별 전용 surface 구현.
- travel 일정/지도 데이터 모델 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T01-S01` | Topic subtype enum 후보 정리 | `BE` | API enum과 사용자 표시 라벨이 분리되어 문서화됨 |
| `DEV-M3-T01-S02` | Surface key 계약 정의 | `Fullstack` | `defaultSurfaceKey`, `availableSurfaceKeys`, `lastSurfaceKey` 후보가 정의됨 |
| `DEV-M3-T01-S03` | Workspace summary 응답 후보 정의 | `BE` | topic detail 또는 open 응답에서 shell 초기화에 필요한 필드가 식별됨 |
| `DEV-M3-T01-S04` | Unknown subtype fallback 규칙 정의 | `FE` | 미지원 subtype에서도 generic workspace가 열리는 조건이 명시됨 |

### Acceptance Criteria

- [ ] `topic.type`이 workspace surface 선택에 쓰이는 계약이 정의되어 있음.
- [ ] 모든 subtype은 기본 surface와 fallback surface를 가짐.
- [ ] subtype이 없어도 workspace route가 깨지지 않음.
- [ ] subtype 추가가 기존 route/shell 변경 없이 가능함.

### Test / Verification

- [ ] `generic`, `travel`, unknown subtype topic fixture로 기본 surface 계산 검증.
- [ ] `lastSurfaceKey`가 허용되지 않는 값일 때 fallback 검증.
- [ ] 목록 카드 type 라벨과 API enum 혼동 없음 확인.

### Edge Cases

- topic type 변경 후 기존 artifact가 새 subtype에서 지원되지 않음.
- 저장된 `lastSurfaceKey`가 삭제된 surface를 가리킴.
- type은 `travel`이지만 travel 전용 구현이 아직 없음.
- 사용자가 직접 URL query로 미지원 surface를 요청함.

### Open Decisions

- `DEC-M3-01`: MVP subtype 목록을 위 후보 전체로 둘지 `generic`, `travel`, `research`, `writing` 정도로 줄일지 결정 필요.
- `DEC-M3-02`: `artifact`를 독립 canonical 객체로 둘지 `document`와 별도 상위 타입으로 둘지 결정 필요.

## DEV-M3-T02 / Workspace route와 공통 shell skeleton 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `FE` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `artifact` |
| Depends on | `DEV-M3-T01`, `M1 route shell` |
| Blocks | `DEV-M3-T03`, `DEV-M3-T04`, `DEV-M3-T09`, `DEV-M3-T10` |
| Source docs | [navigation route policy](../../common/navigation-and-cross-screen-flows.md#13-deep-link와-fallback), [topics workspace entry](../../screens/02-topics.md#69-작업실-열기) |

### 목적

주제 목록의 `작업실 열기`가 이동할 공통 작업실 화면을 만든다. 이 shell은 subtype별 구현이 없어도 header, 내부 내비, surface 영역, chat 패널을 안정적으로 보여줘야 한다.

### 구현 범위

- route 후보: `/topics/{topicId}/workspace`.
- query 후보: `surface`, `conversationId`, `from`, `focus`.
- workspace header: topic title, type, status, permission, connection warning, back action.
- 내부 내비: `대화`, `작업면`, `자료`, `결과물`, `활동`, `설정` placeholder.
- 중앙 surface outlet과 우측 또는 하단 topic chat panel slot 구성.
- route 진입 시 사이드바 `주제` 활성 상태 유지.

### 제외 범위

- 각 탭의 실제 domain CRUD.
- 모바일 상세 layout 완성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T02-S01` | Workspace route 등록 | `FE` | `/topics/{topicId}/workspace` 직접 접근 시 workspace shell이 렌더링됨 |
| `DEV-M3-T02-S02` | Workspace shell layout 구성 | `FE` | header, internal nav, surface outlet, chat slot이 안정 크기로 배치됨 |
| `DEV-M3-T02-S03` | Sidebar active state 연결 | `FE` | workspace route에서도 글로벌 사이드바 `주제`가 활성화됨 |
| `DEV-M3-T02-S04` | URL query 복원 규칙 적용 | `FE` | `surface`, `from`, `focus` query를 읽고 잘못된 값은 fallback 처리함 |

### Acceptance Criteria

- [ ] 주제 상세 패널의 `작업실 열기`가 workspace route로 이동 가능함.
- [ ] workspace route를 직접 열어도 shell이 표시됨.
- [ ] header와 내부 내비가 topic 선택 전 로딩 상태에서도 layout shift 없이 유지됨.
- [ ] workspace에서 글로벌 사이드바 활성 메뉴가 `주제`로 표시됨.

### Test / Verification

- [ ] `/topics/topic_1/workspace` 직접 접근 수동 검증.
- [ ] `/topics/topic_1/workspace?surface=unknown` fallback 검증.
- [ ] 브라우저 뒤로가기 시 이전 topics 목록/상세 상태 복귀 검증.
- [ ] 좁은 viewport에서 chat panel이 surface를 가리지 않는지 확인.

### Edge Cases

- topicId가 없거나 route param이 잘못됨.
- topic 조회 전 header가 빈 값으로 깜빡임.
- `from=chat`으로 들어왔지만 원본 conversation이 삭제됨.
- surface query가 허용 목록 밖임.

### Open Decisions

- `DEC-M3-03`: workspace chat panel 기본 위치를 우측 고정으로 둘지 하단 drawer로 둘지 결정 필요.
- `DEC-M3-04`: 내부 내비 탭을 route segment로 둘지 query/state로 둘지 결정 필요.

## DEV-M3-T03 / Workspace bootstrap API와 초기 상태 연결

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `source`, `file_asset`, `memory`, `artifact` |
| Depends on | `DEV-M3-T01`, `DEV-M3-T02`, `M2 topic detail` |
| Blocks | `DEV-M3-T04`, `DEV-M3-T05`, `DEV-M3-T07`, `DEV-M3-T10` |
| Source docs | [M3 plan](../../common/implementation-plan.md#6-m3--workspace-bridge), [common API hints](../../common/domain-model-and-state-policy.md#102-대표-api-후보) |

### 목적

workspace 진입 시 필요한 topic, permission, resources, current conversation, surfaces를 한 번에 초기화하는 bootstrap 경로를 만든다.

### 구현 범위

- `POST /api/topics/{topicId}/open` 또는 `GET /api/topics/{topicId}/workspace` 후보 중 하나로 bootstrap 계약 정의/구현.
- `lastOpenedAt`, `lastSurfaceKey` 갱신 정책 적용.
- topic header 경량 정보와 workspace resources 요약 반환.
- 읽기/쓰기 권한, 비용/연결 warning, archived/deleted 상태 포함.
- topic conversation 기본값 반환 또는 생성 후보 반환.

### 제외 범위

- 모든 resource 상세 목록 full loading.
- cost/provider 실제 연동.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T03-S01` | Bootstrap API 계약 확정 | `BE` | 요청/응답 필드와 side effect 여부가 명시됨 |
| `DEV-M3-T03-S02` | Workspace bootstrap 조회 구현 | `BE` | topic, permissions, resources summary, surface summary를 반환함 |
| `DEV-M3-T03-S03` | `lastOpenedAt` 갱신 처리 | `BE` | workspace 진입 시 최근 주제 정렬에 반영 가능한 시간이 기록됨 |
| `DEV-M3-T03-S04` | FE 초기 데이터 연결 | `FE` | shell header와 surface outlet이 bootstrap 응답으로 초기화됨 |

### Acceptance Criteria

- [ ] workspace 진입 시 topic header, 현재 surface, resource summary, permission state가 표시됨.
- [ ] topic이 보관됨이면 읽기 가능 상태와 보관 배지가 표시됨.
- [ ] topic이 삭제/권한 없음이면 workspace 전체 실패가 아니라 fallback 상태가 표시됨.
- [ ] bootstrap 실패와 상세 resource 실패가 구분됨.

### Test / Verification

- [ ] active topic bootstrap 성공 케이스.
- [ ] archived topic 읽기 전용 케이스.
- [ ] deleted topic fallback 케이스.
- [ ] permission read-only fixture에서 쓰기 액션 비활성 검증.
- [ ] bootstrap 재호출 시 `lastOpenedAt` 갱신 또는 멱등성 정책 확인.

### Edge Cases

- topic은 존재하지만 current conversation이 없음.
- topic에 연결된 resource count가 stale임.
- workspace 진입 중 topic이 archive/delete됨.
- bootstrap API가 부분 실패 응답을 줄지 완전 실패할지 모호함.

### Open Decisions

- `DEC-M3-05`: workspace open API를 `POST /open` side-effect 방식으로 둘지 `GET /workspace` 조회 + 별도 lastOpened patch로 둘지 결정 필요.
- `DEC-M3-06`: bootstrap 응답에 resources preview를 몇 개까지 포함할지 결정 필요.

## DEV-M3-T04 / Topic workspace chat scope 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `conversation`, `message`, `topic`, `citation` |
| Depends on | `DEV-M3-T02`, `DEV-M3-T03`, `M2 chat foundation` |
| Blocks | `DEV-M3-T06`, `DEV-M3-T07`, `DEV-M3-T08`, `DEV-M3-T12` |
| Source docs | [chat scope policy](../../common/navigation-and-cross-screen-flows.md#4-채팅-scope와-화면-승격), [workspace chat](../../common/navigation-and-cross-screen-flows.md#6-workspace---chat) |

### 목적

workspace 내부 채팅을 전역 채팅과 분리해 `conversation.scopeType=topic`, `scopeId=topicId`로 저장하고, 작업면 변경 요청의 조작면으로 사용한다.

### 구현 범위

- topic conversation 조회/생성 정책.
- workspace chat messages 목록 표시.
- workspace chat message 전송.
- message에 topicId, surfaceKey, attached artifact/source refs 후보 포함.
- AI 응답이 아직 없어도 local echo, pending, failed, retry 상태 제공.
- message 생성 시 topic activity 기록 연계 준비.

### 제외 범위

- LLM provider 실제 응답 품질.
- tool command 실행.
- artifact 직접 수정 command 적용.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T04-S01` | Topic conversation 조회/생성 계약 작성 | `BE` | scopeType/scopeId 기준으로 대화가 분리됨 |
| `DEV-M3-T04-S02` | Workspace chat message list 연결 | `FE` | workspace chat panel에서 topic messages가 표시됨 |
| `DEV-M3-T04-S03` | Message send API 연결 | `Fullstack` | 메시지 전송 후 pending/success/failure 상태가 표현됨 |
| `DEV-M3-T04-S04` | Global chat 혼입 방지 검증 | `Fullstack` | global conversationId로 workspace message가 저장되지 않음 |

### Acceptance Criteria

- [ ] workspace에서 보낸 메시지는 topic conversation에만 저장됨.
- [ ] 오늘 화면 전역 채팅 내역과 workspace topic 채팅 내역이 섞이지 않음.
- [ ] message 실패 시 재시도 가능하고 입력 내용이 사라지지 않음.
- [ ] topic chat 답변 또는 사용자 message가 topic activity 후보로 남을 수 있음.

### Test / Verification

- [ ] 같은 text를 global chat과 topic chat에 각각 보내고 conversation scope 분리 확인.
- [ ] topic A workspace에서 보낸 message가 topic B에 나타나지 않음.
- [ ] 전송 실패 fixture에서 retry UI 확인.
- [ ] page refresh 후 topic chat messages 복원 확인.

### Edge Cases

- topic conversation이 archive/deleted 상태임.
- workspace 진입 직후 빠르게 메시지를 보내 bootstrap과 race 발생.
- 같은 메시지 중복 클릭으로 중복 저장됨.
- topic 권한이 read-only인데 chat send가 허용되는지 모호함.

### Open Decisions

- `DEC-M3-07`: read-only topic에서 질문형 chat은 허용하고 쓰기 command만 막을지, chat 전체를 막을지 결정 필요.
- `DEC-M3-08`: topic별 conversation을 하나로 고정할지 여러 chat session을 허용할지 결정 필요.

## DEV-M3-T05 / Artifact와 surface link 기본 모델 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `artifact`, `document`, `source`, `file_asset` |
| Depends on | `DEV-M3-T01`, `DEV-M3-T03` |
| Blocks | `DEV-M3-T06`, `DEV-M3-T09`, `DEV-M3-T12` |
| Source docs | [workspace transition](../../common/navigation-and-cross-screen-flows.md#5-chat-first---workspace-전환), [domain open question](../../common/domain-model-and-state-policy.md#13-오픈-질문) |

### 목적

workspace에 표시되는 작업면을 topic에 연결된 산출물 또는 surface link로 관리한다. M3에서는 실제 지도/문서/표 기능 대신 generic link와 placeholder surface가 깨지지 않게 만드는 것이 목표다.

### 구현 범위

- artifact/surface link 후보 모델 정의.
- topic에 연결된 surface list 조회.
- 기본 placeholder artifact 생성 또는 system surface 표시.
- `surfaceKey`와 `artifactId`를 구분.
- surface 선택/최근 선택 저장.
- artifact 삭제/권한 제한 시 workspace fallback.

### 제외 범위

- 문서 편집기, 지도, markmap, 투자 차트 구현.
- citation 검증.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T05-S01` | Surface link 모델 후보 정의 | `BE` | `topicId`, `surfaceKey`, `artifactType`, `artifactId`, `status`, `order` 필드가 정리됨 |
| `DEV-M3-T05-S02` | Topic surface 목록 조회 | `BE` | workspace에서 사용할 surface list가 topic 기준으로 반환됨 |
| `DEV-M3-T05-S03` | Surface 선택 상태 저장 | `Fullstack` | 사용자가 선택한 surface가 refresh 후 복원됨 |
| `DEV-M3-T05-S04` | Missing artifact fallback | `FE` | artifact가 삭제/권한 제한되어도 fallback surface가 표시됨 |

### Acceptance Criteria

- [ ] workspace는 최소 하나의 surface를 항상 표시함.
- [ ] `surfaceKey`와 `artifactId`가 혼동되지 않음.
- [ ] surface 선택 후 새로고침해도 같은 surface 또는 안전 fallback이 열림.
- [ ] 연결된 artifact가 없어도 generic overview surface가 표시됨.

### Test / Verification

- [ ] artifact 없는 topic workspace 진입.
- [ ] artifact 2개 이상 topic에서 surface 전환.
- [ ] 권한 없는 artifact link fixture에서 fallback 확인.
- [ ] 삭제된 artifactId deep link에서 overview fallback 확인.

### Edge Cases

- 하나의 artifact가 여러 topic에 연결됨.
- topic subtype이 바뀌면서 기존 surface가 미지원이 됨.
- surface order가 중복됨.
- artifact는 존재하지만 source/citation 권한이 좁음.

### Open Decisions

- `DEC-M3-09`: non-document 작업면을 `artifact`로 저장할지 subtype별 `workspace_surface`로 저장할지 결정 필요.
- `DEC-M3-10`: topic별 기본 overview surface를 서버 리소스로 만들지, 클라이언트 system surface로 둘지 결정 필요.

## DEV-M3-T06 / Topic activity 기록과 workspace timeline 연결

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic_activity`, `conversation`, `artifact`, `topic` |
| Depends on | `DEV-M3-T04`, `DEV-M3-T05` |
| Blocks | `DEV-M3-T08`, `DEV-M3-T12` |
| Source docs | [topics activity](../../screens/02-topics.md#66-우측-상세-패널), [common events](../../common/navigation-and-cross-screen-flows.md#152-공통-이벤트) |

### 목적

workspace에서 일어난 의미 있는 변화가 topic 상세 패널의 최근 활동과 workspace timeline에 일관되게 남도록 한다.

### 구현 범위

- activity type 후보 정의: `workspace_opened`, `message_created`, `surface_created`, `surface_selected`, `artifact_linked`, `resource_linked`, `metadata_updated`.
- activity list API 또는 topic summary 포함 정책.
- workspace activity tab placeholder 연결.
- chat message 생성과 surface 변경에서 activity 기록.
- 중복 activity 압축 또는 같은 actor의 빠른 반복 처리 정책.

### 제외 범위

- 모든 domain별 activity type 완성.
- 실시간 push 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T06-S01` | Activity type 목록 정의 | `BE` | M3에서 기록할 최소 activity type이 확정됨 |
| `DEV-M3-T06-S02` | Activity 생성 경로 연결 | `BE` | message/surface/open 이벤트에서 activity가 생성됨 |
| `DEV-M3-T06-S03` | Activity timeline 조회 | `Fullstack` | workspace와 topic 상세에서 같은 activity를 조회 가능함 |
| `DEV-M3-T06-S04` | 중복 activity 처리 | `BE` | 반복 open/select 같은 저가치 activity가 과도하게 쌓이지 않음 |

### Acceptance Criteria

- [ ] workspace에서 보낸 chat message가 topic activity에 반영됨.
- [ ] surface 생성/선택/연결 변경이 activity로 남음.
- [ ] activity는 안정 ID를 가져 목록 key로 쓸 수 있음.
- [ ] workspace와 topics 상세 패널의 최근 활동 기준이 충돌하지 않음.

### Test / Verification

- [ ] chat message 생성 후 activity count 증가 확인.
- [ ] surface 선택 반복 시 activity 과다 생성 방지 확인.
- [ ] activity pagination 또는 limit 적용 확인.
- [ ] topic A activity가 topic B에 노출되지 않음.

### Edge Cases

- activity 생성은 실패했지만 message 저장은 성공함.
- activity 저장 실패 시 위험 작업은 아니지만 timeline이 stale해짐.
- 같은 client retry가 activity 중복을 만듦.
- 삭제된 artifact를 가리키는 activity 표시.

### Open Decisions

- `DEC-M3-11`: activity 저장 실패를 사용자에게 오류로 보여줄지, 백그라운드 재시도 대상으로 둘지 결정 필요.
- `DEC-M3-12`: workspace open activity를 매번 남길지 하루 단위로 압축할지 결정 필요.

## DEV-M3-T07 / Chat에서 Workspace로 이동하는 handoff 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `conversation`, `message`, `topic`, `artifact` |
| Depends on | `DEV-M3-T03`, `DEV-M3-T04`, `DEV-M3-T05`, `M2 conversation-to-topic promotion` |
| Blocks | `DEV-M3-T08`, `DEV-M3-T12` |
| Source docs | [chat-first transition](../../common/navigation-and-cross-screen-flows.md#5-chat-first---workspace-전환) |

### 목적

전역 채팅에서 “이걸 작업실로 열어줘”, “저번 여행 목록 보여줘”, “이 주제에서 편집하자” 같은 요청이 topic/workspace로 자연스럽게 넘어가게 한다.

### 구현 범위

- M2 promotion 결과에서 workspace open CTA 연결.
- existing topic 선택 후 workspace 이동.
- 새 topic 생성 후 workspace 이동.
- 원본 `conversationId`, `messageIds`, `from=chat` query 또는 relation 저장.
- 이동 중 loading state: “작업공간으로 이동 중” 표시.
- handoff 실패 시 원래 chat 유지.

### 제외 범위

- 자연어 intent parser 고도화.
- 자동 topic 연결.
- trip-specific 목록 조회.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T07-S01` | Workspace CTA action 연결 | `FE` | chat 카드/주제 승격 결과에서 workspace 열기 CTA가 동작함 |
| `DEV-M3-T07-S02` | Existing topic handoff | `Fullstack` | 기존 topic 선택 후 workspace로 이동하고 relation이 유지됨 |
| `DEV-M3-T07-S03` | New topic handoff | `Fullstack` | 새 topic 생성 후 workspace로 이동하고 원본 대화가 연결됨 |
| `DEV-M3-T07-S04` | Handoff loading/failure UX | `FE` | 이동 중/실패 시 원본 chat context가 사라지지 않음 |

### Acceptance Criteria

- [ ] 전역 chat 결과에서 workspace로 이동 가능함.
- [ ] workspace 진입 후 원본 요청 요약 또는 연결 message가 topic chat/activity에 표시됨.
- [ ] handoff 실패 시 전역 chat 메시지와 입력 상태가 유지됨.
- [ ] 자동 연결이 아니라 사용자 확정 후 topic relation이 생성됨.

### Test / Verification

- [ ] 전역 chat -> 기존 topic 선택 -> workspace 이동.
- [ ] 전역 chat -> 새 topic 생성 -> workspace 이동.
- [ ] topic 생성 실패 fixture에서 chat 유지.
- [ ] workspace bootstrap 실패 fixture에서 재시도 CTA 확인.

### Edge Cases

- 사용자가 handoff loading 중 뒤로가기를 누름.
- 기존 topic 후보가 권한 없음/보관 상태임.
- 같은 chat message를 여러 topic에 연결하려 함.
- 새 topic 생성은 성공했지만 workspace open이 실패함.

### Open Decisions

- `DEC-M3-13`: handoff 완료 후 원본 global chat에 “작업실로 이동됨” system message를 남길지 결정 필요.
- `DEC-M3-14`: 한 message를 여러 topic에 연결할 수 있게 허용할지 결정 필요.

## DEV-M3-T08 / Workspace에서 Chat과 Topics 목록으로 복귀하는 동선 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `FE` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `artifact` |
| Depends on | `DEV-M3-T04`, `DEV-M3-T06`, `DEV-M3-T07` |
| Blocks | `DEV-M3-T12` |
| Source docs | [workspace to chat](../../common/navigation-and-cross-screen-flows.md#6-workspace---chat), [deep link fallback](../../common/navigation-and-cross-screen-flows.md#13-deep-link와-fallback) |

### 목적

사용자가 workspace에서 작업하다가 원래 chat, topic 목록, 특정 source/file/memory 상세로 돌아갈 때 scope와 선택 상태가 유지되게 한다.

### 구현 범위

- workspace header back action.
- `from=chat`, `from=topics`, `from=source` 등 복귀 context 처리.
- topics 목록 복귀 시 선택 topic과 필터 상태 복원.
- chat focus 복귀 시 topic chat input focus 또는 원본 global chat 위치 복원.
- surface에서 `이 작업에 대해 채팅하기` 액션 연결.

### 제외 범위

- 모든 외부 화면의 상세 복귀 구현.
- 모바일 back stack 고도화.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T08-S01` | Back context parsing | `FE` | `from` query/state 기준 복귀 대상이 계산됨 |
| `DEV-M3-T08-S02` | Topics 목록 복귀 | `FE` | 목록 필터/선택 topic이 가능한 범위에서 복원됨 |
| `DEV-M3-T08-S03` | Chat focus 복귀 | `FE` | workspace chat 또는 원본 chat으로 돌아갈 때 scope가 유지됨 |
| `DEV-M3-T08-S04` | Invalid back fallback | `FE` | 복귀 대상이 없으면 `/topics/{topicId}` 또는 `/topics`로 안전 이동함 |

### Acceptance Criteria

- [ ] topics 목록에서 workspace를 열고 뒤로 가면 선택 topic이 유지됨.
- [ ] global chat에서 workspace로 이동한 뒤 복귀하면 원본 chat 흐름을 찾을 수 있음.
- [ ] workspace 내부 채팅은 계속 topic scope를 유지함.
- [ ] 복귀 대상이 삭제되어도 안전 fallback이 동작함.

### Test / Verification

- [ ] `/topics?type=travel` -> workspace -> back 시 필터 복원.
- [ ] global chat -> workspace -> back 시 global chat 복귀.
- [ ] workspace reload 후 back context가 없을 때 topics fallback.
- [ ] focus query가 잘못된 message/artifact를 가리킬 때 fallback 확인.

### Edge Cases

- 브라우저 history와 앱 내부 back context가 충돌함.
- 복귀할 global conversation이 archived됨.
- topic 목록 필터 밖의 topic을 workspace에서 열었음.
- 사용자가 여러 workspace를 연속으로 이동함.

### Open Decisions

- `DEC-M3-15`: 복귀 context를 URL query로만 둘지 session state와 병행할지 결정 필요.
- `DEC-M3-16`: workspace header back 버튼의 기본 목적지를 `/topics/{topicId}`로 둘지 직전 화면으로 둘지 결정 필요.

## DEV-M3-T09 / Generic workspace surface placeholder 구현

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `S` |
| Area | `FE` |
| Screens | `SCR-02` |
| Objects | `topic`, `artifact` |
| Depends on | `DEV-M3-T01`, `DEV-M3-T02`, `DEV-M3-T05` |
| Blocks | `DEV-M3-T12` |
| Source docs | [workspace shell](../../common/navigation-and-cross-screen-flows.md#61-주제-작업실-공통-셸), [topics quick chat difference](../../screens/02-topics.md#610-빠른-채팅과-작업실-열기-차이) |

### 목적

아직 subtype별 화면이 없어도 workspace가 빈 화면처럼 보이지 않게 generic overview, timeline, artifact placeholder를 제공한다.

### 구현 범위

- `overview` surface: topic summary, next action, resource counts, recent activity.
- `artifact-placeholder` surface: 지원 예정 surface와 생성 CTA.
- `empty-workspace` state: 첫 artifact/source/task가 없는 topic 안내.
- unsupported subtype/surface fallback 화면.
- surface action CTA: `채팅으로 작업 시작`, `자료 연결`, `작업면 만들기` 후보.

### 제외 범위

- CTA가 실제 스크랩/파일/할 일 생성까지 완료하는 구현.
- subtype별 rich UI.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T09-S01` | Overview surface 구현 | `FE` | topic summary와 counts가 workspace 중앙에 표시됨 |
| `DEV-M3-T09-S02` | Empty workspace state 구현 | `FE` | 신규 topic에서 다음 액션 CTA가 표시됨 |
| `DEV-M3-T09-S03` | Unsupported surface fallback 구현 | `FE` | 미지원 surface 요청 시 이유와 fallback CTA가 표시됨 |
| `DEV-M3-T09-S04` | Surface CTA wiring | `FE` | CTA가 chat focus 또는 관련 placeholder route로 안전 연결됨 |

### Acceptance Criteria

- [ ] 신규 topic workspace가 빈 흰 화면이 아니라 overview/empty state를 보여줌.
- [ ] travel subtype이어도 travel 전용 구현 없이 generic placeholder가 표시됨.
- [ ] unsupported surface deep link에서 사용자가 다음 행동을 선택할 수 있음.
- [ ] CTA는 구현되지 않은 기능으로 무작정 이동하지 않고 사용 가능한 경로만 활성화됨.

### Test / Verification

- [ ] resource 없는 topic workspace 진입.
- [ ] resource/activity 있는 topic overview 표시.
- [ ] `surface=map`이 아직 미구현일 때 fallback 표시.
- [ ] read-only topic에서 생성 CTA 비활성 확인.

### Edge Cases

- resource count는 있는데 preview 조회가 실패함.
- next action이 삭제된 task를 가리킴.
- subtype 기본 surface가 미구현임.
- empty state CTA가 permission 때문에 모두 비활성임.

### Open Decisions

- `DEC-M3-17`: overview surface를 system surface로 고정할지 사용자가 숨길 수 있게 할지 결정 필요.
- `DEC-M3-18`: 빈 workspace에서 “자료 연결”을 M3에서 modal placeholder까지 만들지 M5로 넘길지 결정 필요.

## DEV-M3-T10 / Workspace 권한, 상태, fallback 처리

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `artifact`, `permissionState` |
| Depends on | `DEV-M3-T02`, `DEV-M3-T03`, `DEV-M3-T04` |
| Blocks | `DEV-M3-T12` |
| Source docs | [fallback policy](../../common/navigation-and-cross-screen-flows.md#132-fallback-정책), [permission propagation](../../common/domain-model-and-state-policy.md#6-관계와-권한-전파) |

### 목적

workspace의 삭제/보관/권한 없음/읽기 전용/연결 미비/비용 차단 상태를 명확히 분리해 사용자가 왜 막혔는지 알 수 있게 한다.

### 구현 범위

- topic status별 workspace 표시 정책: `active`, `archived`, `deleted`.
- permission state별 action enable/disable.
- connection warning과 cost warning 표시 slot.
- workspace bootstrap, chat, surface 각각의 loading/error 분리.
- read-only topic에서 쓰기 CTA 비활성.
- deleted/permission denied deep link fallback.

### 제외 범위

- 실제 connection/cost 계산 로직.
- 승인 카드 완성.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T10-S01` | Status별 rendering 정책 구현 | `FE` | active/archived/deleted 상태가 구분되어 표시됨 |
| `DEV-M3-T10-S02` | Permission action guard 구현 | `Fullstack` | read-only에서 chat write/surface write/action CTA가 정책대로 제한됨 |
| `DEV-M3-T10-S03` | Warning slot 연결 | `FE` | connection/cost warning이 header 또는 surface에 표시됨 |
| `DEV-M3-T10-S04` | Partial failure state 구현 | `FE` | bootstrap/chat/surface 실패가 독립적으로 표시됨 |

### Acceptance Criteria

- [ ] 권한 없음 topic deep link는 상위 topics fallback과 사유를 제공함.
- [ ] archived topic은 읽기 가능하되 쓰기성 액션이 제한됨.
- [ ] chat 실패가 surface 전체를 비우지 않음.
- [ ] surface 실패가 workspace chat 사용을 막지 않음.
- [ ] connection/cost warning이 사용자 조치 CTA와 함께 표시됨.

### Test / Verification

- [ ] `active`, `archived`, `deleted`, permission denied fixture별 workspace 진입.
- [ ] read-only fixture에서 chat/send/action disabled 정책 확인.
- [ ] bootstrap 성공 + chat 실패 fixture 확인.
- [ ] bootstrap 성공 + surface 실패 fixture 확인.
- [ ] warning badge/CTA 표시 확인.

### Edge Cases

- workspace 진입 후 권한이 축소됨.
- topic은 active지만 연결된 default artifact 권한이 없음.
- 비용 차단 상태에서 단순 읽기 chat을 허용할지 모호함.
- deleted topic의 activity/audit를 보여줄 수 있는지 모호함.

### Open Decisions

- `DEC-M3-19`: archived topic에서 topic chat read/send 중 어디까지 허용할지 결정 필요.
- `DEC-M3-20`: 비용 차단 상태에서 저비용 모델 fallback 제안을 M3에서 표시할지 결정 필요.

## DEV-M3-T11 / trip-plan reference-only 체크

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `XS` |
| Area | `Docs` |
| Screens | `SCR-02` |
| Objects | `topic`, `conversation`, `artifact` |
| Depends on | `None` |
| Blocks | `DEV-M3-T12` |
| Source docs | [trip-plan REBUILD_ARCHITECTURE.md](../../../../projects/apps/trip-plan/docs/REBUILD_ARCHITECTURE.md) |

### 목적

기존 trip-plan에서 workspace bridge에 참고할 수 있는 패턴만 추출하고, 신규 프로젝트에 복사하거나 직접 연결하지 않도록 guardrail을 남긴다.

### 구현 범위

- trip-plan의 참고 가능한 패턴 목록화: workspace scope, chat session scope, provider abstraction, operation 검증, checkpoint.
- M3 generic bridge에 즉시 반영할 패턴과 후속 subtype에서 반영할 패턴 분리.
- 복사/마이그레이션 금지 항목 명시.
- 신규 workspace subtype 예시로 travel을 나중에 다룰 때 필요한 후속 task 후보만 메모.

### 제외 범위

- trip-plan 코드 수정.
- trip-plan 데이터를 신규 프로젝트로 이전.
- 여행 workspace 구현.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T11-S01` | Reference 패턴 추출 | `Docs` | M3에 참고할 수 있는 패턴과 이유가 5개 이하로 정리됨 |
| `DEV-M3-T11-S02` | 금지 항목 정리 | `Docs` | 연결/복사/마이그레이션 금지 범위가 명시됨 |
| `DEV-M3-T11-S03` | Generic 설계 반영 여부 체크 | `Docs` | 각 패턴이 M3에 반영/보류/제외 중 하나로 분류됨 |

### Acceptance Criteria

- [ ] trip-plan은 reference-only로만 다뤄짐.
- [ ] M3 task 어디에도 기존 trip workspace 직접 연결/마이그레이션 작업이 없음.
- [ ] 참고 패턴은 generic workspace 설계 언어로 재서술됨.
- [ ] travel subtype 구현은 후속 milestone 후보로만 남음.

### Test / Verification

- [ ] M3 문서 전체에서 “trip-plan 연결/복사/마이그레이션” 태스크가 없는지 검색.
- [ ] reference check 결과가 구현 task의 의존성으로 과도하게 묶이지 않았는지 확인.
- [ ] trip-plan 문서에서 가져온 개념이 신규 객체명 `topic/conversation/artifact` 기준으로 변환됐는지 확인.

### Edge Cases

- 기존 trip-plan 구조가 좋아 보여서 신규 설계가 trip-specific으로 좁아짐.
- travel subtype을 M3에서 구현하려는 유혹이 생김.
- provider abstraction 같은 후속 범위가 M3에 과다 유입됨.

### Open Decisions

- `DEC-M3-21`: travel subtype을 어느 milestone에서 실제 구현할지 결정 필요.

## DEV-M3-T12 / M3 end-to-end 검증과 회귀 체크

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic`, `conversation`, `artifact`, `topic_activity` |
| Depends on | `DEV-M3-T07`, `DEV-M3-T08`, `DEV-M3-T09`, `DEV-M3-T10`, `DEV-M3-T11` |
| Blocks | `M4 Execution Core`, `M5 Knowledge Core` |
| Source docs | [M3 implementation plan](../../common/implementation-plan.md#6-m3--workspace-bridge), [common test matrix](../../common/implementation-plan.md#11-공통-테스트-matrix) |

### 목적

M3에서 만든 bridge가 개별 조각이 아니라 하나의 사용자 흐름으로 동작하는지 검증한다.

### 구현 범위

- 오늘/전역 chat -> topic 선택/생성 -> workspace 이동.
- topics 목록 -> workspace 이동 -> topic chat -> topics 복귀.
- workspace surface fallback과 activity 기록 확인.
- permission/read-only/deleted/archived 상태 검증.
- M4/M5가 붙을 수 있는 확장 지점 확인.

### 제외 범위

- 실제 agent run, schedule, scrap, file, report 기능 검증.
- subtype별 전용 UX 완성도 검증.

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M3-T12-S01` | E2E 시나리오 정의 | `QA` | 핵심 사용자 흐름 5개 이상이 체크리스트화됨 |
| `DEV-M3-T12-S02` | Fixture 정리 | `Fullstack` | active/archived/deleted/read-only/unknown subtype fixture가 준비됨 |
| `DEV-M3-T12-S03` | Manual 또는 자동 검증 수행 | `QA` | 각 흐름의 성공/실패 결과가 기록됨 |
| `DEV-M3-T12-S04` | 문서/계약 갱신 확인 | `Docs` | 변경된 route/object/status가 화면 계약과 공통 정책에 반영됨 |

### Acceptance Criteria

- [ ] 사용자가 전역 chat에서 시작해 workspace로 이동하고 topic chat으로 이어갈 수 있음.
- [ ] 사용자가 topics 목록에서 workspace를 열고 다시 목록으로 돌아올 수 있음.
- [ ] workspace message는 topic conversation에 저장되고 global conversation과 섞이지 않음.
- [ ] activity, lastOpenedAt, lastSurfaceKey가 기대대로 갱신됨.
- [ ] deleted/permission denied/unknown subtype/unsupported surface에서 안전 fallback이 동작함.
- [ ] M4/M5에서 task/run/source/document surface를 붙일 extension point가 확인됨.

### Test / Verification

- [ ] `global chat -> existing topic -> workspace -> topic chat`.
- [ ] `global chat -> new topic -> workspace -> back`.
- [ ] `topics filtered list -> workspace -> back`.
- [ ] `workspace unsupported surface -> overview fallback`.
- [ ] `read-only topic -> write CTA disabled`.
- [ ] `deleted topic deep link -> topics fallback`.
- [ ] `unknown subtype -> generic overview`.

### Edge Cases

- 여러 workspace를 빠르게 이동하며 stale bootstrap 응답이 뒤늦게 도착함.
- workspace message 전송 중 route가 바뀜.
- activity 기록은 성공했지만 UI cache가 갱신되지 않음.
- browser refresh 후 back context가 사라짐.
- M4/M5 기능이 붙으면서 surface key 충돌이 생김.

### Open Decisions

- `DEC-M3-22`: M3 완료 시 자동화 테스트를 어디까지 필수로 둘지 결정 필요.
- `DEC-M3-23`: route/query 계약 변경 시 screen-contracts를 milestone task 안에서 같이 갱신할지 별도 docs task로 분리할지 결정 필요.

## 7. M3 완료 조건

- [ ] `DEV-M3-T01`부터 `DEV-M3-T12`까지 모든 task의 Acceptance Criteria가 충족됨.
- [ ] `topic.type`, workspace route, surface key, topic conversation scope, activity type이 문서/코드에서 같은 이름으로 쓰임.
- [ ] 기존 trip-plan은 reference-only로만 다뤄졌고 직접 연결/복사/마이그레이션 작업이 없음.
- [ ] chat -> workspace -> chat 왕복이 global/topic scope를 섞지 않음.
- [ ] unsupported subtype/surface/deleted/read-only/archived/permission denied 상태가 안전하게 처리됨.
- [ ] M4의 task/run/schedule, M5의 source/file/document가 붙을 extension point가 확인됨.

## 8. M3 Open Decisions 요약

| ID | 결정 필요 |
| --- | --- |
| `DEC-M3-01` | MVP subtype 목록 범위 |
| `DEC-M3-02` | `artifact`와 `document`의 객체 경계 |
| `DEC-M3-03` | workspace chat panel 기본 위치 |
| `DEC-M3-04` | 내부 내비를 route segment로 둘지 query/state로 둘지 |
| `DEC-M3-05` | workspace open API의 side-effect 방식 |
| `DEC-M3-06` | bootstrap resources preview 개수 |
| `DEC-M3-07` | read-only topic의 chat 허용 범위 |
| `DEC-M3-08` | topic별 conversation 단일/복수 정책 |
| `DEC-M3-09` | non-document surface 저장 모델 |
| `DEC-M3-10` | overview surface의 서버/클라이언트 소유 |
| `DEC-M3-11` | activity 저장 실패 처리 |
| `DEC-M3-12` | workspace open activity 압축 정책 |
| `DEC-M3-13` | handoff 완료 후 global chat system message 여부 |
| `DEC-M3-14` | 한 message의 복수 topic 연결 허용 여부 |
| `DEC-M3-15` | 복귀 context 저장 방식 |
| `DEC-M3-16` | workspace back 버튼 기본 목적지 |
| `DEC-M3-17` | overview surface 숨김 가능 여부 |
| `DEC-M3-18` | empty workspace 자료 연결 CTA 범위 |
| `DEC-M3-19` | archived topic의 chat 허용 범위 |
| `DEC-M3-20` | 비용 차단 상태의 fallback 제안 범위 |
| `DEC-M3-21` | travel subtype 실제 구현 milestone |
| `DEC-M3-22` | M3 자동화 테스트 필수 범위 |
| `DEC-M3-23` | route/query 계약 변경 시 docs 갱신 task 분리 여부 |
