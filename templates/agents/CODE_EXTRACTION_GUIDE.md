# Reusable Code Guide

새 skeleton에서 재사용할 구현 단위를 고를 때의 기준이다.

## 재사용 후보 파일군

### AI Provider

```text
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/AiProvider.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/AiProviderResponseParser.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/ToolBlockStreamFilter.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/JsonMessageFieldDeltaExtractor.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerClient.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProvider.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProtocol.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProperties.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProcessManager.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerTurnRegistry.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/OpenAiStyleProviders.kt
```

수정 필요:

- package name
- `TripStateDto` 의존성 제거
- `AiChatRequest`를 generic `DataSpaceContext` 기반으로 변경
- Codex prompt builder 주입 방식을 domain adapter 기반으로 변경

### Chat

```text
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatEventBroker.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatRunRegistry.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatRunMapping.kt
projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatRunService.kt
```

수정 필요:

- `tripId`를 `dataSpaceId`로 변경
- `TripService.applyOperations` 의존성을 `DomainOperationService`로 변경
- DTO 이름 변경

### Frontend

`projects/apps/trip-plan/frontend/src/App.tsx`에서 한 번에 옮기지 말고 아래 단위로 쪼갠다.

- MarkdownContent
- ChatMessageBubble
- OperationPreviewList
- ChatPendingStatus
- ChatHome
- ActiveChatHeader
- ChatComposer
- ProviderStatusCard
- WorkspaceSettingsDialog
- buildChatSessionMarkdown
- writeClipboardText
- SSE event handling hook
- scroll-to-latest hook

## 도메인별로 별도 설계할 것

- MapCanvas
- TripMetaForm
- ItemForm
- PlaceForm
- 여행 day rail
- 좌표/지도 popup 로직
- 오키나와 seed

## 새로 설계할 것

- `DataSpaceService`
- `SourceRecordService`
- `DomainAdapterRegistry`
- `DomainOperationService`
- `GenericRecordsAdapter`
