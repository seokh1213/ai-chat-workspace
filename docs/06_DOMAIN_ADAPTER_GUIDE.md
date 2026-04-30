# Domain Adapter Guide

## Domain Adapter란

generic core는 "채팅으로 데이터를 수정한다"만 안다. 실제 데이터의 의미는 domain adapter가 안다.

예시:

- 여행 계획
- CRM pipeline
- 콘텐츠 캘린더
- 연구 자료 보드
- 학습 계획

## 필수 구현

### 1. Domain State

AI에게 줄 읽기 전용 snapshot.

```json
{
  "dataSpace": {
    "id": "space_1",
    "type": "travel-plan",
    "title": "오키나와 여행"
  },
  "records": [],
  "views": []
}
```

### 2. Operation Schema

AI가 만들 수 있는 변경 명령.

```json
{
  "op": "domain.upsert_record",
  "record": {
    "type": "place",
    "title": "나미노우에 신사",
    "body": "나하 시내 신사",
    "metadata": {
      "lat": 26.2203,
      "lng": 127.6756
    }
  }
}
```

### 3. Prompt Rules

도메인별 규칙.

예시:

- 여행: 좌표가 필요한 장소는 lat/lng를 채운다.
- CRM: stage 변경은 allowed stage 안에서만 한다.
- 콘텐츠: publication date는 ISO date로 한다.

### 4. Validator

AI operation을 그대로 믿지 않는다.

검증 예시:

- id가 실제 존재하는가
- enum 값이 허용되는가
- 날짜 형식이 맞는가
- 사용자가 잠근 record를 수정하지 않는가
- 필수 metadata가 있는가

### 5. Applier

검증된 operation만 DB에 적용한다.

## Generic Operation 후보

```text
domain.set_title
domain.upsert_record
domain.update_record
domain.delete_record
domain.move_record
domain.reorder_records
domain.create_view
domain.update_view
domain.delete_view
chat.set_title
```

## 첫 번째 adapter 추천

처음에는 여행 adapter를 그대로 이식하지 말고, 더 추상적인 `research-board` adapter를 먼저 만든다.

이유:

- 지도/좌표/날짜 rail이 없어도 된다.
- source_records 중심 모델을 검증하기 쉽다.
- AI operation 적용 구조를 빠르게 확인할 수 있다.

그 다음 `travel-plan` adapter를 예제로 추가한다.

