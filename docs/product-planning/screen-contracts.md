# 화면 계약 / Screen Contracts

이 문서는 15개 화면을 AI 구현자가 빠르게 찾고 연결할 수 있게 만든 최소 계약이다. 상세 UX, edge case, 수용 기준은 각 화면 문서가 source of truth다.

## 1. Contract 규칙

| 항목 | 의미 |
| --- | --- |
| Screen ID | 구현/리뷰/프롬프트에서 쓰는 안정 식별자 |
| Route | 현재 기준 후보 route. 실제 라우터 구현 시 변경 가능하지만 변경하면 이 문서도 갱신 |
| Owner doc | 화면 상세 원문 |
| Primary objects | 화면이 직접 읽거나 쓰는 canonical 객체 |
| Entry points | 이 화면으로 들어오는 대표 동선 |
| Exits | 다른 화면/객체로 나가는 대표 동선 |
| Reads | 초기 조회와 갱신에 필요한 데이터 |
| Writes | 화면에서 생성/수정/삭제/실행하는 데이터 |
| High-risk edges | 구현 시 누락되기 쉬운 상태/권한/연계 |
| Acceptance summary | 상세 문서 수용 기준의 압축본 |

## 2. 전체 화면 목록

| Screen ID | 화면 | Route | Owner doc | Primary objects |
| --- | --- | --- | --- | --- |
| `SCR-01` | 오늘 / Control Tower | `/today` | [01-today-control-tower.md](screens/01-today-control-tower.md) | `conversation`, `topic`, `run`, `schedule` |
| `SCR-02` | 주제 / Topics | `/topics` | [02-topics.md](screens/02-topics.md) | `topic`, `conversation`, `source`, `file_asset`, `memory`, `run` |
| `SCR-03` | 맡긴 일 / Delegated Work | `/runs` | [03-delegated-work.md](screens/03-delegated-work.md) | `run`, `approval_request`, `schedule`, `agent` |
| `SCR-04` | 기억 / Memory | `/memory` | [04-memory.md](screens/04-memory.md) | `memory`, `source`, `topic`, `conversation` |
| `SCR-05` | 에이전트 / Agents | `/agents` | [05-agents.md](screens/05-agents.md) | `agent`, `connection`, `run`, `model_route` |
| `SCR-06` | 연결 / Connections | `/connections` | [06-connections.md](screens/06-connections.md) | `connection`, `credential`, `permission_policy`, `usage_limit` |
| `SCR-07` | 스크랩 / Scrap | `/scrap` | [07-scrap.md](screens/07-scrap.md) | `source`, `memory`, `topic`, `file_asset`, `document` |
| `SCR-08` | 캘린더 / Calendar | `/calendar` | [08-calendar.md](screens/08-calendar.md) | `calendar_event`, `schedule`, `task`, `run` |
| `SCR-09` | 할 일 / Todo | `/tasks` | [09-todo.md](screens/09-todo.md) | `task`, `topic`, `run`, `schedule` |
| `SCR-10` | 파일 / Files | `/files` | [10-files.md](screens/10-files.md) | `file_asset`, `source`, `memory`, `topic` |
| `SCR-11` | 설정 / Settings | `/settings` | [11-settings.md](screens/11-settings.md) | `model_route`, `cost_policy`, `approval_policy`, `dev_token`, `credential` |
| `SCR-12` | 도움말 / Help | `/help` | [12-help.md](screens/12-help.md) | `help_article`, `system_status`, `conversation` |
| `SCR-13` | 에이전트 빌더 캔버스 | `/agents/:agentId/builder` | [13-agent-builder-canvas.md](screens/13-agent-builder-canvas.md) | `agent`, `agent_version`, `connection`, `skill`, `run` |
| `SCR-14` | 할 일 맵 | `/tasks/map` | [14-todo-map.md](screens/14-todo-map.md) | `task`, `task_dependency`, `topic`, `run` |
| `SCR-15` | 리포트 빌더 | `/reports/:documentId` | [15-report-builder.md](screens/15-report-builder.md) | `document`, `source`, `memory`, `citation`, `topic` |

## 3. 화면별 계약

## SCR-01 / 오늘 / Control Tower

| 필드 | 계약 |
| --- | --- |
| Route | `/today` |
| Owner doc | [screens/01-today-control-tower.md](screens/01-today-control-tower.md) |
| Primary objects | `conversation(global)`, `topic`, `run`, `schedule`, `connection` warning |
| Entry points | 로그인 후 첫 화면, 사이드바 오늘, deep link fallback, 알림 처리 후 복귀 |
| Exits | 주제 상세/작업실, 맡긴 일 상세, 연결 설정, schedule 편집, 새 주제 생성 |
| Reads | navigation, today summary, recent topics, active runs, upcoming schedules, onboarding checklist |
| Writes | global message, topic 생성, run 생성, schedule 생성, conversation-to-topic 승격 |
| High-risk edges | 단발 채팅과 주제 승격 오분류, run 진행률 stale, 연결 미비, 비용 초과, 승인 대기, 첫 사용자 빈 상태 |
| Acceptance summary | 전역 채팅에서 시작 가능하고, 지속 작업은 주제/맡긴 일/schedule로 승격되며, 우측 패널이 실행 상태와 예정 작업을 정확히 보여줌 |

## SCR-02 / 주제 / Topics

| 필드 | 계약 |
| --- | --- |
| Route | `/topics`, `/topics/:topicId` |
| Owner doc | [screens/02-topics.md](screens/02-topics.md) |
| Primary objects | `topic`, `conversation(topic)`, `source`, `file_asset`, `memory`, `artifact`, `run` |
| Entry points | 사이드바 주제, 오늘 최근 주제, 채팅의 주제 승격 CTA, 스크랩/파일/할 일의 주제 연결 |
| Exits | 주제 작업실, 빠른 채팅, 자료/파일/기억 상세, 맡긴 일, 할 일, 리포트 빌더 |
| Reads | topic list, topic stats, last activity, linked resources, permission state, connection warnings |
| Writes | topic 생성/수정/보관, topic conversation message, resource relation 변경, favorite/pin |
| High-risk edges | global conversation과 topic conversation 혼동, 주제 삭제와 보관 혼용, relation 중복, 권한 부족 주제 편집, stale stats |
| Acceptance summary | 사용자가 지속 작업공간을 찾고, 빠른 채팅과 본격 작업실을 구분해 진입하며, 연결된 자료/기억/작업 상태를 파악함 |

## SCR-03 / 맡긴 일 / Delegated Work

| 필드 | 계약 |
| --- | --- |
| Route | `/runs`, `/runs/:runId` |
| Owner doc | [screens/03-delegated-work.md](screens/03-delegated-work.md) |
| Primary objects | `run`, `run_agent`, `approval_request`, `schedule`, `agent`, `run_log` |
| Entry points | 사이드바 맡긴 일, 오늘 진행 중 작업, task 위임, schedule 실행, agent test run, approval notification |
| Exits | run 상세, approval 처리, schedule 편집, topic/task 원본, agent 상세, file/artifact 결과 |
| Reads | run list, status tabs, run tree, approvals, logs, cost, artifacts, schedule origin |
| Writes | pause/resume/stop/retry, run message, approval approve/reject, 담당 agent 추가, schedule 수정 |
| High-risk edges | run 상태 전이 불일치, stop 이후 하위 agent 잔류, approval 중복 처리, 재시도 idempotency, 비용 차단, 실시간 이벤트 역순 |
| Acceptance summary | 실행 중/승인 대기/완료/실패 작업을 분리해 보고, 작업 제어와 추가 지시가 상태 모델에 맞게 동작함 |

## SCR-04 / 기억 / Memory

| 필드 | 계약 |
| --- | --- |
| Route | `/memory`, `/memory/:memoryId` |
| Owner doc | [screens/04-memory.md](screens/04-memory.md) |
| Primary objects | `memory`, `memorySourceLinks`, `topic`, `source`, `conversation`, `agent` |
| Entry points | 사이드바 기억, 스크랩의 기억 저장, 채팅에서 기억 등록/수정, 주제의 관련 기억, 설정의 기억 정책 |
| Exits | memory 상세/편집, source 원문, topic, conversation, agent 참조 정책 |
| Reads | memory list, filters, confidence, source links, usage history, sensitive flags |
| Writes | memory 생성/수정, active/excluded/archive/delete, source relation 변경, scope 변경, user verification |
| High-risk edges | source 요약을 그대로 memory로 오인, 민감 정보 참조, 낮은 신뢰도 자동 사용, 잊기와 삭제 혼동, 근거 없는 기억 생성 |
| Acceptance summary | 장기 참조 가치가 있는 정보만 기억으로 관리하고, 근거/신뢰도/scope/사용 이력을 확인하며 AI 참조 여부를 제어함 |

## SCR-05 / 에이전트 / Agents

| 필드 | 계약 |
| --- | --- |
| Route | `/agents`, `/agents/:agentId` |
| Owner doc | [screens/05-agents.md](screens/05-agents.md) |
| Primary objects | `agent`, `agent_version`, `connection`, `model_route`, `run`, `skill` |
| Entry points | 사이드바 에이전트, 맡긴 일의 담당 agent 클릭, 연결의 사용 agent, 설정의 모델 라우팅, builder 저장 후 복귀 |
| Exits | agent 상세, agent builder canvas, test chat, run history, connection 설정 |
| Reads | agent registry, templates, capabilities, model/tool bindings, usage/cost, recent runs |
| Writes | agent 생성/편집/복제/비활성화, version publish, test run 생성, model/tool/knowledge binding |
| High-risk edges | draft와 published version 혼동, 비활성 connection을 가진 agent 실행, 비용 높은 모델 기본 선택, tool permission 누락, test 결과와 운영 run 혼동 |
| Acceptance summary | agent 목록과 상세에서 역할/도구/모델/성과를 파악하고, 생성/편집/테스트/배포 상태가 분리됨 |

## SCR-06 / 연결 / Connections

| 필드 | 계약 |
| --- | --- |
| Route | `/connections`, `/connections/:connectionId` |
| Owner doc | [screens/06-connections.md](screens/06-connections.md) |
| Primary objects | `connection`, `credential`, `permission_policy`, `usage_limit`, `connection_log` |
| Entry points | 사이드바 연결, 연결 미비 CTA, 설정 provider 관리, agent tool 설정, run 실패 원인 |
| Exits | provider/API key/OAuth 설정, permission rule 편집, usage log, 관련 agent/run/schedule 영향 목록 |
| Reads | connection catalog, health check, credential status, capabilities, usage, logs, dependent agents/schedules |
| Writes | connection 생성/수정/비활성화, credential 저장/회전/삭제, health test, permission rule, cost limit |
| High-risk edges | credential 원문 재노출, connection 비활성화 영향 미고지, MCP/provider/tool 분류 혼동, 비용 한도 우회, 테스트 로그 민감 payload 저장 |
| Acceptance summary | 외부 도구와 모델 provider 연결 상태를 파악하고, 권한/비용/health/사용 영향까지 안전하게 관리함 |

## SCR-07 / 스크랩 / Scrap

| 필드 | 계약 |
| --- | --- |
| Route | `/scrap`, `/scrap/:sourceId` |
| Owner doc | [screens/07-scrap.md](screens/07-scrap.md) |
| Primary objects | `source`, `source_content`, `memory`, `topic`, `file_asset`, `document` |
| Entry points | 사이드바 스크랩, 채팅 URL/파일 첨부, 브라우저/외부 입력, 주제에서 자료 추가, report builder source picker |
| Exits | source 상세, 기억으로 저장, 주제 연결, 파일 상세, 리포트 빌더, 할 일 생성 |
| Reads | source inbox, extraction status, summaries, tags, linked topics/memories/documents, dedupe candidates |
| Writes | source 생성/수정/보관/삭제, retry extraction, summary 생성, relation 연결, memory/document 생성 |
| High-risk edges | 중복 URL canonicalization, 추출 실패와 retry, 긴 영상/PDF 비용, 저작권/원문 저장 범위, source 삭제 후 citation 깨짐 |
| Acceptance summary | URL/영상/기사/파일을 inbox로 모으고, 처리 상태와 요약을 확인하며 기억/주제/문서로 승격함 |

## SCR-08 / 캘린더 / Calendar

| 필드 | 계약 |
| --- | --- |
| Route | `/calendar` |
| Owner doc | [screens/08-calendar.md](screens/08-calendar.md) |
| Primary objects | `calendar_event`, `schedule`, `calendar_suggestion`, `task`, `run` |
| Entry points | 사이드바 캘린더, 오늘 예정 작업, schedule 편집 CTA, task due date, 알림 |
| Exits | event 상세, schedule 편집, run 상세, task 상세, approval 요청 |
| Reads | calendar range, schedule occurrences, date details, suggestions, conflicts, timezone |
| Writes | event 생성/수정/삭제, schedule 활성/비활성/수정, suggestion apply, reschedule |
| High-risk edges | timezone/DST, 반복 schedule occurrence와 원본 rule 혼동, 충돌 일정, 외부 캘린더 권한, 자동 작업 토글 race |
| Acceptance summary | 수동 일정과 자동 작업을 같은 시간축에서 보고, 제안 적용/반복 토글/충돌 처리가 안전하게 동작함 |

## SCR-09 / 할 일 / Todo

| 필드 | 계약 |
| --- | --- |
| Route | `/tasks`, `/tasks/:taskId` |
| Owner doc | [screens/09-todo.md](screens/09-todo.md) |
| Primary objects | `task`, `checklist_item`, `topic`, `run`, `schedule`, `calendar_event` |
| Entry points | 사이드바 할 일, 채팅에서 할 일 생성, 주제 next action, calendar 일정, run 결과 task 생성 |
| Exits | task 상세, run 위임, schedule 등록, calendar 일정, topic, todo map |
| Reads | task list, filters, status/priority, due date, linked topic/run/source, checklist |
| Writes | task 생성/수정/완료/보관/삭제, checklist 변경, 담당/우선순위/due date 변경, run/schedule 생성 |
| High-risk edges | task와 run 상태 혼동, 완료 처리와 AI 실행 중 상태 충돌, 중복 할 일, due date timezone, 삭제된 topic 링크 |
| Acceptance summary | 사용자가 직접 해야 할 항목과 AI에게 맡긴 항목을 구분하고, 목록/상세/위임/일정 연결이 일관됨 |

## SCR-10 / 파일 / Files

| 필드 | 계약 |
| --- | --- |
| Route | `/files`, `/files/:fileId` |
| Owner doc | [screens/10-files.md](screens/10-files.md) |
| Primary objects | `file_asset`, `file_summary`, `source`, `memory`, `topic`, `run` |
| Entry points | 사이드바 파일, 채팅 첨부, 스크랩 파일형 source, run 생성물, 외부 Drive import |
| Exits | file 상세/미리보기, AI 요약, source 연결, memory 생성, topic 연결, chat 첨부 |
| Reads | file list, upload status, folders, preview, summary, linked resources, permissions |
| Writes | upload/import, folder 이동, rename, delete/archive, summary/extraction, relation 변경 |
| High-risk edges | 대용량/지원 안 되는 mime, 업로드 중 이동/삭제, checksum dedupe, 권한 없는 외부 파일, 생성 파일 storage 공개 |
| Acceptance summary | 파일 업로드/외부 가져오기/생성물 관리를 제공하고, 미리보기/요약/연결/권한 상태가 안정적으로 표시됨 |

## SCR-11 / 설정 / Settings

| 필드 | 계약 |
| --- | --- |
| Route | `/settings` |
| Owner doc | [screens/11-settings.md](screens/11-settings.md) |
| Primary objects | `model_route`, `provider_credential`, `cost_policy`, `approval_policy`, `dev_token`, `audit_log` |
| Entry points | 사이드바 설정, provider 연결 CTA, 비용/승인 차단 CTA, 도움말 Dev Mode 문서, local TUI 연결 |
| Exits | OpenRouter API key, Local Codex OAuth, Direct Provider key, 모델 라우팅, 비용/승인 정책, Dev Mode token |
| Reads | provider auth status, model catalog, usage summary, cost limits, approval rules, security checklist, dev tokens |
| Writes | credential 저장/회전/삭제, OAuth 연결/해제, model routing 변경, cost/approval policy 변경, dev token 발급/폐기 |
| High-risk edges | API key 원문 노출, OAuth 만료, provider fallback loop, 비용 한도 race, dev token scope 과다, audit 누락 |
| Acceptance summary | 모델 제공자 인증과 모델 선택, 사용량/비용, 승인 정책, Dev Mode 로컬 접근 토큰을 한 화면에서 안전하게 관리함 |

## SCR-12 / 도움말 / Help

| 필드 | 계약 |
| --- | --- |
| Route | `/help`, `/help/:articleId` |
| Owner doc | [screens/12-help.md](screens/12-help.md) |
| Primary objects | `help_article`, `help_category`, `system_status`, `conversation(help)`, `feedback` |
| Entry points | 사이드바 도움말, 설정의 Dev Mode 도움말, 오류/빈 상태의 도움말 CTA, command copy |
| Exits | article 상세, 도움말 봇, 시스템 상태, 설정/연결/Dev Mode 관련 화면 |
| Reads | help IA, search index, article detail, recent updates, shortcuts, system status |
| Writes | help conversation message, feedback, article helpful vote, copied command event |
| High-risk edges | 오래된 명령어, 권한 없는 문서 노출, 시스템 상태 stale, help bot이 실제 설정 변경 수행, Dev Mode token 안전 경고 누락 |
| Acceptance summary | 사용자가 문서 검색/읽기/도움말 봇/시스템 상태 확인을 통해 막힌 작업을 해결함 |

## SCR-13 / 에이전트 빌더 캔버스 / Agent Builder Canvas

| 필드 | 계약 |
| --- | --- |
| Route | `/agents/new/builder`, `/agents/:agentId/builder` |
| Owner doc | [screens/13-agent-builder-canvas.md](screens/13-agent-builder-canvas.md) |
| Primary objects | `agent`, `agent_version`, `agent_node`, `agent_edge`, `connection`, `skill`, `run` |
| Entry points | 에이전트 생성/편집, template 선택, agent 상세의 builder 열기, run 실패 후 수정 |
| Exits | agent 상세, test chat, version publish, connection 설정, tool/skill picker |
| Reads | agent draft, published version, templates, model/tool catalog, connection health, validation errors |
| Writes | node/edge 추가/수정/삭제, prompt/tool/model/knowledge 설정, save draft, validate, test run, publish |
| High-risk edges | 무한캔버스 저장 race, cycle/invalid graph, draft-published 차이, 권한 없는 tool, test run 비용, version rollback |
| Acceptance summary | 사용자가 Dify 스타일로 agent를 조립하고, 검증/테스트/저장/배포를 version 단위로 안전하게 수행함 |

## SCR-14 / 할 일 맵 / Todo Map

| 필드 | 계약 |
| --- | --- |
| Route | `/tasks/map`, `/topics/:topicId/tasks/map` |
| Owner doc | [screens/14-todo-map.md](screens/14-todo-map.md) |
| Primary objects | `task`, `task_dependency`, `topic`, `run`, `schedule` |
| Entry points | 할 일 화면의 맵 보기, 주제 작업실의 계획 시각화, 채팅에서 계획 펼치기, report/task 생성 후 재정리 |
| Exits | task 상세, task list, run 위임, schedule 생성, topic 작업실 |
| Reads | task graph, dependencies, status, due dates, blocked reasons, AI suggestions |
| Writes | node 생성/수정/삭제, dependency 연결/해제, status/priority 변경, AI 분해 적용, run/schedule 생성 |
| High-risk edges | 순환 dependency, 대량 node 성능, drag 중 저장 충돌, 완료 task가 blocker로 남음, AI 제안 일괄 적용 실패 |
| Acceptance summary | markmap처럼 계획을 시각화하고, 할 일의 관계/차단/우선순위를 편집하며 목록과 상태가 동기화됨 |

## SCR-15 / 리포트 빌더 / Report Builder

| 필드 | 계약 |
| --- | --- |
| Route | `/reports/new`, `/reports/:documentId` |
| Owner doc | [screens/15-report-builder.md](screens/15-report-builder.md) |
| Primary objects | `document`, `document_section`, `source`, `memory`, `citation`, `topic`, `file_asset` |
| Entry points | 스크랩 선택 후 문서 생성, 기억 기반 리포트 생성, 주제 산출물 만들기, 채팅의 문서화 CTA |
| Exits | document 편집/미리보기, source 원문, citation 검증, topic 연결, file export |
| Reads | selected sources, memory candidates, outline, draft sections, citations, export status |
| Writes | document 생성/수정, outline 생성, section 재생성, citation 연결/해제, source 추가/제거, export |
| High-risk edges | citation 없는 문장, source 삭제 후 깨진 근거, 긴 문서 token 비용, 동시 편집 충돌, hallucinated reference, export 실패 |
| Acceptance summary | 여러 스크랩/기억/파일을 근거로 문서 초안을 만들고, 인용/근거/섹션/내보내기가 검증 가능하게 동작함 |

## 4. Cross-Screen 핵심 링크

| 흐름 | 기준 문서 | 관련 화면 |
| --- | --- | --- |
| 채팅에서 지속 작업으로 승격 | [공통 동선 5장](common/navigation-and-cross-screen-flows.md#5-chat-first---workspace-전환) | `SCR-01`, `SCR-02` |
| 채팅에서 CRUD 실행 | [공통 동선 7장](common/navigation-and-cross-screen-flows.md#7-chat---crud) | 모든 화면 |
| 스크랩에서 기억/문서/주제로 연결 | [공통 동선 9장](common/navigation-and-cross-screen-flows.md#9-스크랩---기억---문서---주제-연결) | `SCR-04`, `SCR-07`, `SCR-15`, `SCR-02` |
| Task에서 Run/Schedule로 전환 | [공통 동선 10장](common/navigation-and-cross-screen-flows.md#10-task---runschedule) | `SCR-03`, `SCR-08`, `SCR-09`, `SCR-14` |
| 승인/권한/비용/연결 미비 | [공통 동선 11장](common/navigation-and-cross-screen-flows.md#11-approval-flow) | `SCR-03`, `SCR-06`, `SCR-11` |
| Dev Mode와 로컬 접근 | [설정 상세](screens/11-settings.md#14-dev-mode-상세-요구사항), [도움말 상세](screens/12-help.md#7-dev-mode-튜토리얼-상세) | `SCR-11`, `SCR-12` |
