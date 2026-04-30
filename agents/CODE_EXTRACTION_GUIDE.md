# Code Extraction Guide

원본 프로젝트에서 새 skeleton으로 코드를 가져올 때의 기준이다.

## 원본 경로

```text
/Users/user/personal/여행/오키나와/trip-planner
```

## 그대로 복사 가능한 파일군

### AI Provider

```text
backend/src/main/kotlin/app/tripplanner/ai/AiProvider.kt
backend/src/main/kotlin/app/tripplanner/ai/AiProviderResponseParser.kt
backend/src/main/kotlin/app/tripplanner/ai/ToolBlockStreamFilter.kt
backend/src/main/kotlin/app/tripplanner/ai/JsonMessageFieldDeltaExtractor.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerClient.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProvider.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProtocol.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProperties.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerProcessManager.kt
backend/src/main/kotlin/app/tripplanner/ai/CodexAppServerTurnRegistry.kt
backend/src/main/kotlin/app/tripplanner/ai/OpenAiStyleProviders.kt
```

수정 필요:

- package name
- `TripStateDto` 의존성 제거
- `AiChatRequest`를 generic `DataSpaceContext` 기반으로 변경
- Codex prompt builder 주입 방식을 domain adapter 기반으로 변경

### Chat

```text
backend/src/main/kotlin/app/tripplanner/chat/ChatEventBroker.kt
backend/src/main/kotlin/app/tripplanner/chat/ChatRunRegistry.kt
backend/src/main/kotlin/app/tripplanner/chat/ChatRunMapping.kt
backend/src/main/kotlin/app/tripplanner/chat/ChatRunService.kt
```

수정 필요:

- `tripId`를 `dataSpaceId`로 변경
- `TripService.applyOperations` 의존성을 `DomainOperationService`로 변경
- DTO 이름 변경

### Frontend

`frontend/src/App.tsx`에서 한 번에 복사하지 말고 아래 단위로 쪼갠다.

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

## 복사하지 말 것

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

