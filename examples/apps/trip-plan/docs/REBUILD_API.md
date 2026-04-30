# Rebuild API Contract

Base path: `/api`

All JSON responses use UTF-8. Errors use:

```json
{
  "error": "short_error_code",
  "message": "human readable message"
}
```

## Workspaces

### GET /workspaces

Returns available workspaces.

### POST /workspaces

```json
{
  "name": "개인 여행"
}
```

## Trips

### GET /workspaces/{workspaceId}/trips

Returns trip list.

### POST /workspaces/{workspaceId}/trips

```json
{
  "title": "오키나와 여행",
  "destinationName": "Okinawa",
  "startDate": "2026-05-05",
  "endDate": "2026-05-08",
  "timezone": "Asia/Tokyo"
}
```

### GET /trips/{tripId}/state

Returns a full trip planning state.

```json
{
  "trip": {},
  "days": [],
  "places": [],
  "itineraryItems": [],
  "latestCheckpoint": null
}
```

## Operations

### POST /trips/{tripId}/operations

Applies validated operations transactionally and creates a checkpoint.

```json
{
  "reason": "Move aquarium before snorkeling",
  "source": "ui",
  "operations": [
    {
      "op": "move_item",
      "itemId": "item_123",
      "toDay": 2,
      "toIndex": 1
    }
  ]
}
```

Response:

```json
{
  "state": {},
  "checkpoint": {
    "id": "cp_123",
    "createdAt": "2026-04-28T09:00:00Z"
  }
}
```

## Checkpoints

### GET /trips/{tripId}/checkpoints

Returns recent checkpoints.

### POST /checkpoints/{checkpointId}/rollback

Rolls back to the `before_state_json` of the checkpoint and creates a new rollback checkpoint.

## Chat Sessions

### GET /trips/{tripId}/chat-sessions

Returns chat sessions for a trip.

### POST /trips/{tripId}/chat-sessions

```json
{
  "title": "북부 동선 상담",
  "provider": "codex-app-server",
  "model": "gpt-5.4-mini"
}
```

### GET /chat-sessions/{sessionId}

Returns session detail and messages.

### POST /chat-sessions/{sessionId}/messages

Creates a user message and starts AI processing.

```json
{
  "content": "Day 2 동선을 북부 중심으로 정리해줘"
}
```

Response:

```json
{
  "userMessage": {"id": "msg_user_123", "role": "user"},
  "assistantMessage": {"id": "msg_assistant_123", "role": "assistant"},
  "tripState": {"trip": {"id": "trip_123"}},
  "checkpoint": {"id": "checkpoint_123"},
  "editRun": {"id": "run_123", "status": "applied", "operationCount": 1}
}
```

### POST /chat-sessions/{sessionId}/runs/current/cancel

Marks the currently running AI response as cancelled. The browser may also abort the HTTP request; the backend uses this marker to avoid applying late AI operations.

```json
{
  "runId": "run_123",
  "cancelled": true,
  "message": "응답 생성을 중지했습니다. 변경 사항은 적용하지 않습니다."
}
```

### GET /chat-sessions/{sessionId}/edit-runs

Returns persisted AI edit run summaries for one chat session.

### GET /chat-sessions/{sessionId}/events

SSE stream for chat progress.

Event examples:

```text
event: run.started
data: {"runId":"run_123"}

event: assistant.message.delta
data: {"runId":"run_123","delta":"Day 2를 "}

event: assistant.message.completed
data: {"runId":"run_123","content":"Day 2를 북부 중심으로 정리합니다."}

event: operations.proposed
data: {"runId":"run_123","operationCount":2}

event: run.applied
data: {"id":"run_123","checkpointId":"checkpoint_123","operationCount":2}

event: run.cancelled
data: {"runId":"run_123","status":"cancelled"}

event: run.failed
data: {"id":"run_123","status":"failed","error":"..."}
```

## Import and Seed

No public import endpoint is part of the initial backend contract.

Initial data is applied from separate SQL seed files through a development-only runner or CLI command. Current Okinawa data should remain outside the generic app codebase unless explicitly converted into local-only SQL.

## Frontend Client Strategy

- Use REST for snapshot state.
- Use SSE for chat/run progress.
- Do not connect browser directly to Codex app-server or external AI APIs.
- Use localStorage only for layout preferences and last map viewport.

## Provider Strategy

The public API is provider-neutral. `provider` is a server-side routing key, not a browser protocol.

### GET /ai/providers

Returns user-facing AI availability. Chat sessions inherit the workspace provider/model/settings.

```json
[
  {
    "id": "codex-app-server",
    "displayName": "Codex app-server",
    "available": true,
    "status": "ready",
    "detail": "healthz 200"
  }
]
```

Workspace provider ids:

- `codex-app-server`
- `openai-compatible`
- `openrouter`

All provider output is normalized by the backend into the same SSE event names. This keeps the React chat UI identical whether the source is local Codex app-server or an external API streaming endpoint.
