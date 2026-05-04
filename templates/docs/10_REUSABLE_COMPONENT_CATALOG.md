# Reusable Component Catalog

이 문서는 여러 프로젝트에 반복해서 가져갈 수 있는 모듈 목록이다.

## Frontend

| Component | Purpose | Source Example |
| --- | --- | --- |
| `ChatPanel` | active chat UI, composer, stream display | `projects/reusable/frontend/src/chat/ChatPanel.tsx` |
| `useChatStream` | EventSource/SSE lifecycle and streaming state | `projects/reusable/frontend/src/chat/useChatStream.ts` |
| `ChatMessageBubble` | message render, meta row, copy | `projects/reusable/frontend/src/chat/ChatMessageBubble.tsx` |
| `OperationPreviewList` | operation preview collapse/expand | `projects/reusable/frontend/src/chat/OperationPreviewList.tsx` |
| `MarkdownContent` | Markdown rendering | `projects/reusable/frontend/src/chat/markdown.tsx` |

## Frontend Behaviors

- streaming delta pump
- scroll-to-latest guard
- message copy as body-only Markdown
- full session export as structured Markdown
- Enter send / Shift+Enter newline
- local draft storage per `dataSpaceId + chatSessionId`

## Backend

| Class | Purpose | Source Example |
| --- | --- | --- |
| `ChatEventBroker` | SseEmitter registry and event publish | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatEventBroker.kt` |
| `ChatRunService` | provider stream orchestration | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatRunService.kt` |
| `ChatController` | REST/SSE endpoints | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatController.kt` |
| `ChatDtos` | DTO contracts | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/chat/ChatDtos.kt` |
| `AiProvider` | provider-neutral streaming contract | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/AiProvider.kt` |
| `LocalRuleAiProvider` | deterministic dev/test provider | `projects/apps/trip-plan/backend/src/main/kotlin/app/tripplanner/ai/LocalRuleAiProvider.kt` |

## Required Project-Specific Pieces

Each new project must define:

- data space type
- source record types
- domain views
- operation schema
- validation rules
- prompt rules
- seed/import path
- UI domain view
