# Rebuild AI Operations

AI editing is patch-based. AI never writes the database directly.

## Response Contract

AI must return JSON only.

```json
{
  "message": "사용자에게 보여줄 한국어 응답",
  "operations": []
}
```

`message` is always displayed in chat. `operations` is optional and applied only after backend validation.

## Operation Envelope

All operations are evaluated against the current trip state inside a single transaction.

If one operation fails, no operation is committed.

## Supported Operations

### add_item

Adds a new itinerary item.

```json
{
  "op": "add_item",
  "day": 2,
  "afterItemId": "item_123",
  "item": {
    "type": "poi",
    "title": "코우리대교",
    "category": "관광명소",
    "time": "15:30",
    "memo": "드라이브 후보",
    "placeId": "place_123",
    "lat": 26.696,
    "lng": 128.018
  }
}
```

Rules:

- Prefer `placeId` when adding from known places.
- Coordinates must come from known places or provided context.
- If `afterItemId` is missing, append to the day.

### update_item

Updates allowed fields.

```json
{
  "op": "update_item",
  "itemId": "item_123",
  "patch": {
    "time": "10:00",
    "memo": "오픈 시간 맞춰 방문"
  }
}
```

Allowed patch fields:

- `type`
- `title`
- `category`
- `time`
- `durationMinutes`
- `memo`
- `placeId`
- `lat`
- `lng`
- `locked`

### move_item

Moves an item to a day and index.

```json
{
  "op": "move_item",
  "itemId": "item_123",
  "toDay": 2,
  "toIndex": 3
}
```

### delete_item

Deletes an itinerary item.

```json
{
  "op": "delete_item",
  "itemId": "item_123"
}
```

### reorder_day

Reorders known items in a day. Missing items are appended in their previous order.

```json
{
  "op": "reorder_day",
  "day": 2,
  "itemIds": ["item_a", "item_b", "item_c"]
}
```

### replace_day_plan

Replaces a full day plan.

```json
{
  "op": "replace_day_plan",
  "day": 2,
  "items": []
}
```

This should be used only when the user asks for broad restructuring.

## Validation Rules

- Unknown operation names are rejected.
- Unknown item ids are rejected.
- Unknown day numbers are rejected.
- Locked items cannot be moved, updated, or deleted unless user explicitly asks to unlock them.
- Coordinates must be valid numbers.
- Coordinates must fit the trip bounds when bounds are configured.
- Operation batch size is capped.
- `replace_day_plan` cannot silently remove locked items.

## Checkpoint Rules

Backend creates one checkpoint per successful operation batch.

Checkpoint stores:

- `before_state_json`
- `after_state_json`
- `operations_json`
- `source`
- `reason`

Rollback creates another checkpoint with source `rollback`.

## AI Prompt Requirements

The server prompt must include:

- current trip metadata
- all days
- all itinerary items with ids
- all known places with ids and coordinates
- current selected day
- operation schema
- instruction that AI must not invent coordinates
- instruction that output must be JSON only

## UI Behavior

- User sends message.
- Chat shows pending state.
- Backend creates user message.
- SSE emits progress.
- Assistant message appears.
- If operations are applied, map and sidebar refresh.
- Rollback button appears through checkpoint history.

## Failure Behavior

If AI returns invalid JSON:

- Save assistant raw response as message.
- Do not apply operations.
- Mark `ai_edit_runs.status = failed`.

If operation validation fails:

- Save assistant message.
- Save failed run with error.
- Do not mutate plan.
- Show concise failure reason in chat.
