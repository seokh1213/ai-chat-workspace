# Trip Plan Reuse Guide

## 목적

`projects/apps/trip-plan`에서 검증된 구현을 새 skeleton에 맞게 일반화하되, 여행 도메인 결합을 줄인다.

## 1단계: 재사용 후보

### Backend

- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/AiProvider.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerClient.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProvider.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/OpenAiStyleProviders.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/ToolBlockStreamFilter.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/AiProviderResponseParser.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatEventBroker.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatRunRegistry.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/common/ClockProvider.kt`
- `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/common/ApiExceptionHandler.kt`

단, package name은 바꾼다.

### Frontend

- `MarkdownContent`
- `OperationPreviewList`
- `ChatMessageBubble`
- `ChatPendingStatus`
- chat SSE event handling
- localStorage draft 저장
- scroll-to-latest behavior
- message/session markdown copy

## 2단계: 이름만 일반화할 것

| projects/apps/trip-plan | Generic |
| --- | --- |
| Trip | DataSpace |
| TripState | DataSpaceState |
| TripService | DataSpaceService |
| TripRepository | DataSpaceRepository |
| itinerary item | source record |
| place | catalog/source record |
| trip id | data space id |

## 3단계: 반드시 분리할 것

- `TripService.applyOperations`를 generic operation service와 domain adapter로 분리한다.
- `CodexPromptBuilder`에서 여행 규칙을 제거하고 domain adapter prompt rules를 주입한다.
- React `EditorScreen`에서 지도/일정/장소 UI를 `DomainViewSlot`으로 빼낸다.
- DB migration에서 `trips`, `places`, `itinerary_items`를 `data_spaces`, `source_records`, `domain_views` 중심으로 재정의한다.

## 4단계: 먼저 만들 화면

1. Workspace list
2. Data space list
3. Data space editor shell
4. Chat session list
5. Active chat view
6. Generic records list
7. Checkpoints list

지도, 캘린더, kanban은 그 다음이다.

## 5단계: 성공 기준

- 새 workspace 생성 가능
- 새 data space 생성 가능
- source record CRUD 가능
- 채팅 세션 여러 개 생성 가능
- SSE streaming 가능
- AI가 `domain.upsert_record` operation을 만들고 서버가 적용 가능
- checkpoint rollback 가능
- provider를 workspace 설정에서 바꿀 수 있음
