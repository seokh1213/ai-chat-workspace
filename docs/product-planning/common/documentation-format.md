# 문서 표준 / Documentation Format

이 문서는 이후 새 화면이나 기능을 기획할 때 사용하는 공통 포맷이다. 목적은 사람이 읽기 좋은 서술보다 LLM이 구현 범위, 객체, 상태, API, edge case를 빠르게 추출할 수 있게 만드는 것이다.

## 1. 문서 계층

| 계층 | 파일 | 역할 |
| --- | --- | --- |
| Entry | [../README.md](../README.md) | 어떤 문서를 읽을지 결정 |
| Contract | [../screen-contracts.md](../screen-contracts.md) | 화면 ID, route, 객체, entry/exit, read/write 최소 계약 |
| Common policy | [navigation-and-cross-screen-flows.md](navigation-and-cross-screen-flows.md), [domain-model-and-state-policy.md](domain-model-and-state-policy.md) | 공통 동선, 객체, 상태, 권한, 비용, API |
| Leaf spec | `../screens/*.md` | 화면별 상세 원문 |
| Asset | `../../assets/agent-platform-prd/*.png` | 시각 레퍼런스 |

상위 문서는 색인/계약이고, leaf spec은 상세 원문이다. leaf spec의 내용을 상위 문서에 대량 병합하지 않는다.

## 2. 새 화면 문서 파일명

| 유형 | 규칙 | 예시 |
| --- | --- | --- |
| 사이드 메뉴 화면 | `NN-menu-name.md` | `16-billing.md` |
| 하위 고급 화면 | `NN-parent-feature.md` | `17-agent-run-debugger.md` |
| 공통 정책 | `common/<policy-name>.md` | `common/realtime-event-policy.md` |

화면 ID는 `SCR-XX`를 사용한다. 파일명 번호와 화면 ID는 가능하면 맞춘다.

## 3. 권장 Front Matter

기존 문서는 front matter 없이도 유효하다. 새 문서나 큰 보강부터는 아래 형식을 권장한다.

```yaml
---
screen_id: "SCR-16"
title: "Billing"
route: "/billing"
status: "draft"
primary_objects: ["usage_limit", "invoice", "payment_method"]
depends_on: ["SCR-11"]
source_assets: ["../../assets/agent-platform-prd/real-11-settings.png"]
last_reviewed: "2026-06-02"
---
```

## 4. 필수 섹션

| 순서 | 섹션 | 작성 기준 |
| --- | --- | --- |
| 1 | 화면 목적 | 이 화면이 해결하는 사용자 문제와 플랫폼 내 역할 |
| 2 | 범위와 전제 | 이 화면에서 하는 것/하지 않는 것, 선행 연결/권한/데이터 |
| 3 | 정보 구조 | 좌/중앙/우측 패널, 탭, 주요 리스트/카드/상세 패널 |
| 4 | 진입/종료/전환 동선 | entry points, exits, 화면 내 전환, deep link/fallback |
| 5 | 핵심 시나리오 | happy path를 3~7개 정도로 분리 |
| 6 | 컴포넌트별 기능 | 각 컴포넌트가 읽고 쓰는 데이터와 액션 |
| 7 | 상태와 edge case | empty/loading/error/permission/approval/cost/concurrency |
| 8 | 다른 화면과의 연계 | 관련 `SCR-XX`와 어떤 객체 relation으로 연결되는지 |
| 9 | 데이터 필드/API 힌트 | 주요 객체, query/mutation/event 후보 |
| 10 | 수용 기준 | 구현 완료 판단 기준 |
| 11 | 오픈 질문 | 아직 결정 안 된 정책, UX, 기술 제약 |

## 5. 화면 계약 갱신 기준

아래 항목 중 하나라도 바뀌면 [../screen-contracts.md](../screen-contracts.md)를 같이 갱신한다.

| 변경 | 갱신할 필드 |
| --- | --- |
| route 변경 | `Route` |
| 새 canonical 객체 추가 | `Primary objects`, `Reads`, `Writes` |
| 다른 화면으로 나가는 동선 추가 | `Exits`, `Cross-Screen 핵심 링크` |
| 외부 연결/권한/비용 정책 변경 | `High-risk edges` |
| 완료 기준 변경 | `Acceptance summary` |

## 6. 공통 정책 갱신 기준

| 변경 | 갱신 대상 |
| --- | --- |
| 새 객체/상태/enum 추가 | [domain-model-and-state-policy.md](domain-model-and-state-policy.md) |
| 채팅 scope나 workspace 전환 변경 | [navigation-and-cross-screen-flows.md](navigation-and-cross-screen-flows.md) |
| 승인/비용/권한 공통 UX 변경 | [navigation-and-cross-screen-flows.md](navigation-and-cross-screen-flows.md), [domain-model-and-state-policy.md](domain-model-and-state-policy.md) |
| API 공통 규칙 변경 | [domain-model-and-state-policy.md](domain-model-and-state-policy.md) |
| 개발 milestone 변경 | [implementation-plan.md](implementation-plan.md) |

## 7. LLM 친화 작성 규칙

| 규칙 | 이유 |
| --- | --- |
| 객체명은 canonical 이름 사용 | `source`, `memory`, `file_asset` 혼동 방지 |
| route와 screen ID를 반복 표기 | 검색과 작업 범위 고정 |
| read/write를 분리 | API 설계와 권한 검토가 쉬움 |
| 상태 enum은 공통 정책 링크 | 화면별 상태명 난립 방지 |
| edge case를 별도 표로 작성 | 구현 누락 방지 |
| 수용 기준은 검증 가능한 문장 | 테스트/리뷰 기준으로 사용 |
| 오픈 질문은 결정 전제로 쓰지 않음 | LLM 환각 방지 |
| 이미지 텍스트는 보조 근거로만 사용 | 이미지 오타/가독성 문제로 구현 기준이 흔들리지 않게 함 |

## 8. 링크 규칙

| 링크 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 같은 폴더 문서 | 상대 경로 | `[화면 계약](../screen-contracts.md)` |
| 화면 상세 | `../screens/<file>.md` | `[설정 상세](../screens/11-settings.md)` |
| 공통 정책 | 파일명 직접 링크 | `[공통 객체](domain-model-and-state-policy.md)` |
| 이미지 | PNG만 링크 | `../../assets/agent-platform-prd/real-11-settings.png` |
| 화면 참조 | `SCR-XX` + 링크 병기 | `SCR-11 / [설정](../screens/11-settings.md)` |

이미지나 문서 링크가 바뀌면 `rg`로 전체 참조를 확인한다.

## 9. 문서 갱신 순서

1. 변경 대상 leaf spec을 수정한다.
2. route/object/read/write/entry/exit가 바뀌었는지 확인한다.
3. 바뀌었으면 [../screen-contracts.md](../screen-contracts.md)를 갱신한다.
4. 공통 객체/상태/권한/비용/승인에 영향이 있으면 common 정책을 갱신한다.
5. milestone 영향이 있으면 [implementation-plan.md](implementation-plan.md)를 갱신한다.
6. 링크와 이미지 참조를 검증한다.

## 10. PRD 보강 템플릿

```markdown
# NN. 화면명 / English Name 화면 상세 기획

## 1. 화면 목적

## 2. 화면 범위와 전제

## 3. 정보 구조

## 4. 진입 / 종료 / 전환 동선

## 5. 핵심 시나리오

## 6. 컴포넌트별 상세 기능

## 7. 상태 / 빈 상태 / 로딩 / 에러 / 권한 / 승인 / 비용 Edge Case

## 8. 다른 화면과의 연계

## 9. 데이터 필드 / API 힌트

## 10. 수용 기준

## 11. 오픈 질문
```

## 11. 다음 AI 작업 지시 템플릿

```text
목표: <SCR-XX 화면 또는 공통 기능> 구현/보강.

읽을 문서:
- docs/product-planning/README.md
- docs/product-planning/screen-contracts.md
- docs/product-planning/common/navigation-and-cross-screen-flows.md
- docs/product-planning/common/domain-model-and-state-policy.md
- docs/product-planning/screens/<대상 화면>.md

반드시 보고할 것:
- 수정 대상 파일과 이유
- read/write 데이터 흐름
- permission/cost/approval 영향
- edge case와 테스트
- 화면 계약 또는 공통 정책 갱신 필요 여부
```
