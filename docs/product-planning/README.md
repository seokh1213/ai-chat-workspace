# Personal Agent Platform Planning Index

이 디렉터리는 개인형 Agent 플랫폼 기획을 LLM이 구현 작업에 바로 사용할 수 있게 재구성한 문서 세트다. 핵심은 긴 PRD를 통째로 읽는 방식이 아니라, `화면 계약 -> 공통 정책 -> 대상 화면 상세` 순서로 필요한 범위만 좁혀 읽는 구조다.

## 1. Source of Truth

| 우선순위 | 문서 | 역할 |
| --- | --- | --- |
| 1 | [화면 계약](screen-contracts.md) | 화면 ID, route, 주요 객체, 읽기/쓰기 대상, 화면 간 출입구를 정의하는 최소 계약 |
| 2 | [공통 동선 정책](common/navigation-and-cross-screen-flows.md) | chat-first, workspace 전환, CRUD, 승인, 권한, deep link, fallback 정책 |
| 3 | [공통 객체/상태/API 정책](common/domain-model-and-state-policy.md) | canonical 객체명, 상태 enum, ID/key, rollback, 삭제/보관, API 기준 |
| 4 | [대상 화면 상세 문서](screens/01-today-control-tower.md) | 화면별 레이아웃, 동선, edge case, 수용 기준 원문 |
| 5 | [구현 순서](common/implementation-plan.md) | 여러 화면을 묶어 개발할 때의 dependency와 milestone |
| 6 | [문서 표준](common/documentation-format.md) | 새 화면/기능 문서 작성과 기존 문서 보강 포맷 |
| 7 | [원본 PRD](../personal-agent-platform-prd.md) | 제품 방향, 이미지 레퍼런스, 초기 맥락 |

충돌 시 `공통 객체/상태/API 정책`과 `공통 동선 정책`을 우선한다. 화면 상세 문서가 더 구체적인 경우에는 화면 계약을 함께 갱신한다.

## 2. 문서 Map

| 구분 | 문서 |
| --- | --- |
| 진입점 | [README](README.md), [화면 계약](screen-contracts.md) |
| 공통 정책 | [공통 동선](common/navigation-and-cross-screen-flows.md), [공통 객체/상태/API](common/domain-model-and-state-policy.md) |
| 개발 순서 | [구현 순서](common/implementation-plan.md) |
| 문서 작성 규칙 | [문서 표준](common/documentation-format.md) |
| 원본 방향성 | [개인형 Agent 플랫폼 PRD](../personal-agent-platform-prd.md) |

## 3. 화면별 읽기 패키지

한 화면을 구현할 때 전체 문서를 다 읽지 않는다. 아래 패키지를 먼저 읽고, 관련 화면이 연결될 때만 추가 문서를 연다.

| 화면 ID | 구현 대상 | 필수 문서 |
| --- | --- | --- |
| `SCR-01` | 오늘 / Control Tower | [화면 계약](screen-contracts.md#scr-01--오늘--control-tower), [공통 동선](common/navigation-and-cross-screen-flows.md), [오늘 상세](screens/01-today-control-tower.md) |
| `SCR-02` | 주제 | [화면 계약](screen-contracts.md#scr-02--주제--topics), [공통 동선](common/navigation-and-cross-screen-flows.md), [주제 상세](screens/02-topics.md) |
| `SCR-03` | 맡긴 일 | [화면 계약](screen-contracts.md#scr-03--맡긴-일--delegated-work), [공통 객체/상태](common/domain-model-and-state-policy.md), [맡긴 일 상세](screens/03-delegated-work.md) |
| `SCR-04` | 기억 | [화면 계약](screen-contracts.md#scr-04--기억--memory), [공통 객체/상태](common/domain-model-and-state-policy.md), [기억 상세](screens/04-memory.md) |
| `SCR-05` | 에이전트 | [화면 계약](screen-contracts.md#scr-05--에이전트--agents), [에이전트 상세](screens/05-agents.md), [에이전트 빌더](screens/13-agent-builder-canvas.md) |
| `SCR-06` | 연결 | [화면 계약](screen-contracts.md#scr-06--연결--connections), [공통 객체/상태](common/domain-model-and-state-policy.md), [연결 상세](screens/06-connections.md) |
| `SCR-07` | 스크랩 | [화면 계약](screen-contracts.md#scr-07--스크랩--scrap), [공통 객체/상태](common/domain-model-and-state-policy.md), [스크랩 상세](screens/07-scrap.md) |
| `SCR-08` | 캘린더 | [화면 계약](screen-contracts.md#scr-08--캘린더--calendar), [공통 동선](common/navigation-and-cross-screen-flows.md), [캘린더 상세](screens/08-calendar.md) |
| `SCR-09` | 할 일 | [화면 계약](screen-contracts.md#scr-09--할-일--todo), [할 일 상세](screens/09-todo.md), [할 일 맵](screens/14-todo-map.md) |
| `SCR-10` | 파일 | [화면 계약](screen-contracts.md#scr-10--파일--files), [공통 객체/상태](common/domain-model-and-state-policy.md), [파일 상세](screens/10-files.md) |
| `SCR-11` | 설정 | [화면 계약](screen-contracts.md#scr-11--설정--settings), [공통 객체/상태](common/domain-model-and-state-policy.md), [설정 상세](screens/11-settings.md) |
| `SCR-12` | 도움말 | [화면 계약](screen-contracts.md#scr-12--도움말--help), [도움말 상세](screens/12-help.md) |
| `SCR-13` | 에이전트 빌더 캔버스 | [화면 계약](screen-contracts.md#scr-13--에이전트-빌더-캔버스--agent-builder-canvas), [공통 객체/상태](common/domain-model-and-state-policy.md), [에이전트 빌더](screens/13-agent-builder-canvas.md) |
| `SCR-14` | 할 일 맵 | [화면 계약](screen-contracts.md#scr-14--할-일-맵--todo-map), [공통 동선](common/navigation-and-cross-screen-flows.md), [할 일 맵](screens/14-todo-map.md) |
| `SCR-15` | 리포트 빌더 | [화면 계약](screen-contracts.md#scr-15--리포트-빌더--report-builder), [공통 객체/상태](common/domain-model-and-state-policy.md), [리포트 빌더](screens/15-report-builder.md) |

## 4. 구현자 작업 Recipe

| 작업 유형 | 읽는 순서 | 산출물 |
| --- | --- | --- |
| 화면 하나 구현 | `README -> 화면 계약 -> 공통 정책 -> 대상 화면 상세` | route, 초기 데이터 API, 상태 처리, 수용 기준 |
| 도메인/API 설계 | `공통 객체/상태/API -> 화면 계약 -> 관련 화면 상세` | 객체 schema, 상태 enum, API, event, rollback 정책 |
| 화면 간 동선 구현 | `공통 동선 -> 화면 계약 -> 양쪽 화면 상세` | entry/exit, scope 전환, deep link, fallback |
| PR 리뷰 | `화면 계약 -> 수정 화면 상세 -> 공통 정책` | 누락된 상태, ID/key, 권한, 비용, 승인, 연계 영향 |
| 새 기능 문서화 | `문서 표준 -> 화면 계약 -> 공통 정책` | 화면 ID, route, 객체, 읽기/쓰기, edge case, AC |

## 5. 구현자가 지켜야 할 기준

| 항목 | 기준 |
| --- | --- |
| ID/key | 모든 목록형 데이터는 안정 ID를 사용한다. 배열 index, 제목, URL만으로 key를 만들지 않는다. |
| 상태 | 화면별 임의 상태명을 만들기 전에 공통 상태 모델을 확인한다. |
| 권한 | 읽기/쓰기/외부 쓰기/비용 증가/예약 변경은 승인 정책과 audit log에 연결한다. |
| 비용 | provider/model/run/schedule 단위 비용은 사용량 정책과 화면 표시가 연결되어야 한다. |
| 연결 미비 | tool/provider/MCP가 없으면 실패만 보여주지 말고 연결 CTA와 대체 경로를 제공한다. |
| optimistic update | 즉시 반영이 가능해도 실패 시 rollback 또는 재동기화 정책이 있어야 한다. |
| 삭제/잊기/보관 | 완전 삭제, 참조 제외, 목록 숨김을 혼용하지 않는다. |
| 이미지 | PNG 이미지는 시각 방향성 참고다. 구현 기준은 문서의 객체, 상태, 권한, 수용 기준이다. |

## 6. Merge Safety

| 상황 | 처리 |
| --- | --- |
| 화면 상세를 보강 | 해당 `screens/*.md`만 수정하고, route/object/entry/exit가 바뀌면 [화면 계약](screen-contracts.md)도 갱신 |
| 공통 상태/객체 변경 | [공통 객체/상태/API 정책](common/domain-model-and-state-policy.md)을 먼저 갱신하고 관련 화면 계약 갱신 |
| 화면 간 동선 변경 | [공통 동선 정책](common/navigation-and-cross-screen-flows.md)을 먼저 갱신하고 양쪽 화면 상세에 반영 |
| 구현 순서 변경 | [구현 순서](common/implementation-plan.md)에 milestone 영향 기록 |
| 이미지 교체 | PNG 자산만 사용하고, 문서에는 상대 경로로 링크 |

상위 요약 문서에 화면 상세 내용을 무리하게 병합하지 않는다. 상세 문서는 leaf spec이고, 상위 문서는 찾아가기 위한 계약/색인이다.

## 7. 다음 AI에게 줄 프롬프트 템플릿

```text
목표: <화면/기능> 구현 계획을 작성하거나 코드를 수정한다.

먼저 읽을 문서:
1. docs/product-planning/README.md
2. docs/product-planning/screen-contracts.md
3. docs/product-planning/common/navigation-and-cross-screen-flows.md
4. docs/product-planning/common/domain-model-and-state-policy.md
5. docs/product-planning/screens/<대상 화면>.md

작업 규칙:
- 화면 문서와 공통 정책이 충돌하면 공통 정책을 우선하고, 충돌 내용을 보고한다.
- 이미지의 작은 텍스트나 오타를 구현 기준으로 삼지 않는다.
- 새 상태명, 새 객체명, 새 권한명을 만들기 전에 공통 문서에 있는지 확인한다.
- 구현 계획에는 파일 단위 변경 범위, API/데이터 영향, edge case, 수용 기준을 포함한다.
- 문서를 갱신할 때는 docs/product-planning/common/documentation-format.md의 업데이트 순서를 따른다.
```

## 8. 문서 현황

| 구분 | 파일 수 | 설명 |
| --- | --- | --- |
| 원본 PRD | 1 | 제품 방향과 이미지 레퍼런스 |
| 화면 상세 | 15 | 사이드 메뉴 12개 + 고급 화면 3개 |
| 공통 정책 | 2 | 화면 간 동선, 객체/상태/API |
| AI 재구성 문서 | 4 | README, 화면 계약, 구현 순서, 문서 표준 |
