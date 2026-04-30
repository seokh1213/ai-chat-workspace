# Domain Adapter Template

## Domain Name

`<domain-name>`

## Data Space Metadata

```json
{
  "type": "<domain-name>",
  "title": "",
  "metadata": {}
}
```

## Source Record Types

| type | required fields | metadata |
| --- | --- | --- |
| item | title, body | {} |

## Views

| view type | description |
| --- | --- |
| list | 기본 목록 |

## Prompt Rules

- 사용자에게 보이는 답변은 한국어 Markdown으로 작성한다.
- 수정이 필요한 경우 `<tool>` 블록에 operations를 넣는다.
- 불확실한 변경은 operation으로 만들지 않는다.

## Operations

```json
{
  "op": "domain.upsert_record",
  "record": {
    "type": "item",
    "title": "제목",
    "body": "본문",
    "metadata": {}
  }
}
```

```json
{
  "op": "domain.update_record",
  "recordId": "rec_x",
  "patch": {
    "title": "새 제목"
  }
}
```

```json
{
  "op": "domain.delete_record",
  "recordId": "rec_x"
}
```

## Validation Rules

- 존재하지 않는 record id를 수정하지 않는다.
- required field가 없으면 reject한다.
- metadata schema를 검증한다.

