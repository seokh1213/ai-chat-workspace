# Reusable Component Catalog

이 문서는 여러 프로젝트에 반복해서 가져갈 수 있는 모듈 목록이다.

## Frontend

| Component | Purpose | Source Example |
| --- | --- | --- |
| `ChatPanel` | active chat UI, composer, stream display | `examples/reusable/frontend/src/chat/ChatPanel.tsx` |
| `useChatStream` | EventSource/SSE lifecycle and streaming state | `examples/reusable/frontend/src/chat/useChatStream.ts` |
| `ChatMessageBubble` | message render, meta row, copy | `examples/reusable/frontend/src/chat/ChatMessageBubble.tsx` |
| `OperationPreviewList` | operation preview collapse/expand | `examples/reusable/frontend/src/chat/OperationPreviewList.tsx` |
| `MarkdownContent` | Markdown rendering | `examples/reusable/frontend/src/chat/markdown.tsx` |

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
| `ChatEventBroker` | SseEmitter registry and event publish | `examples/reusable/backend/.../chat/ChatEventBroker.kt` |
| `ChatRunService` | provider stream orchestration | `examples/reusable/backend/.../chat/ChatRunService.kt` |
| `ChatController` | REST/SSE endpoints | `examples/reusable/backend/.../chat/ChatController.kt` |
| `ChatDtos` | DTO contracts | `examples/reusable/backend/.../chat/ChatDtos.kt` |
| `AiProvider` | provider-neutral streaming contract | `examples/reusable/backend/.../ai/AiProvider.kt` |
| `ExampleAiProvider` | deterministic dev/test provider | `examples/reusable/backend/.../ai/ExampleAiProvider.kt` |
| `DomainAdapter` | domain boundary | `examples/reusable/backend/.../domain/DomainAdapter.kt` |

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
