# AI Editing Architecture

AI는 DB를 직접 수정하지 않는다. AI는 사용자에게 보여줄 메시지와 구조화된 operations만 반환하고, 서버가 검증한 뒤 SQLite에 적용한다.

## Data Ownership

- SQLite가 여행 계획의 기준 상태를 보관한다.
- `places`는 조사 장소 catalog다.
- `plan_items`는 일정 노드다.
- 일정 노드는 `place_id`로 조사 장소를 참조할 수 있지만, 직접 좌표와 메모도 가진다.
- 적용 전후 상태는 `checkpoints`에 저장한다.
- AI 실행 기록은 `ai_edit_runs`에 저장한다.

## Plan Item Shape

```json
{
  "id": "250519726",
  "day": 1,
  "type": "poi",
  "title": "나하 공항",
  "category": "관광명소",
  "time": "12:05",
  "memo": "",
  "placeId": null,
  "lat": 26.2001297,
  "lng": 127.6466452,
  "locked": false
}
```

## AI Response Shape

```json
{
  "message": "Day 2는 북부 동선이 길어 츄라우미와 고릴라 촙 순서를 조정하는 편이 좋습니다.",
  "operations": [
    {
      "op": "move_item",
      "itemId": "254492319",
      "toDay": 2,
      "toIndex": 2
    },
    {
      "op": "update_item",
      "itemId": "254492319",
      "patch": {
        "time": "14:30",
        "memo": "츄라우미 관람 후 이동. 샤워 가능 시간 확인 필요."
      }
    }
  ]
}
```

## Supported Operations

### add_item

```json
{
  "op": "add_item",
  "day": 2,
  "afterItemId": "253662622",
  "item": {
    "type": "poi",
    "title": "코우리대교",
    "category": "관광명소",
    "time": "",
    "memo": "드라이브 후보",
    "placeId": "g20",
    "lat": 26.696,
    "lng": 128.018
  }
}
```

### update_item

```json
{
  "op": "update_item",
  "itemId": "253662622",
  "patch": {
    "time": "10:00",
    "memo": "오픈 시간 맞춰 방문"
  }
}
```

### move_item

```json
{
  "op": "move_item",
  "itemId": "253662622",
  "toDay": 2,
  "toIndex": 1
}
```

### delete_item

```json
{
  "op": "delete_item",
  "itemId": "253662622"
}
```

### reorder_day

```json
{
  "op": "reorder_day",
  "day": 2,
  "itemIds": ["252928256", "253662622", "254492319"]
}
```

### replace_day_plan

```json
{
  "op": "replace_day_plan",
  "day": 2,
  "items": [
    {
      "type": "poi",
      "title": "BEB5 오키나와 세라가키 바이 호시노 리조트",
      "lat": 26.50338,
      "lng": 127.862488
    }
  ]
}
```

## Checkpoint Flow

1. 서버가 현재 plan을 `beforePlan`으로 읽는다.
2. operations를 JS plan 객체에 적용한다.
3. 서버가 검증한다.
4. SQLite에 새 plan을 저장한다.
5. `beforePlan`, `afterPlan`, `operations`를 checkpoint로 저장한다.
6. 사용자가 롤백하면 checkpoint의 `beforePlan`을 다시 저장한다.

## API

- `GET /api/state`: 현재 plan과 places를 반환한다.
- `POST /api/operations`: 검증된 operations를 적용하고 checkpoint를 만든다.
- `GET /api/checkpoints`: 최근 checkpoint 목록을 반환한다.
- `POST /api/checkpoints/:id/rollback`: 해당 checkpoint의 이전 상태로 되돌린다.
