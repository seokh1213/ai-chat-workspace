# Reusable Component Catalog

이 문서는 여러 프로젝트에 반복해서 가져갈 수 있는 모듈 목록이다.

## Frontend

| Component | Purpose | Source Example |
| --- | --- | --- |
| `ChatPanel` | active chat UI, composer, stream display | `examples/frontend/src/chat/ChatPanel.tsx` |
| `useChatStream` | EventSource/SSE lifecycle and streaming state | `examples/frontend/src/chat/useChatStream.ts` |
| `ChatMessageBubble` | message render, meta row, copy | `examples/frontend/src/chat/ChatMessageBubble.tsx` |
| `OperationPreviewList` | operation preview collapse/expand | `examples/frontend/src/chat/OperationPreviewList.tsx` |
| `MarkdownContent` | Markdown rendering | `examples/frontend/src/chat/markdown.tsx` |

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
| `ChatEventBroker` | SseEmitter registry and event publish | `examples/backend/.../chat/ChatEventBroker.kt` |
| `ChatRunService` | provider stream orchestration | `examples/backend/.../chat/ChatRunService.kt` |
| `ChatController` | REST/SSE endpoints | `examples/backend/.../chat/ChatController.kt` |
| `ChatDtos` | DTO contracts | `examples/backend/.../chat/ChatDtos.kt` |
| `AiProvider` | provider-neutral streaming contract | `examples/backend/.../ai/AiProvider.kt` |
| `ExampleAiProvider` | deterministic dev/test provider | `examples/backend/.../ai/ExampleAiProvider.kt` |
| `DomainAdapter` | domain boundary | `examples/backend/.../domain/DomainAdapter.kt` |

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

