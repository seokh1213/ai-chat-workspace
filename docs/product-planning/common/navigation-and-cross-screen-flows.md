# 공통 내비게이션과 화면 간 동선 정책

## 1. 문서 목적

이 문서는 Personal Agent Platform의 화면 간 공통 이동, 권한, 승인, 비용, 연결 상태, deep link, 빈/로딩/오류 UX를 한곳에 정리한 개발 착수 기준이다.

개별 화면 문서는 각 화면 안에서 무엇을 보여줄지 정의한다. 이 문서는 사용자가 `채팅 -> 주제 작업실 -> 자료/기억/할 일/맡긴 일 -> 다시 채팅`으로 이동할 때 데이터 scope와 상태가 어떻게 이어져야 하는지 정의한다.

참고 문서:

| 구분 | 문서 |
| --- | --- |
| 상위 PRD | `/docs/personal-agent-platform-prd.md` |
| 화면 상세 | `/docs/product-planning/screens/01-today-control-tower.md` ~ `/docs/product-planning/screens/12-help.md` |

## 2. 전체 IA

PRD의 핵심 구조는 `채팅으로 시작하고, 지속 작업은 주제로 저장하고, 실행은 맡긴 일로 추적하고, 자료는 스크랩/파일/기억으로 축적한다`이다.

### 2.1 최상위 메뉴

| 메뉴 | 역할 | 대표 객체 | 기본 route |
| --- | --- | --- | --- |
| 오늘 | 전역 시작점. 채팅, 최근 주제, 진행 중 run, 예정 schedule 요약 | `conversation`, `topic`, `run`, `schedule` | `/today` |
| 주제 | 오래 살아 있는 작업공간 목록과 상세 진입 | `topic`, `topic_activity`, `artifact` | `/topics` |
| 맡긴 일 | agent/tool 실행 기록, 승인 대기, schedule 실행 관리 | `run`, `approval_request`, `schedule` | `/runs` |
| 기억 | 검증된 장기 지식, 결정, 선호도, 사용 기록 | `memory`, `memory_usage` | `/memory` |
| 에이전트 | agent registry, builder, test chat, 분석 | `agent`, `agent_run` | `/agents` |
| 연결 | provider, MCP, 외부 API, credential, 권한 rule | `connection`, `credential`, `permission_policy` | `/connections` |
| 스크랩 | URL/메모/파일/영상/기사/PDF 원자료 inbox | `source` | `/scrap` |
| 캘린더 | 수동 일정과 자동 schedule을 같은 시간축에서 관리 | `calendar_event`, `schedule` | `/calendar` |
| 할 일 | 사용자 실행 항목, checklist, AI 제안, task 위임 | `task`, `checklist_item` | `/tasks` |
| 파일 | 업로드/외부/생성 파일 관리와 AI 처리 상태 | `file_asset`, `file_summary` | `/files` |
| 설정 | 모델 라우팅, 비용, 승인, 보안, Dev Mode | `model_route`, `cost_policy`, `approval_policy`, `dev_token` | `/settings` |
| 도움말 | 가이드, Dev Mode 문서, 시스템 상태, 도움말 봇 | `help_article`, `system_status` | `/help` |

### 2.2 정보 위계

| 계층 | 설명 | 구현 기준 |
| --- | --- | --- |
| Hub/Workspace | 사용자의 현재 개인 허브 범위 | 모든 주요 객체는 `hubId` 또는 `workspaceId`를 가진다. |
| Conversation scope | 전역/주제/tool/agent test/run 대화 범위 | 메시지 생성 API는 scope를 명시한다. |
| Topic scope | 지속 작업 맥락 | 주제 작업실, 자료 우선순위, memory 검색 우선순위에 반영한다. |
| Execution scope | run/schedule/approval의 실행 단위 | 실행 제어와 로그는 run scope로 닫힌다. |
| Resource scope | source/file/memory/document/task 연결 관계 | 삭제보다 relation 비활성화/해제를 우선한다. |

### 2.3 공통 객체 연결도

```text
conversation
  -> topic
  -> task
  -> run
  -> approval_request
  -> file_asset/source/memory

source(scrap)
  -> memory
  -> document/artifact
  -> topic
  -> task

task
  -> run
  -> schedule
  -> calendar_event

agent
  -> connection
  -> run
  -> artifact/file_asset
```

## 3. 사이드바 정책

### 3.1 표시 원칙

사이드바는 앱 전체 IA의 고정 기준점이다. 화면마다 같은 메뉴 순서와 활성 상태를 유지하고, 화면별 세부 탭은 중앙 영역이나 우측 상세 패널 안에서 처리한다.

| 항목 | 정책 |
| --- | --- |
| 메뉴 순서 | `오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말` 고정 |
| 활성 메뉴 | 현재 route의 최상위 segment 기준. 예: `/topics/{topicId}/workspace`는 `주제` 활성 |
| 알림 배지 | 승인 대기, 연결 만료, 비용 차단, 처리 실패처럼 사용자 조치가 필요한 상태만 표시 |
| 권한 제한 | 접근 불가 메뉴는 숨기기보다 비활성+사유 tooltip을 기본으로 한다. 단, 플랜상 영구 미제공 기능은 숨김 가능 |
| 모바일 | 사이드바는 drawer로 접고, 현재 화면명과 주요 CTA는 상단 바에 유지 |
| 허브 전환 | 허브 변경 시 모든 목록/상세 선택 상태를 새 허브 기준으로 재검증 |

### 3.2 공통 내비 데이터

`GET /api/navigation?hubId={hubId}` 또는 각 초기 화면 API의 `navigation` 필드로 제공한다.

| 필드 | 설명 |
| --- | --- |
| `key` | `today`, `topics`, `runs` 같은 메뉴 key |
| `label` | 사용자 표시명 |
| `route` | 기본 이동 route |
| `enabled` | 메뉴 사용 가능 여부 |
| `disabledReason` | 비활성 사유 |
| `badgeCount` | 사용자 조치가 필요한 count |
| `badgeType` | `approval`, `error`, `warning`, `info` |
| `requiredPermission` | 필요한 permission 또는 plan |

## 4. 채팅 Scope와 화면 승격

### 4.1 채팅 scope

모든 채팅 메시지는 아래 scope 중 하나로 저장한다. scope가 없으면 추적, 비용, 기억 사용, tool call 권한이 흐려지므로 전송 전에 반드시 확정한다.

| Scope | 사용 위치 | 저장 기준 |
| --- | --- | --- |
| `global` | 오늘 화면 전역 채팅 | 특정 주제에 귀속되지 않은 단발 Q&A, 탐색, 명령 |
| `topic` | 주제 빠른 채팅, 주제 작업실 | 특정 topic을 읽거나 수정하는 대화 |
| `tool` | tool 실행 상세 또는 연결 테스트 | 특정 tool/connection 테스트와 결과 설명 |
| `agent_test` | 에이전트 테스트 채팅 | agent draft/deployed version 검증 |
| `run` | 맡긴 일 상세의 `이 작업에 말하기` | 특정 run 제어, 추가 지시, 로그 질의 |
| `help` | 도움말 봇 | 도움말 문서 context 기반 Q&A |

### 4.2 화면 승격 기준

| 사용자 요청/결과 | 기본 위치 | 승격 조건 |
| --- | --- | --- |
| 짧은 답변, 요약, 비교 | 채팅 inline | 사용자가 저장/공유/반복 수정을 원할 때 주제 또는 문서로 승격 |
| 긴 문서, 리포트, 블로그 초안 | 작업면 또는 document | citation, 편집, export가 필요하면 작업실 표면으로 이동 |
| 지도, 일정, 표, 차트, markmap | 작업면 | 채팅 카드에는 preview와 `작업실 열기` CTA 제공 |
| todo/checklist | 채팅 카드 + 할 일 | 반복 관리나 마감이 생기면 `task` 생성 |
| 외부 쓰기, 예약, 결제, 삭제 | 승인 카드 | 승인 전 실행 금지 |
| 장시간/다중 agent 실행 | 맡긴 일 | run 생성 후 진행률, 로그, 비용을 추적 |

## 5. Chat-first -> Workspace 전환

채팅에서 시작한 작업이 지속 관리 대상이 되면 topic/workspace로 전환한다. 전환은 사용자가 맥락 상실 없이 이동하도록 `저장 대상`, `이동 후 볼 표면`, `원래 대화 연결`을 함께 처리한다.

### 5.1 전환 트리거

| 트리거 | 처리 |
| --- | --- |
| 사용자가 “주제로 저장”, “작업실로 열어줘” 요청 | topic 생성 또는 기존 topic 선택 후 workspace 이동 |
| AI 답변이 지도/표/문서/일정 같은 artifact를 생성 | 채팅에 preview card 표시, `작업실 열기` CTA 제공 |
| 기존 주제와 유사한 대화 감지 | “기존 주제에 연결” 제안. 자동 연결은 하지 않음 |
| 채팅에서 파일/스크랩/기억이 반복 참조됨 | topic 생성 또는 연결 제안 |
| task/run/schedule이 생김 | 해당 객체를 만들고 원본 conversation/message와 연결 |

### 5.2 기본 플로우

1. 사용자가 전역 채팅에서 작업을 요청한다.
2. 시스템이 단발 처리인지 지속 작업인지 판단한다.
3. 지속 작업이면 topic 후보를 생성하거나 기존 topic 후보를 제시한다.
4. 사용자가 topic을 확정하면 `topic`을 생성/연결하고 원본 `conversationId`, `messageIds`를 relation으로 저장한다.
5. 작업면이 필요한 경우 `artifact` 또는 topic type별 surface를 생성한다.
6. 사용자를 `/topics/{topicId}/workspace` 또는 유형별 route로 이동한다.
7. 이동 후 주제 작업실의 topic chat에는 원본 요청 요약과 연결된 자료가 표시된다.

### 5.3 API 힌트

| API | 용도 |
| --- | --- |
| `POST /api/conversations/messages` | 전역 메시지 전송. 응답에 `suggestedActions`, `promotionCandidate` 포함 가능 |
| `POST /api/topics` | 새 topic 생성 |
| `POST /api/topics/{topicId}/relations` | conversation/message/source/file/task/run 연결 |
| `POST /api/topics/{topicId}/open` | active topic 설정, `lastOpenedAt` 갱신, 초기 작업면 결정 |
| `POST /api/artifacts` | 문서/표/지도/markmap 등 작업면 생성 |
| `GET /api/topics/candidates?conversationId=` | 기존 topic 후보 조회 |

### 5.4 실패/fallback

| 상황 | UX |
| --- | --- |
| topic 생성 실패 | 채팅은 유지하고 재시도 CTA 제공 |
| artifact 생성 실패 | topic은 열 수 있으면 열고 작업면 영역에 실패 상태 표시 |
| 권한 없음 | 읽기 가능한 기존 topic이면 읽기 전용으로 열고, 쓰기 액션은 비활성 |
| 비용 한도 초과 | topic 전환은 허용하되 AI 생성/분석은 비용 정책에 따라 차단 또는 승인 대기 |
| 연결 미비 | 필요한 connection 카드와 `연결 설정` CTA 표시 |

## 6. Workspace -> Chat

주제 작업실에서는 채팅이 조작면이다. 사용자는 작업면을 직접 조작하거나 chat으로 변경을 요청할 수 있다.

### 6.1 주제 작업실 공통 셸

| 영역 | 역할 |
| --- | --- |
| 좌측 주제 내부 내비 | 대화, 작업, 자료, 결과물, 자동화, 설정 |
| 중앙 | 주제 타입별 주 표면 또는 timeline |
| 우측 | 문서/지도/표/캘린더/상세 패널 같은 작업면 |
| 채팅 패널 | 오른쪽 또는 하단. 현재 topic scope로 메시지 전송 |

### 6.2 채팅으로 돌아가는 경우

| 출발 위치 | 대상 chat | 처리 |
| --- | --- | --- |
| topic 목록의 `빠른 채팅` | `topic` chat | 상세 패널 안에서 짧게 처리 |
| topic 작업실 | `topic` chat | 작업면 변경 요청과 citation을 topic activity에 기록 |
| file/source/memory 상세 | 호출한 chat scope | `채팅에 첨부`, `이 자료로 질문` 액션은 원래 scope로 돌아감 |
| run 상세 | `run` chat | 추가 지시는 해당 run에만 적용 |
| agent 상세 | `agent_test` chat | draft/deployed version을 명시 |

### 6.3 작업면 변경 정책

채팅 명령이 작업면 데이터를 변경할 때는 변경 전후를 사용자가 이해할 수 있어야 한다.

| 변경 유형 | 정책 |
| --- | --- |
| topic 메타데이터 변경 | 즉시 반영 가능. activity 기록 필요 |
| document/artifact 수정 | diff 또는 변경 요약 제공 |
| task/checklist 생성 | 생성 후보를 카드로 보여주고 대량 생성은 확인 필요 |
| schedule 생성/변경 | 다음 실행 시간, timezone, 비용, 승인 정책 표시 |
| 외부 쓰기 | approval flow 필수 |

## 7. Chat -> CRUD

채팅은 컨트롤 타워이지만 모든 CRUD가 즉시 실행되면 안 된다. 읽기/생성/수정/삭제/외부쓰기마다 공통 정책을 적용한다.

### 7.1 CRUD 정책

| 작업 | 예시 | 기본 정책 |
| --- | --- | --- |
| Read | “스크랩 목록 보여줘”, “이 주제 파일 찾아줘” | 권한 범위 안에서 inline 또는 카드 표시 |
| Create | “이 대화를 할 일로 만들어줘” | 후보 생성 후 단건은 즉시, 다건/고위험은 확인 |
| Update | “2일차 일정을 덜 빡세게 바꿔줘” | 변경 요약과 되돌리기 가능 상태 제공 |
| Delete/Forget | “이 파일 삭제”, “이 기억 잊어줘” | 영향 범위 조회 후 승인/확인 필수 |
| External write | “Drive 파일 수정”, “캘린더에 등록” | approval_request 생성 필수 |
| Schedule | “매일 확인해줘” | schedule 생성 전 시간/반복/비용/권한 확인 |

### 7.2 API 힌트

| API | 용도 |
| --- | --- |
| `POST /api/chat/commands/parse` | 자연어 명령을 intent와 target 후보로 해석 |
| `POST /api/chat/commands/preview` | 실행 전 patch, 비용, 권한, 영향 범위 preview |
| `POST /api/chat/commands/execute` | 승인 불필요한 명령 실행 |
| `POST /api/approval-requests` | 승인 필요한 명령 등록 |
| `GET /api/{resource}/{id}/impact` | 삭제/권한 변경/비활성화 전 영향 범위 조회 |

## 8. Tool -> Chat

도구 실행 결과는 사용자가 이해하고 후속 지시를 줄 수 있도록 chat과 연결한다.

| Tool 결과 | Chat 처리 |
| --- | --- |
| 짧은 조회 결과 | 현재 chat에 inline 답변과 citation 표시 |
| 장시간 실행 | run 생성 후 진행 카드 표시. 카드는 `/runs/{runId}`로 deep link |
| 파일/문서 산출물 | file/artifact 생성 후 chat에 preview card 표시 |
| 권한/연결 오류 | 오류 원인, 필요한 connection/scope, 해결 CTA 표시 |
| 비용 초과 | 예상 비용과 대안 모델/샘플 실행 옵션 표시 |
| 실패 후 재시도 가능 | 재시도 CTA와 실패 로그 요약 표시 |

도구 실행 로그는 `run_log`, `connection_log`, `audit_log` 중 성격에 맞게 남긴다. 사용자가 “왜 이렇게 됐어?”라고 물으면 chat 답변에 사용된 tool call, source, memory, file citation을 보여준다.

## 9. 스크랩 -> 기억 -> 문서 -> 주제 연결

자료 흐름의 목적은 원자료를 쌓는 것이 아니라, 나중에 작업에 재사용 가능한 지식과 산출물로 연결하는 것이다.

### 9.1 역할 경계

| 객체 | 역할 | 삭제/변경 영향 |
| --- | --- | --- |
| `source` | 스크랩 inbox의 원자료. URL/메모/파일/영상/기사/PDF | 삭제 시 memory/document citation 신뢰도 재계산 |
| `file_asset` | 업로드/외부/생성 파일 원본 | 권한 변경 시 source/memory/chat 첨부 가능 여부 재검토 |
| `memory` | 검증된 장기 지식, 결정, 선호도 | 잊기 요청 시 AI 참조 제외 또는 삭제 |
| `document`/`artifact` | source/memory/file을 근거로 만든 산출물 | citation coverage와 source anchor 유지 |
| `topic` | 자료가 쓰이는 작업 맥락 | topic 삭제 시 원자료는 유지하고 relation만 비활성화 |

### 9.2 표준 플로우

1. 사용자가 URL/메모/파일을 스크랩한다.
2. `source` 또는 `file_asset + source`가 생성되고 처리 상태가 `pending -> processing -> summarized`로 이동한다.
3. 요약 완료 후 `기억으로 저장`, `주제 연결`, `할 일 만들기`, `리포트에 사용` 액션이 활성화된다.
4. `기억으로 저장`은 후보 memory를 만들고 사용자가 저장할 항목을 확정한다.
5. `리포트에 사용`은 sourceIds와 citation anchor를 document builder에 넘긴다.
6. document/artifact가 만들어지면 source/document relation과 citation을 저장한다.
7. topic에 연결되면 topic 자료 탭, activity, topic chat 검색 우선순위에 반영한다.

### 9.3 연결 API 힌트

| API | 용도 |
| --- | --- |
| `POST /api/sources` | URL/메모 source 생성 |
| `POST /api/sources/upload` | 파일 업로드와 source 생성 |
| `POST /api/sources/{sourceId}/process` | 처리/재처리 job 시작 |
| `POST /api/sources/{sourceId}/memories` | source에서 memory 후보 생성/저장 |
| `POST /api/memories/extract` | 대화/스크랩/파일에서 기억 후보 추출 |
| `POST /api/sources/{sourceId}/topics` | source-topic 연결 |
| `POST /api/files/{fileId}/connections` | file-topic/memory/chat/run 연결 |
| `POST /api/documents` | sourceIds, memoryIds, fileIds 기반 document 생성 |
| `POST /api/documents/{documentId}/topics` | document-topic 연결 |

## 10. Task -> Run/Schedule

task는 사용자가 관리하는 실행 항목이고, run은 AI/agent/tool이 실제 수행한 실행 기록이다. schedule은 run을 미래 또는 반복 실행으로 확장한 규칙이다.

### 10.1 전환 기준

| 출발 | 도착 | 조건 |
| --- | --- | --- |
| 채팅 답변 | `task` | 후속 실행 항목, checklist, 마감이 생김 |
| source/file | `task` | 자료에서 해야 할 일을 추출 |
| task | `run` | 사용자가 `AI에게 맡기기` 실행 |
| task | `schedule` | 반복 모니터링, 정기 리포트, 알림 필요 |
| schedule | `run` | 예약 시간이 도래하거나 `run now` 실행 |
| run | task 업데이트 | run 진행률/결과가 task 활동과 진행률에 반영 |
| run | file/document | 산출물이 파일 또는 문서로 저장 |

### 10.2 상태 동기화

| 객체 | 주요 상태 | 동기화 정책 |
| --- | --- | --- |
| `task` | `backlog`, `today`, `scheduled`, `in_progress`, `blocked`, `waiting_approval`, `done`, `archived` | run 생성 시 `in_progress` 또는 `waiting_approval` 반영 가능 |
| `run` | `queued`, `running`, `waiting_approval`, `paused`, `succeeded`, `failed`, `stopped`, `retrying` | task, today, calendar, agent analytics에 이벤트 발행 |
| `schedule` | `active`, `paused`, `failed`, `archived` | calendar_event와 upcoming schedule 카드 갱신 |
| `calendar_event` | `scheduled`, `running`, `completed`, `failed`, `needs_approval` | schedule/run 상태를 시간축에 표시 |

### 10.3 API 힌트

| API | 용도 |
| --- | --- |
| `POST /api/tasks/{taskId}/delegate` | task 기반 run 또는 approval_request 생성 |
| `POST /api/runs` | 직접 run 생성 |
| `GET /api/runs/{runId}` | run 상세 |
| `POST /api/runs/{runId}/messages` | run scope 추가 지시 |
| `POST /api/schedules` | 반복/예약 작업 생성 |
| `PATCH /api/schedules/{scheduleId}` | 반복 규칙, 시간, 승인 정책 수정 |
| `PATCH /api/schedules/{scheduleId}/status` | active/paused 전환 |
| `POST /api/schedules/{scheduleId}/run-now` | 즉시 실행 |
| `POST /api/calendar/events` | 수동 일정 생성 |
| `GET /api/calendar/events?from=&to=&topicId=` | 일정/run/schedule 시간축 조회 |

## 11. Approval Flow

승인은 자동화와 안전의 경계다. 외부 쓰기, 비용 초과, 삭제, 권한 완화, 예약 실행, Dev Mode write는 공통 승인 모델을 사용한다.

### 11.1 승인 필요 조건

| 조건 | 예시 |
| --- | --- |
| 외부 쓰기 | Drive 파일 수정/삭제, 외부 캘린더 등록, 외부 API 변경 |
| 비용 초과 | 월/일/run 한도 초과, 고비용 모델 전환 |
| 삭제/잊기 | file/source/memory/task/topic 삭제 또는 완전 삭제 |
| 권한 완화 | 파일 공유, AI 참조 허용, connection write scope 확대 |
| 예약/반복 실행 | schedule 생성, 반복 자동 작업 활성화, schedule 권한 변경 |
| Dev Mode write | TUI/MCP/HTTP API write scope 호출 |
| 결제/계정 변경 | provider 결제, credential export, 계정 설정 변경 |

### 11.2 승인 카드 표준 필드

| 필드 | 설명 |
| --- | --- |
| `approvalId` | 승인 요청 ID |
| `requestType` | `external_write`, `cost_limit`, `permission`, `delete`, `schedule_change`, `dev_write` |
| `title` | 사용자 표시 제목 |
| `payloadSummary` | 변경 요약 |
| `targetType`, `targetId`, `targetLabel` | 영향 대상 |
| `actorType`, `actorId` | 요청 주체. user/agent/system/schedule |
| `estimatedCost` | 예상 비용, 통화, 추정 여부 |
| `permissionScope` | 필요한 scope |
| `impactSummary` | 영향받는 topic/file/memory/run/schedule 수 |
| `expiresAt` | 만료 시각 |
| `status` | `pending`, `approved`, `rejected`, `expired`, `cancelled` |

### 11.3 승인 처리 정책

| 상황 | 처리 |
| --- | --- |
| 승인 | 원 작업을 실행하거나 paused run/schedule을 재개한다. audit log 기록 |
| 거절 | 원 작업은 실행하지 않고 요청자에게 거절 결과 전달 |
| 만료 | run은 `paused` 또는 `failed`로 전환. schedule은 해당 occurrence skip |
| 승인 중 대상 변경 | 최신 impact를 재계산하고 재승인 필요 |
| 권한 없음 | 승인 버튼 비활성, 필요한 역할 안내 |
| 비용 추정 불가 | 고비용 가능성이 있으면 fail-closed 또는 샘플 실행만 허용 |

## 12. 권한/비용/연결 미비 시 공통 UX

### 12.1 공통 원칙

문제 원인이 다르면 같은 “실패”로 보이면 안 된다. 사용자 조치가 가능한 순서로 `권한`, `연결`, `비용`, `일시 장애`, `데이터 없음`을 구분해 보여준다.

| 원인 | 공통 UI | 대표 CTA |
| --- | --- | --- |
| 권한 없음 | 읽기 전용 배지, 비활성 액션, 필요한 권한 설명 | 권한 요청, 설정 열기 |
| 승인 필요 | 승인 카드, 영향 범위, 비용/권한 scope | 승인, 거절 |
| 비용 한도 초과 | 한도/예상 비용/사용량 표시 | 비용 설정, 저비용 대안, 승인 요청 |
| 연결 미비 | 필요한 provider/tool/credential 이름과 상태 표시 | 연결 설정, 재인증, health check |
| capability 불일치 | 작업에 필요한 capability와 현재 모델/도구 차이 표시 | 모델 변경, 도구 연결 |
| rate limit/일시 장애 | 재시도 가능 시간, fallback 후보 표시 | 재시도, fallback 선택 |
| 민감 데이터 | AI 참조/외부 전송 전 확인 | 제한 유지, 승인 후 진행 |

### 12.2 실행 전 검증 순서

1. 사용자가 해당 resource를 읽을 수 있는지 확인한다.
2. 쓰기/삭제/외부 전송이면 permission policy를 확인한다.
3. 필요한 connection이 `connected` 또는 사용 가능한 fallback 상태인지 확인한다.
4. capability가 작업과 맞는지 확인한다.
5. 비용 정책과 run/schedule 한도를 확인한다.
6. 승인 필요 여부를 계산한다.
7. 실행 또는 approval_request 생성을 진행한다.

## 13. Deep Link와 Fallback

### 13.1 URL 상태 원칙

목록 화면은 검색/필터/선택 상세를 URL로 복원할 수 있어야 한다. 직접 접근 시 목록과 상세를 병렬 조회하고, 상세 조회 실패가 목록 전체 실패로 번지면 안 된다.

| 화면 | URL 예시 | 의미 |
| --- | --- | --- |
| 오늘 | `/today` | 전역 시작점 |
| 주제 | `/topics?type=travel` | 주제 목록 필터 |
| 주제 상세 | `/topics/{topicId}` | 목록+상세 패널 선택 |
| 주제 작업실 | `/topics/{topicId}/workspace?surface=map` | topic 작업실과 작업면 |
| 맡긴 일 | `/runs?status=waiting_approval` | 승인 대기 run 목록 |
| run 상세 | `/runs/{runId}?tab=logs` | run 상세 탭 |
| 기억 | `/memory/{memoryId}?tab=usage` | 기억 상세와 사용 기록 |
| 스크랩 | `/scrap/{sourceId}?tab=script` | source 상세 탭 |
| 캘린더 | `/calendar?from=2026-06-01&view=week&topicId=topic_123` | 기간/보기/주제 필터 |
| 할 일 | `/tasks/{taskId}?view=board` | task 상세 선택 |
| 파일 | `/files/{fileId}?tab=connections` | 파일 상세 연결 탭 |
| 설정 | `/settings?tab=cost` | 설정 탭 |
| 도움말 | `/help/{articleSlug}` | 도움말 문서 |

### 13.2 Fallback 정책

| 상황 | Fallback |
| --- | --- |
| 리소스 삭제됨 | 목록으로 이동하고 삭제/복구 가능 상태 안내 |
| 권한 없음 | 접근 가능한 상위 목록으로 이동, 요청 권한 CTA 표시 |
| 보관됨 | 읽기 가능하면 보관 배지로 상세 표시 |
| 필터와 선택 리소스 불일치 | 선택 리소스 우선 표시하고 필터 밖임을 안내 |
| 허브 불일치 | 현재 허브에서 접근 불가 표시, 허브 전환 가능하면 제안 |
| route 버전 변경 | 가장 가까운 상위 route로 redirect |
| connection 만료 | 대상 화면은 열되 실행성 액션 비활성, 재인증 CTA |

## 14. Empty / Loading / Error 공통 상태

### 14.1 Empty

| 상태 | UX |
| --- | --- |
| 최초 빈 상태 | 화면 목적을 한 줄로 설명하고 첫 CTA 제공 |
| 검색 결과 없음 | 검색어/필터 요약, 필터 초기화, 생성 CTA |
| 타입/탭 결과 없음 | 해당 탭에 맞는 예시와 추가 CTA |
| 권한 때문에 비어 보임 | “권한이 없어 일부 항목이 숨겨짐” 안내 |

### 14.2 Loading

| 영역 | UX |
| --- | --- |
| 최초 진입 | 주요 레이아웃은 유지하고 목록/카드 skeleton 표시 |
| 상세 패널 | 선택 즉시 상세 skeleton. 목록은 유지 |
| 검색/필터 | 기존 결과를 유지하고 부분 로딩 표시 |
| 장시간 처리 | 진행률, 현재 단계, 취소 가능 여부 표시 |
| 실시간 상태 | run/file/source 처리 이벤트는 polling 또는 server event로 갱신 |

### 14.3 Error

| 오류 | UX |
| --- | --- |
| 목록 실패 | 재시도. 캐시가 있으면 읽기 전용 표시 |
| 상세 실패 | 목록 유지, 우측 패널에서 재시도 |
| 쓰기 실패 | 낙관 업데이트 되돌림, 실패 사유와 재시도 |
| 권한 실패 | 필요한 권한/scope 표시 |
| 연결 실패 | 연결 화면 deep link와 health check CTA |
| 비용 실패 | 비용 설정 deep link와 저비용 대안 |
| 부분 실패 | 실패한 섹션만 오류 처리. 화면 전체를 비우지 않음 |

## 15. Route/API 공통 힌트

### 15.1 공통 API 규칙

| 규칙 | 설명 |
| --- | --- |
| 목록/상세 분리 | 목록은 카드 렌더링용 경량 필드, 상세는 선택 시 별도 조회 |
| impact API | 삭제, 권한 변경, 비활성화, 비용 한도 축소 전 `GET .../impact` 제공 |
| idempotency | 생성/저장/승인/업로드 완료/스케줄 토글은 중복 요청 방지 key 지원 |
| audit log | 승인, 권한, credential, token, 비용 정책, run 제어, 삭제는 감사 로그 기록 |
| relation API | 객체 삭제보다 relation 생성/해제를 명시적으로 제공 |
| request id | 외부 API/모델/provider 오류는 사용자 지원을 위해 request id 노출 |
| permission summary | 목록 응답에도 액션 활성화 판단에 필요한 권한 요약 포함 |

### 15.2 공통 이벤트

| 이벤트 | 사용처 |
| --- | --- |
| `conversation.message_created` | 채팅 timeline, topic activity |
| `topic.relation_created` | 주제 count, 자료 탭, activity |
| `source.processing_completed` | 스크랩, 기억 후보, topic 자료 |
| `memory.created` | 기억 목록, topic memory, chat context |
| `file.summary_completed` | 파일 목록, chat 첨부 가능 상태 |
| `task.created` | 할 일, today, topic next action |
| `task.delegated` | run 생성, task 진행률 |
| `run.status_changed` | 오늘 우측 패널, 맡긴 일, 캘린더, task |
| `schedule.status_changed` | 오늘 예정 작업, 캘린더, 맡긴 일 |
| `approval.requested` | 사이드바 배지, 오늘, 맡긴 일 |
| `connection.status_changed` | 연결, agent 실행 가능 여부, schedule 검증 |
| `cost.limit_reached` | 설정, 실행 차단, 승인 요청 |

## 16. 수용 기준

### 16.1 IA와 사이드바

1. 모든 주요 화면은 같은 사이드바 메뉴 순서와 활성 상태 정책을 따른다.
2. 승인 대기, 연결 만료, 비용 차단, 처리 실패는 사용자 조치가 필요한 메뉴에 배지로 표시된다.
3. 권한 없는 메뉴와 액션은 숨김/비활성 정책이 일관되며 사유가 표시된다.

### 16.2 채팅과 작업실 전환

1. 전역 채팅에서 topic/workspace로 승격할 때 원본 conversation/message relation이 저장된다.
2. topic 작업실에서 보내는 메시지는 `topic` scope로 저장되고 topic activity에 반영된다.
3. 파일/source/memory/run/agent에서 chat으로 돌아갈 때 호출한 chat scope가 유지된다.
4. 화면 승격이 실패해도 원래 채팅 입력과 결과는 사라지지 않는다.

### 16.3 자료 연결

1. 스크랩 처리 완료 후 기억 저장, 주제 연결, 할 일 만들기, 리포트 사용 액션이 정책에 맞게 활성화된다.
2. file/source/memory/document/topic relation은 각 상세 화면과 topic activity에서 일관되게 조회된다.
3. 원자료 삭제나 권한 변경 시 연결 memory/document/task/topic의 영향이 표시된다.
4. citation은 source/file의 원문 anchor를 유지한다.

### 16.4 Task/Run/Schedule

1. task에서 `AI에게 맡기기` 실행 시 run 또는 approval_request가 생성된다.
2. run 상태 변화는 task, today, delegated work, calendar에 반영된다.
3. schedule은 다음 실행 시간, timezone, 승인 정책, 비용 한도를 가진다.
4. schedule 토글/수정은 calendar와 runs 목록에 동기화된다.

### 16.5 승인/권한/비용/연결

1. 외부 쓰기, 삭제, 권한 완화, 비용 초과, Dev Mode write는 approval_request 없이 실행되지 않는다.
2. 승인 카드에는 대상, 변경 요약, 예상 비용, 권한 scope, 영향 범위, 만료 시간이 표시된다.
3. 실행 전 connection health, credential, capability, permission, cost policy를 검증한다.
4. 비용 정보가 추정이면 실제 비용처럼 오인되지 않게 표시한다.
5. connection 미비는 필요한 provider/tool과 해결 route를 함께 보여준다.

### 16.6 Deep Link와 상태

1. 목록+상세 화면은 직접 URL 접근 시 선택 항목과 탭을 복원한다.
2. 삭제/권한 없음/허브 불일치/보관 상태 deep link는 상위 화면 fallback을 제공한다.
3. empty/loading/error 상태는 목록, 상세, 우측 패널, 처리 job 단위로 분리된다.
4. 검색/필터 중 기존 결과를 불필요하게 비우지 않는다.

## 17. 오픈 질문

| 질문 | 초기 제안 |
| --- | --- |
| `workspace` route를 `/topics/{topicId}/workspace`로 고정할지, topic type별 route를 둘지 | MVP는 공통 route로 시작하고 surface query로 분기 |
| 전역 채팅에서 topic 자동 연결을 허용할지 | 자동 연결은 하지 않고 후보 제안 후 사용자 확정 |
| 작업면 artifact의 공통 객체명을 `artifact`와 `document`로 나눌지 | 문서형은 `document`, 지도/표/markmap 등은 `artifact`, 공통 relation은 `artifact` 상위 타입 검토 |
| 승인 정책의 기본값 | 읽기 자동, 내부 쓰기 확인, 외부 쓰기/삭제/비용 초과 승인 필요 |
| 비용 한도 초과 시 진행 중 run 처리 | 기본은 pause 후 approval_request. 실시간 취소 불가 provider는 완료 후 차단 상태 기록 |
| source 삭제 시 연결 memory를 자동 삭제할지 | 자동 삭제 금지. 출처 제거와 신뢰도 재계산 후 사용자 확인 |
| 파일 권한이 topic 권한보다 좁을 때 주제 연결 허용 여부 | 연결은 허용하되 topic 멤버에게 잠금 상태 표시 |
| Dev Mode HTTP API write가 Web UI 승인 카드를 띄울 수 없을 때 | API 응답으로 `approval_required`와 approval URL 반환 |
| 도움말 봇이 실제 설정/연결 변경까지 수행할지 | MVP는 안내와 deep link만, 실행은 해당 화면에서 처리 |
| 모바일에서 topic 작업실의 채팅과 작업면 배치 | 하단 chat drawer + surface full screen을 기본으로 검토 |
