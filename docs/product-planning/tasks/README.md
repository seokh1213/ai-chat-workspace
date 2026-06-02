# 개발 태스크 Index

이 디렉터리는 개인형 Agent 플랫폼을 신규 프로젝트로 처음부터 구축하기 위한 작업 티켓 세트다. 기존 `trip-plan`, `todo-ai`, `mind-plan`, `templates`는 특정 기능과 구현 패턴을 확인하는 reference-only 자료이며, 복사/마이그레이션 대상이 아니다.

## 1. 읽는 순서

| 순서 | 문서 | 목적 |
| --- | --- | --- |
| 1 | [태스크 포맷](00-task-format.md) | ID, 상태, 완료 조건, subtasks 작성 규약 |
| 2 | [Dependency Map](01-dependency-map.md) | milestone alias, 선후행 관계, 첫 구현 순서 |
| 3 | [구현 순서](../common/implementation-plan.md) | `M0~M7` milestone 흐름 |
| 4 | [화면 계약](../screen-contracts.md) | 화면별 route/read/write/entry/exit |
| 5 | [공통 객체/상태/API](../common/domain-model-and-state-policy.md) | canonical object, enum, ID/key, rollback |
| 6 | [공통 동선](../common/navigation-and-cross-screen-flows.md) | chat-first, workspace, CRUD, approval, fallback |
| 7 | milestone별 태스크 문서 | 실제 개발 티켓 |

## 2. 신규 프로젝트 전제

| 항목 | 기준 |
| --- | --- |
| 코드 시작점 | 신규 프로젝트 bootstrap부터 시작 |
| 기존 앱 | reference-only. 필요한 feature/pattern만 조사 |
| 복사/마이그레이션 | 기본 금지. 명시적으로 선택한 작은 코드 조각만 별도 검토 후 사용 |
| 우선 구현 | Shell, domain model, chat scope, topic/workspace foundation |
| 첫 실제 UX | 오늘 화면에서 채팅 시작 -> 주제 승격 -> workspace 진입 |

## 3. Milestone 문서

| Milestone | 문서 | Task | Subtask | 핵심 결과 |
| --- | --- | ---: | ---: | --- |
| `M0` | [M0-codebase-alignment.md](milestones/M0-codebase-alignment.md) | 12 | 56 | reference audit, bootstrap 결정 |
| `M1` | [M1-shell-domain-foundation.md](milestones/M1-shell-domain-foundation.md) | 13 | 62 | 신규 프로젝트 shell/domain foundation |
| `M2` | [M2-control-tower-mvp.md](milestones/M2-control-tower-mvp.md) | 14 | 58 | 오늘 + 주제 MVP |
| `M3` | [M3-workspace-bridge.md](milestones/M3-workspace-bridge.md) | 12 | 47 | 신규 workspace bridge |
| `M4` | [M4-execution-core.md](milestones/M4-execution-core.md) | 24 | 110 | task/run/schedule/approval |
| `M5` | [M5-knowledge-core.md](milestones/M5-knowledge-core.md) | 18 | 92 | source/file/memory/document |
| `M6` | [M6-agent-connection-core.md](milestones/M6-agent-connection-core.md) | 20 | 79 | provider/credential/agent builder |
| `M7` | [M7-visual-planning-help.md](milestones/M7-visual-planning-help.md) | 16 | 65 | todo map/help/dev mode docs |
| 합계 | 8개 milestone | 129 | 569 | 실제 개발 ticket set |

## 4. Dependency 원칙

| 선행 | 후행 | 이유 |
| --- | --- | --- |
| `M0` | `M1` | 신규 프로젝트 stack/module/bootstrap 결정 필요 |
| `M1` | `M2~M7` | shell, route, domain object, API skeleton, permission state 공통 의존 |
| `M2` | `M3` | topic과 conversation scope가 있어야 workspace bridge 가능 |
| `M3` | `M4~M5` 일부 | workspace relation이 task/source/document 연결의 기준 |
| `M4` | `M6` 일부 | agent test run과 schedule 실행이 run model에 의존 |
| `M5` | `M6` 일부 | agent knowledge binding이 source/memory/file에 의존 |
| `M6` | `M7` 일부 | Dev Mode 도움말과 agent builder 가이드가 설정/연결 정책에 의존 |

상세 alias 해석과 첫 구현 순서는 [Dependency Map](01-dependency-map.md)을 따른다.

## 5. 전체 검수 기준

- [ ] 모든 milestone 문서가 `00-task-format.md`의 템플릿을 따른다.
- [ ] 모든 task ID가 중복되지 않는다.
- [ ] 모든 task에 subtasks, acceptance criteria, verification이 있다.
- [ ] 기존 앱을 기반으로 복사/마이그레이션한다는 표현이 없다.
- [ ] 기존 앱 reference는 조사 task 또는 open decision으로만 표현된다.
- [ ] `L` 크기 태스크가 없거나 split note가 있다.
- [ ] credential, approval, cost, delete/archive, external write가 독립적으로 검토된다.
- [ ] 첫 MVP 동선은 `오늘 -> 채팅 -> 주제 승격 -> workspace`로 닫힌다.

## 6. 다음 AI 작업 프롬프트

```text
목표: <milestone 또는 task> 구현 계획/코드 작업.

전제:
- 신규 프로젝트를 처음부터 구축한다.
- 기존 trip-plan/todo-ai/mind-plan/templates는 reference-only다.
- 복사/마이그레이션 전제로 작업하지 않는다.

먼저 읽을 문서:
- docs/product-planning/tasks/README.md
- docs/product-planning/tasks/00-task-format.md
- docs/product-planning/tasks/milestones/<대상 milestone>.md
- docs/product-planning/screen-contracts.md
- docs/product-planning/common/domain-model-and-state-policy.md
- docs/product-planning/common/navigation-and-cross-screen-flows.md

반드시 보고할 것:
- 구현한 task/subtask ID
- 변경 파일
- read/write 데이터 흐름
- permission/cost/approval/connection 영향
- 검증 결과
```
