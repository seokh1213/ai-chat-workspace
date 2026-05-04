# Project Brief

## 한 문장 정의

사용자가 가진 원천 데이터를 AI와 대화하며 이해, 수정, 확장하고, 변경 내역을 검증 가능한 operation과 checkpoint로 관리하는 범용 작업실.

## 핵심 사용자 경험

1. 사용자는 워크스페이스를 만든다.
2. 워크스페이스 안에 데이터 공간을 만든다.
3. 데이터 공간에는 도메인별 원천 데이터가 있다.
4. 사용자는 채팅 세션을 열어 AI에게 데이터 수정, 정리, 추천, 보강을 요청한다.
5. AI 응답은 Markdown으로 보이고, 동시에 숨김 operation으로 구조화된다.
6. 서버는 operation을 검증하고 DB에 반영한다.
7. 반영 전후 상태는 checkpoint로 남는다.
8. 마음에 들지 않으면 롤백한다.

## `projects/apps/trip-plan`에서 일반화할 개념

| projects/apps/trip-plan | Generic Skeleton |
| --- | --- |
| trip | data_space |
| trip_days | domain_views 또는 domain_sections |
| itinerary_items | source_records 또는 domain_nodes |
| places | source_records/catalog_records |
| AI 일정 편집 | AI data editing |
| 지도 | domain-specific view |
| 여행 생성 상담 | data space setup assistant |

## 유지할 UX 자산

- 세션 목록과 세션별 URL
- 세션 제목 수정/삭제/복사
- 메시지별 Markdown 복사
- Markdown 렌더링
- streaming 중 자동 스크롤 제어
- `Enter` 전송, `Shift/Option+Enter` 줄바꿈
- provider 상태 표시
- AI 변경 미리보기 접기/펼치기
- 체크포인트/롤백

## 의도적으로 분리할 것

- 지도
- 일정 날짜 rail
- 장소/좌표
- 여행 특화 prompt
- 여행 특화 operation schema

이들은 generic core가 아니라 `travel-domain-adapter`의 예시로 남긴다.
