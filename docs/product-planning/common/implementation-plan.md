# 구현 순서 / Implementation Plan

이 문서는 15개 화면을 한 번에 만들지 않기 위한 개발 순서다. 목표는 작은 동작 단위로 플랫폼 골격을 세우고, 각 milestone마다 실제 사용 가능한 흐름을 남기는 것이다.

## 1. 기본 원칙

| 원칙 | 설명 |
| --- | --- |
| Chat-first를 먼저 세움 | 전역 채팅, scope, 메시지 저장, tool/CRUD 요청 표현이 모든 기능의 관문 |
| Workspace는 지속 작업만 | 단발 답변은 채팅에 남기고, 누적 관리가 필요한 것만 `topic`으로 승격 |
| 실행은 `run`으로 분리 | 사용자가 할 일은 `task`, AI/agent/tool이 실제 수행한 이력은 `run` |
| 자료는 `source -> memory/document` | 스크랩 원자료와 장기 기억/문서 산출물을 분리 |
| 설정/연결은 early dependency | 모델 provider, credential, permission, cost policy 없이는 agent 실행 UX가 불안정 |
| 화면보다 contract 우선 | 각 milestone은 [화면 계약](../screen-contracts.md)의 read/write를 먼저 만족시킴 |

## 2. Milestone 요약

| 단계 | 이름 | 주요 화면 | 목표 |
| --- | --- | --- | --- |
| `M0` | Reference Audit + Bootstrap 결정 | 전체 | 기존 앱에서 참고할 feature/pattern과 신규 프로젝트 bootstrap 방향 결정 |
| `M1` | Shell + Domain Foundation | 전체 공통 | route, sidebar, ID/key, canonical state, auth/hub scope |
| `M2` | Control Tower MVP | `SCR-01`, `SCR-02` | 채팅 시작, 주제 승격, 최근 주제 재진입 |
| `M3` | Workspace Bridge | `SCR-02`, 신규 workspace, trip-plan reference | 주제 작업실과 신규 workspace surface 연결 |
| `M4` | Execution Core | `SCR-03`, `SCR-08`, `SCR-09` | run/task/schedule/approval 기본 흐름 |
| `M5` | Knowledge Core | `SCR-07`, `SCR-04`, `SCR-10`, `SCR-15` | 스크랩, 파일, 기억, 문서화 |
| `M6` | Agent + Connection Core | `SCR-05`, `SCR-06`, `SCR-11`, `SCR-13` | provider, credential, agent builder, model routing |
| `M7` | Visual Planning + Help | `SCR-14`, `SCR-12` | 할 일 맵, Dev Mode 도움말, 운영성 |

## 3. M0 / Reference Audit + Bootstrap 결정

| 항목 | 내용 |
| --- | --- |
| 읽을 문서 | [README](../README.md), [화면 계약](../screen-contracts.md), [공통 객체/상태/API](domain-model-and-state-policy.md) |
| 해야 할 일 | 신규 프로젝트 착수 전 기존 `trip-plan`, `todo-ai`, `mind-plan`, templates에서 참고할 feature/pattern과 버릴 구조를 분리 |
| 산출물 | reference audit, 신규 프로젝트 bootstrap 결정 목록, 새로 설계할 domain/API 목록 |
| 완료 기준 | 신규 프로젝트를 처음부터 만들기 위한 stack/module/package/API 방향과 reference 범위가 명확함 |
| 주의 | 기존 앱을 복사/마이그레이션하지 않는다. 필요한 피쳐와 패턴만 확인한다. |

## 4. M1 / Shell + Domain Foundation

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | 전체 |
| 읽을 문서 | [공통 동선](navigation-and-cross-screen-flows.md), [공통 객체/상태/API](domain-model-and-state-policy.md), [화면 계약](../screen-contracts.md) |
| 구현 범위 | sidebar, hub/workspace scope, route skeleton, empty/loading/error 공통 상태, stable ID/key, canonical enum |
| 핵심 API | navigation 조회, current hub 조회, auth/session 조회, common event stream skeleton |
| 테스트 초점 | route 활성 상태, hub 전환 시 목록/상세 reset, permission disabled state, deep link fallback |
| 완료 기준 | 15개 route placeholder가 같은 shell에서 열리고 공통 navigation/permission 표시가 일관됨 |

## 5. M2 / Control Tower MVP

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-01` 오늘, `SCR-02` 주제 |
| 읽을 문서 | [SCR-01 계약](../screen-contracts.md#scr-01--오늘--control-tower), [SCR-02 계약](../screen-contracts.md#scr-02--주제--topics), [오늘 상세](../screens/01-today-control-tower.md), [주제 상세](../screens/02-topics.md) |
| 구현 범위 | 전역 채팅 입력, 최근 주제, 주제 생성, 대화의 주제 승격, 주제 목록/상세 패널 |
| 핵심 API | conversation create/message, topic list/create/update, conversation-to-topic promotion |
| 테스트 초점 | 단발 답변은 global conversation에 남고, 지속 작업은 topic으로 승격됨 |
| 완료 기준 | 사용자가 오늘 화면에서 질문을 시작하고, “주제로 저장/작업실 열기”까지 이동 가능 |

## 6. M3 / Workspace Bridge

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-02` 주제, 신규 workspace surface, trip-plan reference |
| 읽을 문서 | [주제 상세](../screens/02-topics.md), trip-plan reference 문서/코드, [공통 동선 6장](navigation-and-cross-screen-flows.md#6-workspace---chat) |
| 구현 범위 | topic subtype, 신규 workspace route/surface, workspace 내부 채팅 scope, workspace activity 기록 |
| 핵심 API | topic detail, topic resources, workspace conversation, artifact/surface link |
| 테스트 초점 | 오늘 -> 주제 -> workspace surface -> 주제 채팅 복귀, 대화 이력의 topic 귀속 |
| 완료 기준 | “저번 여행 목록 보여줘 -> 해당 작업공간에서 편집하자” 흐름이 신규 topic/workspace에 귀속됨 |

## 7. M4 / Execution Core

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-03` 맡긴 일, `SCR-08` 캘린더, `SCR-09` 할 일 |
| 읽을 문서 | [맡긴 일 상세](../screens/03-delegated-work.md), [캘린더 상세](../screens/08-calendar.md), [할 일 상세](../screens/09-todo.md), [공통 동선 10장](navigation-and-cross-screen-flows.md#10-task---runschedule) |
| 구현 범위 | task list/detail, run list/detail, run status transition, approval request, schedule occurrence, calendar 표시 |
| 핵심 API | task CRUD, run create/control/logs, approval approve/reject, schedule CRUD, calendar range |
| 테스트 초점 | pause/resume/stop/retry, approval 중복 처리, schedule toggle, task-run 상태 동기화 |
| 완료 기준 | 사용자가 할 일을 AI에게 맡기고, 실행 상태를 보고, 승인/일정/재시도를 처리 가능 |

## 8. M5 / Knowledge Core

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-07` 스크랩, `SCR-04` 기억, `SCR-10` 파일, `SCR-15` 리포트 빌더 |
| 읽을 문서 | [스크랩 상세](../screens/07-scrap.md), [기억 상세](../screens/04-memory.md), [파일 상세](../screens/10-files.md), [리포트 빌더](../screens/15-report-builder.md), [공통 동선 9장](navigation-and-cross-screen-flows.md#9-스크랩---기억---문서---주제-연결) |
| 구현 범위 | source inbox, extraction status, file upload/import, memory review, document draft, citation |
| 핵심 API | source CRUD/extract/retry, file upload/summary, memory CRUD/scope, document create/update/export, citation validate |
| 테스트 초점 | 중복 URL, 추출 실패, source 삭제 후 citation, 긴 문서 비용, 민감 memory 제외 |
| 완료 기준 | 자료를 모으고 요약/기억/문서/주제로 승격하는 지식 흐름이 연결됨 |

## 9. M6 / Agent + Connection Core

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-05` 에이전트, `SCR-06` 연결, `SCR-11` 설정, `SCR-13` 에이전트 빌더 캔버스 |
| 읽을 문서 | [에이전트 상세](../screens/05-agents.md), [연결 상세](../screens/06-connections.md), [설정 상세](../screens/11-settings.md), [에이전트 빌더](../screens/13-agent-builder-canvas.md) |
| 구현 범위 | provider/API key/OAuth, model routing, cost/approval policy, agent registry, builder graph, test run |
| 핵심 API | connection CRUD/health, credential lifecycle, model catalog/routing, agent CRUD/version, builder validate/test/publish |
| 테스트 초점 | credential 원문 비노출, OAuth 만료, provider fallback, draft/published 분리, invalid graph, dev token scope |
| 완료 기준 | OpenRouter/local Codex OAuth/direct provider 방식과 agent builder가 실행 정책에 연결됨 |

## 10. M7 / Visual Planning + Help

| 항목 | 내용 |
| --- | --- |
| 주요 화면 | `SCR-14` 할 일 맵, `SCR-12` 도움말 |
| 읽을 문서 | [할 일 맵](../screens/14-todo-map.md), [도움말 상세](../screens/12-help.md), [설정 Dev Mode](../screens/11-settings.md#14-dev-mode-상세-요구사항) |
| 구현 범위 | task graph, dependency editing, AI task decomposition, help search, Dev Mode docs, system status |
| 핵심 API | task graph CRUD, dependency validate, help search/article, system status, feedback |
| 테스트 초점 | 순환 dependency 방지, 대량 node 성능, 명령어 복사, 오래된 도움말, status stale |
| 완료 기준 | 사용자가 계획을 시각화하고, 로컬/TUI/MCP 접근 방법을 도움말에서 확인 가능 |

## 11. 공통 테스트 Matrix

| 축 | 확인할 것 |
| --- | --- |
| Scope | global/topic/run/agent_test/help conversation이 섞이지 않음 |
| Permission | 비활성 메뉴와 액션이 사유를 표시함 |
| Cost | 비용 증가 액션 전 차단/승인/한도 표시가 있음 |
| Connection | provider/tool/MCP 미연결 시 연결 CTA와 fallback이 있음 |
| Realtime | run/source/file 처리 상태가 중복/역순 이벤트에도 안정적임 |
| Optimistic update | 실패 시 rollback 또는 재조회가 있음 |
| Delete/archive | 삭제/보관/잊기/참조 제외가 구분됨 |
| Deep link | 접근 불가/삭제/없는 ID에서 안전 fallback 제공 |
| Accessibility | 키보드 이동, focus, aria label, motion 감소 대응 |

## 12. 다음 작업 프롬프트 예시

```text
목표: M2 Control Tower MVP 구현 계획을 만든다.

읽을 문서:
- docs/product-planning/README.md
- docs/product-planning/screen-contracts.md
- docs/product-planning/common/navigation-and-cross-screen-flows.md
- docs/product-planning/common/domain-model-and-state-policy.md
- docs/product-planning/screens/01-today-control-tower.md
- docs/product-planning/screens/02-topics.md

산출물:
- 현재 코드 재사용 지점
- FE/BE/API 작업 목록
- edge case와 테스트 목록
- 구현 순서
```
