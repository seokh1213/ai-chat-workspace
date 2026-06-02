# 개발 태스크 Dependency Map

이 문서는 milestone 문서에 등장하는 임시 의존성 alias를 실제 task ID로 해석하기 위한 상위 지도다. milestone 상세 문서를 대량 수정하지 않고, 여기서 해석 규칙을 고정해 병합 리스크를 줄인다.

## 1. 전체 산출물

| Milestone | Task | Subtask | 문서 |
| --- | ---: | ---: | --- |
| `M0` | 12 | 56 | [M0-codebase-alignment.md](milestones/M0-codebase-alignment.md) |
| `M1` | 13 | 62 | [M1-shell-domain-foundation.md](milestones/M1-shell-domain-foundation.md) |
| `M2` | 14 | 58 | [M2-control-tower-mvp.md](milestones/M2-control-tower-mvp.md) |
| `M3` | 12 | 47 | [M3-workspace-bridge.md](milestones/M3-workspace-bridge.md) |
| `M4` | 24 | 110 | [M4-execution-core.md](milestones/M4-execution-core.md) |
| `M5` | 18 | 92 | [M5-knowledge-core.md](milestones/M5-knowledge-core.md) |
| `M6` | 20 | 79 | [M6-agent-connection-core.md](milestones/M6-agent-connection-core.md) |
| `M7` | 16 | 65 | [M7-visual-planning-help.md](milestones/M7-visual-planning-help.md) |
| 합계 | 129 | 569 | 8개 milestone |

## 2. 신규 프로젝트 전제

| 항목 | 기준 |
| --- | --- |
| 구현 방식 | 신규 프로젝트를 처음부터 구축 |
| 기존 앱 | `trip-plan`, `todo-ai`, `mind-plan`, `templates`는 reference-only |
| 금지 | 기존 앱을 기반으로 복사, 이식, 마이그레이션하는 작업 |
| 허용 | 특정 UX/API/streaming/domain pattern을 reference check task로 조사 |
| 첫 vertical slice | `오늘 -> global chat -> topic 생성/승격 -> workspace 진입` |

## 3. Alias 해석표

Milestone 문서에 아래 alias가 나오면 이 표를 우선 적용한다.

| Alias | 실제 선행 task | 의미 |
| --- | --- | --- |
| `M1-SHELL` | `DEV-M1-T04`, `DEV-M1-T05`, `DEV-M1-T10` | route shell, sidebar, 공통 화면 상태 |
| `M1-AUTH-HUB` | `DEV-M1-T03`, `DEV-M1-T06`, `DEV-M1-T11` | session, current hub, scope, permission skeleton |
| `M1-DOMAIN` | `DEV-M1-T07` | canonical object, ID prefix, status enum |
| `M1-API` | `DEV-M1-T08`, `DEV-M1-T10` | API envelope, version, idempotency, error/state mapping |
| `M1-CHAT` | `DEV-M1-T06`, `DEV-M1-T12` | conversation scope, message/operation envelope |
| `M1-EVENT` | `DEV-M1-T09` | SSE/event envelope, reconnect/fallback |
| `M1-TEST` | `DEV-M1-T13` | foundation quality gate와 후속 readiness |
| `M4-TASK` | `DEV-M4-T01` ~ `DEV-M4-T06` | task schema, read/write, todo UI foundation |
| `M4-RUN-SCHEDULE` | `DEV-M4-T08` ~ `DEV-M4-T24` | run, approval, schedule, calendar 연계 |
| `M4 approval foundation` | `DEV-M4-T16`, `DEV-M4-T17` | approval request 생성/조회/처리 |
| `M4 run foundation` | `DEV-M4-T08`, `DEV-M4-T10`, `DEV-M4-T11` | run 생성, 상세/log, 상태 전이 |
| `M5 knowledge foundation` | `DEV-M5-T01`, `DEV-M5-T02`, `DEV-M5-T08`, `DEV-M5-T10`, `DEV-M5-T13` | source/file/memory/document 기본 read/write |
| `M6-SETTINGS-DEV` | `DEV-M6-T13` | Dev Mode token, scope, local access |
| `M6-CONNECTION-POLICY` | `DEV-M6-T10`, `DEV-M6-T11`, `DEV-M6-T12` | fallback, cost, approval/connection policy |

## 4. 첫 구현 순서

첫 개발 착수는 전체 129개를 한 번에 열지 않는다. 아래 순서대로 닫힌 slice를 만든다.

| 순서 | 목표 | 포함 task |
| --- | --- | --- |
| 1 | bootstrap 결정 | `DEV-M0-T01` ~ `DEV-M0-T12` |
| 2 | 신규 프로젝트 skeleton | `DEV-M1-T01`, `DEV-M1-T02`, `DEV-M1-T03`, `DEV-M1-T04`, `DEV-M1-T05` |
| 3 | scope/domain/API foundation | `DEV-M1-T06`, `DEV-M1-T07`, `DEV-M1-T08`, `DEV-M1-T09`, `DEV-M1-T10`, `DEV-M1-T11`, `DEV-M1-T12`, `DEV-M1-T13` |
| 4 | Today에서 채팅 시작 | `DEV-M2-T01`, `DEV-M2-T02`, `DEV-M2-T03`, `DEV-M2-T04`, `DEV-M2-T05` |
| 5 | 주제 목록과 생성 | `DEV-M2-T06`, `DEV-M2-T07`, `DEV-M2-T08`, `DEV-M2-T09`, `DEV-M2-T10` |
| 6 | 채팅을 주제로 승격 | `DEV-M2-T11`, `DEV-M2-T12`, `DEV-M2-T14` |
| 7 | workspace bridge | `DEV-M3-T01`, `DEV-M3-T02`, `DEV-M3-T03`, `DEV-M3-T04`, `DEV-M3-T07`, `DEV-M3-T09`, `DEV-M3-T10`, `DEV-M3-T12` |

`DEV-M2-T13`은 active run/upcoming schedule 요약이라 M4 일부가 준비된 뒤 연결해도 된다. M4/M5/M6/M7은 첫 MVP 이후 병렬로 확장 가능하지만, credential/approval/cost/delete 관련 task는 독립 검수 없이 다른 task에 묶지 않는다.

## 5. 병렬화 기준

| 가능 | 조건 |
| --- | --- |
| M4 task/run/schedule 분리 병렬 | `DEV-M4-T01` 도메인 골격 완료 후 read/write/control 작업 분리 |
| M5 source/file/memory/document 분리 병렬 | `DEV-M5-T01` 계약 완료 후 각 객체별 화면/API 분리 |
| M6 connection/model/agent builder 분리 병렬 | `DEV-M6-T01`, `DEV-M6-T04` 보안 경계 완료 후 |
| M7 todo map/help 분리 병렬 | `M4-TASK`, `M6-SETTINGS-DEV` alias 충족 후 |

| 금지 | 이유 |
| --- | --- |
| M1 foundation 완료 전 M2~M7 구현 착수 | route/scope/API/permission 상태가 흔들림 |
| credential 저장과 provider UI를 한 task에 합침 | 원문 비노출/검증 실패/영향 분석 누락 위험 |
| approval, cost, external write를 feature task 안에 숨김 | 안전 정책 우회 위험 |
| delete/archive/forget을 일반 update task에 합침 | citation, memory, audit 영향 누락 위험 |

## 6. Review Checklist

- [ ] task가 신규 프로젝트 전제를 유지한다.
- [ ] 기존 앱 reference는 조사/비교/금지 항목으로만 등장한다.
- [ ] alias는 이 문서의 실제 task ID로 해석된다.
- [ ] task 구현 전 `Depends on`이 `done` 또는 명시적 `ready`다.
- [ ] 모든 위험 쓰기에는 impact, approval 또는 audit 조건이 있다.
- [ ] E2E task는 단위 task가 완료된 뒤 실행된다.
