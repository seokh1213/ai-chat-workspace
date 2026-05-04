# Backend Blueprint

권장 스택:

- Kotlin
- Spring Boot
- Coroutines
- SQLite + Flyway
- SSE for browser streaming
- WebSocket client for Codex app-server

## Package Layout

```text
app.aichatworkspace
  workspace
  dataspace
  sourcerecord
  chat
  ai
  operation
  checkpoint
  domain
  common
```

## Generic Interfaces

### DomainAdapter

```kotlin
interface DomainAdapter {
    val type: String

    fun buildContext(dataSpaceId: String): DomainContext

    fun operationSchema(): Map<String, Any?>

    fun promptRules(): String

    fun validate(operation: DomainOperation, context: DomainContext): ValidationResult

    fun apply(dataSpaceId: String, operations: List<DomainOperation>): DomainApplyResult
}
```

### AiProvider

```kotlin
interface AiProvider {
    val id: String
    val displayName: String
    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent>
    fun cancel(runId: String): Boolean = false
}
```

### OperationEnvelope

AI가 직접 도메인 DB를 알 필요 없이 공통 envelope 안에 domain operations를 담는다.

```json
{
  "message": "사용자에게 보여줄 Markdown",
  "operations": [
    {
      "op": "domain.update_record",
      "recordId": "rec_123",
      "patch": {
        "title": "새 제목"
      }
    }
  ]
}
```

## ChatRunService 책임

- user message 저장
- provider session 조회/생성
- domain context 생성
- AI provider streaming 호출
- browser SSE event 발행
- tool block 파싱
- operation validator 호출
- checkpoint 생성
- operation applier 호출
- assistant message 저장
- run metadata 저장
- cancel 처리
- interrupted run 복구

## SSE Contract

브라우저와 bot adapter가 같은 이벤트 계약을 사용할 수 있게 한다.

```text
run.started
run.activity
assistant.message.delta
assistant.message.completed
operations.proposed
run.applied
run.completed
run.failed
run.cancelled
run.snapshot
```

## API Shape

```text
GET    /api/workspaces
POST   /api/workspaces
PATCH  /api/workspaces/{workspaceId}
DELETE /api/workspaces/{workspaceId}

GET    /api/data-spaces?workspaceId=
POST   /api/data-spaces
GET    /api/data-spaces/{dataSpaceId}/state
PATCH  /api/data-spaces/{dataSpaceId}
DELETE /api/data-spaces/{dataSpaceId}

GET    /api/data-spaces/{dataSpaceId}/chat-sessions
POST   /api/data-spaces/{dataSpaceId}/chat-sessions
GET    /api/chat-sessions/{sessionId}
PATCH  /api/chat-sessions/{sessionId}
DELETE /api/chat-sessions/{sessionId}

POST   /api/chat-sessions/{sessionId}/messages
GET    /api/chat-sessions/{sessionId}/events
POST   /api/chat-sessions/{sessionId}/cancel

POST   /api/checkpoints/{checkpointId}/rollback
GET    /api/ai/providers
```

## 피해야 할 결합

- `ChatRunService`가 여행, 지도, 일정 같은 도메인을 직접 알면 안 된다.
- `AiProvider`가 DB repository를 직접 호출하면 안 된다.
- prompt builder가 특정 domain adapter 없이 source_records를 임의로 해석하면 안 된다.
- browser가 provider credential을 알면 안 된다.

