# Customization Checklist

새 프로젝트를 시작할 때 이 체크리스트를 채운다.

## Product

- [ ] 제품 이름:
- [ ] 대상 사용자:
- [ ] 사용자가 AI와 편집할 원천 데이터:
- [ ] 원천 데이터가 들어오는 방식:
- [ ] 가장 중요한 화면:
- [ ] 외부 채팅앱 연동 필요 여부:

## Domain

- [ ] `data_space.type`:
- [ ] 주요 `source_record.type`:
- [ ] 필요한 view:
- [ ] record sort/grouping 기준:
- [ ] 삭제/수정 제한 규칙:
- [ ] checkpoint가 필요한 변경:

## AI Operations

- [ ] create/upsert operation:
- [ ] update operation:
- [ ] delete operation:
- [ ] reorder/move operation:
- [ ] title/session operation:
- [ ] operation preview 문구:
- [ ] operation validation failure UX:

## Provider

- [ ] 기본 provider:
- [ ] local dev provider:
- [ ] production provider:
- [ ] model setting 노출 여부:
- [ ] reasoning effort 노출 여부:
- [ ] provider status에 표시할 check:

## Frontend

- [ ] workspace list 필요:
- [ ] data space list card layout:
- [ ] editor shell columns:
- [ ] domain sidebar:
- [ ] domain primary view:
- [ ] chat panel width:
- [ ] mobile behavior:

## Backend

- [ ] DB: SQLite or PostgreSQL
- [ ] auth 필요 여부:
- [ ] user/workspace 권한 모델:
- [ ] file upload 필요 여부:
- [ ] background job 필요 여부:
- [ ] bot adapter 필요 여부:

## Done Criteria

- [ ] AI 응답 streaming
- [ ] Markdown 렌더링
- [ ] operation 적용
- [ ] checkpoint rollback
- [ ] 세션 복사
- [ ] 메시지 복사
- [ ] provider 설정
- [ ] 기본 테스트

