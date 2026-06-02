# 13. 에이전트 생성/편집 무한캔버스 화면 상세 기획

## 1. 화면 목적

`에이전트 생성/편집 무한캔버스`는 Agent Registry에서 선택한 에이전트의 실행 흐름을 노드와 엣지로 설계하고, 테스트한 뒤 배포하는 고급 편집 화면이다. 단순 prompt 입력 폼이 아니라 LLM 판단, 도구 호출, 조건 분기, 승인 요청, 저장, 스케줄 실행을 하나의 그래프로 조립하는 workflow builder다.

PRD 기준으로 이 화면은 `에이전트` 탭 하위의 고급 편집면이며, 개인 워크스페이스의 `기억`, `스크랩`, `연결`, `맡긴 일`, `캘린더`, `주제`를 실행 그래프에 연결한다. 사용자는 “어떤 입력을 받아 어떤 판단을 하고, 어떤 도구를 호출하고, 언제 사람 승인을 받아 어디에 결과를 남길지”를 시각적으로 확인해야 한다.

| 사용자 문제 | 화면에서의 해결 방식 |
| --- | --- |
| 에이전트 동작이 prompt 하나에 숨겨져 추적하기 어려움 | 시작, LLM, 검색, 승인, 지도 반영, 저장 같은 실행 단계를 노드로 분리 |
| 도구 권한과 외부 쓰기 위험을 배포 전 확인하기 어려움 | 노드별 permission, schema, 테스트 로그, 승인 노드 표시 |
| 실패 원인이 모델인지 도구인지 분기 조건인지 모름 | 노드 카드에 성공률, 지연 시간, 토큰, 입출력 로그를 표시 |
| 자동화 배포 전 품질을 확인하기 어려움 | 초안 저장, 캔버스 테스트, 노드별 실행 로그, 배포 lifecycle 제공 |
| 반복 실행과 맡긴 일 연결이 흐릿함 | 스케줄 노드와 run template을 연결하고 배포 후 registry/schedule/run에 반영 |
| 복잡한 그래프에서 현재 구조를 잃기 쉬움 | 자동 레이아웃, 미니맵, 줌, fit view, undo/redo 제공 |

## 2. 화면 범위와 전제

- 이 문서는 `/docs/personal-agent-platform-prd.md`와 `docs/assets/agent-platform-prd/real-13-agent-builder-canvas.png` 기준의 PC 웹 상세 기획이다.
- 소유 파일은 이 문서 하나다. 다른 화면 문서와 실제 코드 수정은 범위 밖이다.
- 화면명은 한국어 `에이전트 생성/편집 무한캔버스`, 내부 route 후보는 `/agents/:agentId/builder` 또는 `/agents/:agentId/canvas`를 사용한다.
- 좌측 글로벌 내비게이션은 공통 shell로 간주한다.
- MVP에서는 이미지에 보이는 `여행 플래너 편집` 예시를 대표 happy path로 둔다.
- 이 화면에서 편집하는 대상은 배포 중인 agent 자체가 아니라 `agent_version`의 draft graph다. 배포 전까지 기존 활성 버전에는 영향을 주지 않는다.
- 테스트 실행은 실제 run과 분리된 `canvas_test_run`으로 기록하되, 모델/API 비용은 비용 집계에 포함한다.
- 외부 쓰기, 결제, 파일 삭제, 예약 실행은 테스트에서도 기본 mock 또는 승인 필요 상태로 처리한다.

## 3. 정보 구조

### 3.1 전체 레이아웃

이미지 기준 PC 화면은 5개 영역으로 구성된다.

| 영역 | 구성 | 역할 |
| --- | --- | --- |
| 좌측 글로벌 내비게이션 | 허브명, 알림, 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말, 사용자 플랜 | 앱 전체 이동. 현재 메뉴 `에이전트` 활성화. |
| 상단 헤더 | breadcrumb `에이전트 > 여행 플래너 편집`, 이름 편집 아이콘, 저장 상태, 저장/테스트/배포/더보기 | 현재 agent draft 식별, 저장/테스트/배포 제어. |
| 좌측 컴포넌트 팔레트 | 탭 `플로우/구성/지식/권한/기록`, 검색, 기본 블록, 고급 블록, 접기 버튼 | 캔버스에 추가 가능한 node type 탐색. |
| 중앙 무한캔버스 | 캔버스 툴바, 노드, 엣지, 자동 레이아웃 토글, 미니맵, 줌 컨트롤, pan 모드, fit view, draft selector | workflow graph 편집과 구조 확인. |
| 우측 노드 설정 패널 | 선택 노드 헤더, prompt/model/parameter/permission/schema/log | 선택 노드의 상세 설정과 테스트 로그 확인. |

### 3.2 화면에 보이는 주요 기능 추출

| 위치 | 화면 요소 | 기능 요구사항 |
| --- | --- | --- |
| 좌측 메뉴 | `에이전트` 활성 상태 | 현재 편집 화면이 Agent Registry 하위임을 유지 |
| breadcrumb | `에이전트 > 여행 플래너 편집` | registry로 복귀 가능, agent 이름 직접 수정 가능 |
| 상단 탭 | `플로우`, `구성`, `지식`, `권한`, `기록` | 같은 agent draft의 편집 관점을 전환 |
| 저장 상태 | `저장됨 1분 전` + 정상 아이콘 | autosave 성공/실패/저장 중 상태 표시 |
| 상단 액션 | `저장`, `테스트`, `배포`, `...` | 수동 저장, 전체 그래프 테스트, 배포, 가져오기/내보내기/버전 복원 |
| 팔레트 | `컴포넌트`, 검색, 접기 | 노드 검색과 패널 축소 |
| 기본 블록 | LLM, 도구 호출, 조건 분기, 검색, 스크랩 읽기, 지도 업데이트, 승인 요청, 스케줄 | MVP node type 후보 |
| 고급 블록 | 코드 실행 | sandbox/권한이 필요한 고급 node type |
| 캔버스 툴바 | undo/redo, 보기 모드 아이콘, 자동 레이아웃 토글 | 편집 이력과 배치 제어 |
| draft selector | `초안` 드롭다운 | draft/deployed/previous version 보기 전환 |
| 캔버스 노드 | 시작, 의도 분류, 여행 자료 검색, 일정 생성, 지도 반영, 사용자 승인, 저장 | 여행 플래너 실행 그래프 예시 |
| 노드 상태 | 우상단 초록 체크, 선택 노드 파란 테두리, 승인 노드 노란 테두리 | validation/test status와 선택 상태 표시 |
| 엣지 | 실선 흐름, 점선 조건 흐름, 승인됨/거절됨 라벨 | 성공/조건/승인 분기 표현 |
| 미니맵 | 좌하단 전체 그래프 요약, 현재 viewport 표시, 하단 아이콘 | 큰 그래프 탐색, 검색/fit/minimap 토글 |
| 줌 | `-`, `100%`, `+`, pan hand, sparkle action | 확대/축소, pan 모드, 자동 정리/AI 제안 |
| 우측 패널 | `일정 생성` LLM 노드 설정 | 선택 node의 prompt, model, 권한, schema, 테스트 로그 편집 |
| 노드 로그 | `성공 2.1s`, 입력/출력 항목 수, 1분 전 | 최근 테스트 실행 결과 확인 |

### 3.3 상단 탭 구조

| 탭 | 목적 | 주요 내용 |
| --- | --- | --- |
| 플로우 | 노드/엣지 기반 실행 흐름 편집 | 이미지의 현재 화면. 팔레트, 캔버스, 노드 설정 패널 표시 |
| 구성 | agent 기본 정보와 실행 설정 편집 | 이름, 설명, 아이콘, 실행 방식, 공개 범위, 비용 한도, 기본 모델 |
| 지식 | agent가 참조할 source/topic/file 선택 | 기억, 스크랩, 파일, 주제, 지식 베이스 연결과 indexing 상태 |
| 권한 | agent와 node의 effective permission 관리 | read/write/approve-required/blocked, connection override, 정책 충돌 |
| 기록 | version/run/test/audit history 확인 | draft 저장 이력, 배포 이력, 테스트 run, 실패 로그, 승인 기록 |

탭 전환 시 현재 draft의 저장되지 않은 변경이 있으면 autosave를 먼저 시도한다. 실패하면 `저장 후 이동`, `이동하고 변경 유지`, `취소` 중 선택하게 한다. `플로우` 외 탭에서도 상단 저장/테스트/배포 액션은 유지한다.

## 4. 진입 / 종료 / 전환 동선

### 4.1 진입 동선

| 진입점 | 처리 |
| --- | --- |
| Agent Registry 카드 `편집` | 해당 agent의 최신 draft가 있으면 draft를 열고, 없으면 배포 버전에서 새 draft 생성 |
| Agent Registry 상세 `무한캔버스에서 편집` | 선택 agent context를 유지하고 `플로우` 탭으로 진입 |
| `+ 새 에이전트 만들기` 고급 모드 | 기본 템플릿 graph와 `초안` 상태로 진입 |
| 템플릿/갤러리 복제 직후 | 복제된 draft graph를 열고 필수 연결/권한 미설정 노드를 강조 |
| 맡긴 일 실패 로그의 `그래프에서 보기` | 실패 run이 실행한 agent version을 read-only로 열고 실패 노드를 선택 |
| 연결 화면의 영향받는 agent 클릭 | 해당 connection/tool을 쓰는 노드를 하이라이트하고 권한 탭 또는 플로우 탭으로 진입 |
| URL 직접 접근 | agentId/versionId 권한 확인 후 열기. 삭제/권한 없음이면 registry로 fallback |

### 4.2 종료 동선

| 종료 액션 | 결과 |
| --- | --- |
| breadcrumb `에이전트` 클릭 | Agent Registry로 복귀. 마지막 선택 agent와 builder 탭 유지 |
| 좌측 메뉴 이동 | 저장되지 않은 변경 확인 후 이동. draft는 폐기하지 않고 보존 |
| 브라우저 뒤로가기 | 이전 화면으로 이동하되 unsaved change guard 적용 |
| 우측 패널 닫기 | 선택 노드 해제, 캔버스 폭 확장 |
| 배포 완료 | registry 카드와 상세 패널이 최신 deployed version을 반영. 필요하면 registry로 복귀 CTA 제공 |
| read-only 버전 보기 종료 | 최신 draft 또는 registry 상세로 복귀 |

### 4.3 내부 전환

| 전환 | 트리거 | 기대 동작 |
| --- | --- | --- |
| 노드 추가 | 팔레트 블록 클릭/드래그 | viewport 중앙 또는 drop 위치에 노드 생성, 필수 설정 누락 상태 표시 |
| 노드 선택 | 캔버스 노드 클릭 | 우측 패널을 해당 node type 설정으로 갱신 |
| 노드 이동 | 드래그 | grid snap 적용 가능, 변경 이력에 기록 |
| 엣지 연결 | source handle에서 target handle로 드래그 | schema compatibility 검증 후 연결 생성 |
| 엣지 선택 | 엣지 클릭 | 우측 패널 또는 inline popover에서 조건/라벨/fallback 설정 |
| 팔레트 접기 | `<<` 클릭 | 아이콘 rail만 남기고 캔버스 영역 확장 |
| 우측 패널 확장 | expand 아이콘 | 설정 패널을 넓게 열어 prompt/schema/log 편집 |
| draft selector 변경 | `초안` 드롭다운 | 초안, 배포 버전, 이전 버전을 전환. 이전 버전은 기본 read-only |
| 자동 레이아웃 토글 | 캔버스 툴바 | 노드 이동 후 자동 정렬 적용 여부 변경 |
| 테스트 실행 | 상단 `테스트` | 전체 그래프 dry run 또는 test input 모달 실행 |
| 배포 | 상단 `배포` | validation, 테스트 결과, 권한/비용/연결 영향 확인 후 배포 |

## 5. 핵심 시나리오

### 5.1 여행 플래너 흐름을 편집하고 테스트

1. 사용자가 Agent Registry에서 `여행 플래너`의 `무한캔버스에서 편집`을 선택한다.
2. 시스템은 최신 draft version을 열고 `플로우` 탭을 표시한다.
3. 캔버스에는 `시작 → 의도 분류 → 여행 자료 검색 → 일정 생성 → 지도 반영 → 사용자 승인 → 저장` 흐름이 보인다.
4. 사용자가 `일정 생성` LLM 노드를 선택한다.
5. 우측 패널에서 prompt, model `GPT-4o`, temperature `0.3`, max token `2000`, input/output schema, 최근 테스트 로그를 확인한다.
6. 사용자가 prompt에 “현실적인 시간 배분” 조건을 보강한다.
7. autosave가 draft graph를 저장하고 상단 상태가 `저장됨 n초 전`으로 갱신된다.
8. 사용자가 `테스트`를 누르고 여행 계획 요청 예시를 입력한다.
9. 시스템은 node별 실행 상태, 토큰, 지연 시간, 입력/출력 값을 갱신한다.
10. 테스트가 성공하면 사용자는 `배포`를 눌러 registry의 활성 버전을 갱신한다.

### 5.2 새 도구 호출 노드 추가

1. 사용자가 팔레트에서 `도구 호출`을 캔버스에 드래그한다.
2. 도구 선택 popover에서 연결된 MCP/API tool을 검색한다.
3. 선택한 도구의 connection 상태, permission, input schema가 우측 패널에 표시된다.
4. 이전 노드 출력과 도구 입력 schema가 맞지 않으면 mapping UI가 열린다.
5. 사용자가 필드 mapping과 실패 fallback edge를 설정한다.
6. node validation이 통과하면 초록 체크로 표시된다.
7. 테스트 실행 시 해당 도구 호출 로그가 node log에 남는다.

### 5.3 조건 분기와 승인 노드 구성

1. 사용자가 `의도 분류` 노드의 출력 `intent`에서 엣지를 끌어 `사용자 승인` 노드로 연결한다.
2. 엣지 조건을 `intent == "booking" 또는 external_write_required == true`로 설정한다.
3. `사용자 승인` 노드에 승인 문구, 승인 payload, 만료 시간, 거절 fallback을 설정한다.
4. 승인됨 edge는 `저장` 또는 외부 쓰기 node로 연결한다.
5. 거절됨 edge는 대체안 제안 또는 종료 node로 연결한다.
6. 테스트에서 승인 대기 상태가 발생하면 실행은 `waiting_approval`로 멈추고 node 로그에 approval_request가 표시된다.

### 5.4 스케줄 노드로 반복 자동화 배포

1. 사용자가 `스케줄` 노드를 추가한다.
2. 반복 주기, timezone, 실행 시간, retry 정책, 비용 상한, 승인 정책을 설정한다.
3. 스케줄 노드는 graph 시작점 또는 특정 subflow 시작점에 연결된다.
4. 배포 전 시스템은 캘린더 중복, 연결 권한, 비용 한도, 승인 정책을 검증한다.
5. 배포 완료 후 `schedule`과 `run_template`이 생성되고 캘린더/맡긴 일에 노출된다.
6. schedule을 중지하거나 수정하면 해당 agent version과 registry 카드의 자동화 상태가 함께 갱신된다.

### 5.5 실패한 run을 그래프에서 디버깅

1. 사용자가 맡긴 일의 실패 run에서 `그래프에서 보기`를 클릭한다.
2. 화면은 실패 당시의 deployed version을 read-only로 연다.
3. 실패한 노드가 빨간 상태로 강조되고 우측 패널은 해당 run log를 표시한다.
4. 사용자는 실패 입력, provider 오류, tool response, schema mismatch, permission denial을 확인한다.
5. `이 버전에서 새 초안 만들기`를 누르면 read-only 버전에서 draft를 분기한다.
6. 수정 후 테스트/배포하면 새 version이 생성되고 기존 실패 run은 변경되지 않는다.

## 6. 컴포넌트별 상세 기능

### 6.1 좌측 글로벌 내비게이션

| 요소 | 기능 |
| --- | --- |
| 허브명 `내 AI 허브` | 현재 workspace/허브 context 표시. 허브 변경 시 draft 저장 확인 |
| 알림 | 승인 대기, 테스트 실패, 연결 만료, 비용 한도 경고 표시 |
| 메뉴 `에이전트` | 현재 builder가 Agent Registry 하위임을 표시 |
| 설정/도움말 | 권한 정책, 모델/비용 설정, builder 사용 가이드로 이동 |
| 사용자 플랜 | 고급 노드, 코드 실행, 배포 가능 agent 수 같은 플랜 제한 표시 |

### 6.2 상단 헤더

| 요소 | 기능 |
| --- | --- |
| breadcrumb `에이전트` | Agent Registry로 복귀 |
| 제목 `여행 플래너 편집` | agent displayName. 연필 아이콘으로 inline rename |
| 저장 상태 | 저장 중, 저장됨 n분 전, 저장 실패, 오프라인 보류 표시 |
| `저장` | 현재 draft graph 수동 저장 |
| `테스트` | 전체 graph test run 실행. test input 모달 또는 우측 테스트 패널 열기 |
| `배포` | validation, 테스트 결과, 영향 분석 후 deployed version 생성 |
| 배포 드롭다운 | 배포, 배포 예약, 이전 버전으로 rollback, changelog 보기 |
| 더보기 | graph 가져오기/내보내기, 복제, 템플릿 저장, 버전 기록, 삭제/보관 |

저장은 draft에만 적용된다. 배포는 별도 액션이며, 테스트 성공 이력이 없거나 필수 validation이 실패하면 배포 버튼은 disabled 또는 confirmation-required 상태가 된다.

### 6.3 팔레트

팔레트는 추가 가능한 node type을 보여준다. 이미지에는 `컴포넌트` 제목, 검색창, `기본 블록`, `고급 블록`, 접기 버튼이 보인다.

| 블록 | 목적 | 기본 설정 |
| --- | --- | --- |
| 시작 | 사용자 입력 또는 schedule trigger를 graph 입력으로 변환 | input schema, trigger type |
| LLM | prompt 기반 판단/생성 | model, prompt, parameter, input/output schema |
| 도구 호출 | 외부 도구나 MCP API 호출 | toolId, connectionId, permission, retry |
| 조건 분기 | 입력/출력 값에 따라 흐름 분기 | condition expression, default edge |
| 검색 | 지식베이스나 웹에서 정보 검색 | source scope, query mapping, result limit |
| 스크랩 읽기 | 스크랩 콘텐츠를 읽고 요약/추출 | source filter, content range |
| 지도 업데이트 | 여행 장소/경로를 지도 작업면에 반영 | map target, place schema, route option |
| 승인 요청 | 사용자에게 외부 쓰기/비용/예약 승인을 요청 | approval payload, expiry, approve/reject edge |
| 스케줄 | 반복 또는 예약 실행 생성 | cron/rrule, timezone, approval policy |
| 코드 실행 | sandbox에서 코드 또는 스크립트 실행 | runtime, timeout, filesystem/network permission |

검색창은 node name, description, capability, connection name 기준으로 필터링한다. 검색 결과가 없으면 `연결에서 도구 추가` CTA를 제공한다. 권한이나 플랜 때문에 사용할 수 없는 node는 disabled 상태로 표시하고 이유를 tooltip으로 안내한다.

### 6.4 무한캔버스

| 기능 | 요구사항 |
| --- | --- |
| pan | 빈 영역 드래그 또는 hand mode에서 화면 이동 |
| zoom | 마우스 휠/트랙패드/pinch, `-`, `+`, percentage selector 지원 |
| fit view | 전체 graph가 보이도록 viewport 조정 |
| selection | 노드/엣지 단일 선택, shift 다중 선택 |
| drag | 노드 위치 이동, 다중 선택 이동 |
| snap/grid | dotted background 기준 정렬. 설정으로 on/off 가능 |
| copy/paste | 선택 노드 복제. ID는 새로 발급, 연결 엣지는 선택 범위 안에서만 복제 |
| delete | 노드 삭제 시 연결 엣지 삭제와 downstream 영향 확인 |
| keyboard | undo/redo, copy/paste, delete, zoom, fit view, search 지원 |
| readonly | deployed/previous version과 권한 없는 agent는 편집 불가, 로그/구조 확인만 가능 |

캔버스는 큰 graph에서도 노드 렌더링 성능을 유지해야 한다. viewport 밖 노드는 간소화하거나 virtualization한다. 테스트 실행 중에는 노드 이동/삭제를 제한하고, 실행 중 graph와 편집 draft가 충돌하지 않게 test run은 graph snapshot 기준으로 수행한다.

### 6.5 노드 공통

| 필드/상태 | 표시/동작 |
| --- | --- |
| 아이콘 | node type별 색상 아이콘 |
| 제목 | node displayName. 우측 패널 또는 inline으로 변경 |
| 설명 | 역할 한 줄 요약 |
| 상태 아이콘 | valid, warning, running, succeeded, failed, skipped, waiting_approval |
| 입력 | input field명과 type 요약 |
| 출력 | output field명과 type 요약 |
| 모델/도구 | LLM model 또는 tool 이름 표시 |
| 메트릭 | 성공률, 결과 개수, 토큰, 지연 시간, 비용 중 node type별 핵심값 |
| 포트 | 좌우/상하 handle. input/output schema에 따라 연결 가능성 제한 |
| 선택 상태 | 파란 테두리와 우측 패널 동기화 |

노드는 공통적으로 `nodeId`, `type`, `displayName`, `description`, `position`, `config`, `inputSchema`, `outputSchema`, `permissionPolicy`, `lastTestResult`를 가진다.

### 6.6 이미지 기준 노드 상세

| 노드 | 화면 표시 | 기능 요구사항 |
| --- | --- | --- |
| 시작 | 입력 `query String`, `메타데이터 Object` | 사용자 요청과 context metadata를 graph 입력으로 제공 |
| 의도 분류 | 모델 `GPT-4o mini`, 카테고리 chip, 출력 `intent`, `entities`, 성공률 98% | 사용자 요청 intent/entity를 분류하고 조건 분기 입력 생성 |
| 여행 자료 검색 | 도구 `웹 검색`, `지식베이스: 여행 가이드`, `스크랩 읽기 +1`, 결과 개수 6, 지연 1.2s | 외부 검색과 내부 지식/스크랩을 묶어 `search_results` 생성 |
| 일정 생성 | 모델 `GPT-4o`, 출력 `itinerary`, `summary`, 토큰 1,248, 지연 2.1s | 검색 결과와 선호도를 받아 여행 일정 객체와 요약 생성 |
| 지도 반영 | 도구 `지도 업데이트`, `경로 최적화`, 경유지 8개, 지연 0.9s | 일정의 장소/시간 정보를 지도 작업면과 route artifact로 반영 |
| 사용자 승인 | 승인 액션 `사용자 확인`, edge `승인됨`, `거절됨` | 생성된 일정을 사용자에게 보여주고 승인 결과에 따라 흐름 분기 |
| 저장 | 저장 위치 `주제: 도쿄 여행`, 저장 항목 `일정, 지도, 메모`, 상태 `저장 완료` | 승인된 결과를 topic/artifact/source에 저장 |

### 6.7 엣지 공통

| 유형 | 표현 | 동작 |
| --- | --- | --- |
| 기본 성공 edge | 실선 곡선 | source node 성공 시 target node 실행 |
| 조건 edge | 점선 또는 라벨 포함 | condition expression이 true일 때 실행 |
| 승인 edge | `승인됨`, `거절됨` 라벨 | approval_request 결과에 따라 실행 |
| fallback edge | 경고/회색 라벨 | source node 실패, timeout, schema mismatch 때 실행 |
| parallel edge | 동일 source에서 여러 target | 순차/병렬 실행 정책을 edge 또는 group 설정으로 명시 |

엣지 생성 시 source output schema와 target input schema를 검증한다. 자동 mapping 가능한 경우 제안하고, 불가능하면 mapping UI를 요구한다. 조건 edge가 여러 개면 평가 순서와 default edge가 필요하다.

### 6.8 자동 레이아웃

| 기능 | 요구사항 |
| --- | --- |
| 토글 | 이미지처럼 toolbar에 `자동 레이아웃` on/off 표시 |
| 즉시 정렬 | 현재 graph를 start-to-end 방향으로 정렬 |
| 부분 정렬 | 선택 노드와 downstream만 정렬 |
| 충돌 방지 | 노드 겹침, 엣지 과도 교차, 패널 밖 배치를 줄임 |
| 수동 위치 보존 | 사용자가 pin한 노드는 자동 정렬에서 제외 |
| 실행 중 제한 | 테스트 실행 중에는 레이아웃 변경을 queue하거나 금지 |

자동 레이아웃 적용은 undo stack에 하나의 action으로 들어간다. 적용 전후를 비교할 수 있게 `되돌리기`가 즉시 가능해야 한다.

### 6.9 미니맵

| 기능 | 요구사항 |
| --- | --- |
| 전체 graph 요약 | 노드를 작은 사각형으로 표시하고 현재 viewport를 파란 박스로 표시 |
| 클릭 이동 | 미니맵 클릭/드래그로 viewport 이동 |
| 상태 색상 | failed/warning/waiting_approval 노드는 색상 점으로 표시 가능 |
| 접기 | 작은 아이콘으로 숨김/표시 전환 |
| fit/search | 미니맵 하단 아이콘으로 fit view, 검색, 확대 보기 제공 |

미니맵은 팔레트가 접혀도 좌하단에 유지된다. 작은 화면에서는 기본 접힘 상태로 둔다.

### 6.10 줌 / pan / 보기 제어

| 요소 | 기능 |
| --- | --- |
| hand 버튼 | pan mode 토글. 활성 시 파란 상태 |
| `-` / `+` | 10% 또는 설정 단위로 확대/축소 |
| `100%` | 현재 배율 표시. 클릭 시 프리셋 선택 |
| sparkle 버튼 | 자동 정리, 누락 설정 제안, 테스트 케이스 생성 같은 AI assist 후보 |
| 보기 모드 아이콘 | 노드 density, grid, minimap, schema overlay 같은 표시 옵션 |

줌 범위는 예를 들어 25%~200%로 제한한다. 50% 이하에서는 노드 상세를 줄이고 제목/상태 중심으로 표시한다.

### 6.11 Undo / Redo

| 대상 액션 | 지원 여부 |
| --- | --- |
| 노드 추가/삭제/이동/복제 | 지원 |
| 엣지 추가/삭제/조건 변경 | 지원 |
| prompt/model/parameter/schema 변경 | 지원 |
| 자동 레이아웃 적용 | 지원 |
| 테스트 실행 결과 | undo 대상 아님 |
| 저장/배포 | undo stack이 아니라 version restore로 처리 |

undo/redo는 local edit history와 server draft version을 분리한다. autosave 후에도 같은 브라우저 세션에서는 undo 가능해야 하며, 페이지 재진입 후에는 version history로 복원한다.

### 6.12 우측 노드 설정 패널

이미지의 선택 노드는 `일정 생성` LLM 노드다. 우측 패널은 선택 노드의 설정과 최근 테스트 로그를 한 화면에서 다룬다.

| 섹션 | 기능 |
| --- | --- |
| 노드 헤더 | 아이콘, 노드명, node type badge, expand, close |
| 설정 | node type별 주요 설정 form |
| 프롬프트 | prompt textarea, 변수 삽입, 글자 수/토큰 추정 |
| 모델 | provider/model selector, fallback, 설정 gear |
| 파라미터 | temperature, max token, reasoning, timeout, retry |
| 권한 | effective permission 표시, `변경`으로 권한 탭/모달 진입 |
| 입력 스키마 | upstream에서 들어오는 field, type, required, mapping |
| 출력 스키마 | downstream이 사용할 field, type, validation rule |
| 테스트 실행 로그 | 최근 test status, duration, input/output sample, timestamp |

패널은 선택 node type에 따라 form을 바꾼다. 노드 미선택 상태에서는 agent 전체 개요, graph validation summary, 최근 테스트 결과를 표시할 수 있다.

## 7. 노드별 설정 요구사항

### 7.1 Prompt

| 항목 | 요구사항 |
| --- | --- |
| system/user prompt 구분 | LLM 노드는 system instruction과 task prompt를 분리 가능 |
| 변수 삽입 | upstream output과 agent context를 `{{search_results}}` 같은 변수로 삽입 |
| 입력 미리보기 | 선택 test run의 실제 입력값으로 prompt preview 제공 |
| 토큰 추정 | prompt 길이, 예상 입력 토큰, max token 초과 위험 표시 |
| prompt version | 저장/배포 시 prompt 변경 이력을 version diff에 포함 |
| 금지/안전 규칙 | agent 권한 탭의 정책을 prompt만으로 우회하지 않도록 validation |

### 7.2 Model

| 항목 | 요구사항 |
| --- | --- |
| provider/model 선택 | 연결 화면의 provider와 모델 registry를 참조 |
| fallback model | 기본 모델 실패/한도 초과 시 대체 모델 선택 |
| reasoning/temperature/max token | 모델별 지원 파라미터만 표시 |
| 비용 추정 | node별 예상 토큰/비용과 전체 graph 비용 합산 |
| 호환성 | vision/tool calling/json mode 등 필요한 capability 검증 |
| 배포 영향 | 모델 변경 시 기존 schedule/run template 예상 비용 재계산 |

### 7.3 Permission

| 항목 | 요구사항 |
| --- | --- |
| effective permission | agent, node, connection, workspace policy를 합산해 표시 |
| 권한 레벨 | read, write, external_write, approve_required, blocked |
| 변경 동선 | node 패널의 `변경` 버튼에서 권한 탭 또는 inline modal로 이동 |
| 충돌 표시 | agent는 write 허용이나 connection이 blocked이면 blocked가 우선 |
| 승인 필요 | 비용 초과, 외부 쓰기, 예약 실행, 파일 삭제는 approval_request 생성 |
| audit | 권한 변경은 actor, old/new policy, 영향 노드, 사유를 기록 |

### 7.4 Schema

| 항목 | 요구사항 |
| --- | --- |
| input schema | field name, type, required, source mapping, sample 표시 |
| output schema | field name, type, required, downstream 사용처 표시 |
| 타입 | String, Number, Boolean, Object, Array, File, SourceRef, TopicRef, Location, DateTime 등 |
| validation | required 누락, type mismatch, circular ref, unsafe field 감지 |
| mapping | upstream output을 target input에 drag/drop 또는 select로 연결 |
| schema evolution | 배포 중 version과 draft version의 schema 변경 영향 분석 |

### 7.5 Log

| 항목 | 요구사항 |
| --- | --- |
| 최근 테스트 로그 | status, duration, token, cost, input/output sample, timestamp |
| run log 연결 | deployed version의 실제 run log를 node별로 필터 |
| 민감값 마스킹 | credential, 개인정보, 외부 토큰은 원문 노출 금지 |
| diff | 이전 성공 로그와 현재 실패 로그 비교 |
| 재실행 | 선택 node부터 downstream만 재실행하는 partial test 후보 |
| export | 문제 재현용 trace id와 request id 복사 |

## 8. 테스트 / 배포 / 초안 Lifecycle

### 8.1 상태 모델

| 상태 | 의미 | 가능한 액션 |
| --- | --- | --- |
| draft | 편집 중인 초안 | 저장, 테스트, 폐기, 배포 준비 |
| validating | schema/permission/cycle 검증 중 | 대기 |
| test_ready | 필수 validation 통과 | 테스트, 배포 요청 |
| testing | canvas_test_run 실행 중 | 중지, 로그 보기 |
| test_failed | 테스트 실패 | 로그 확인, 수정, 재테스트 |
| test_passed | 배포 전 기준 테스트 통과 | 배포, 추가 테스트 |
| deploying | 배포 생성 중 | 대기 |
| deployed | 활성 agent version | read-only 보기, 새 초안 만들기, rollback |
| archived | 더 이상 사용하지 않는 version | 복원, 삭제 정책 확인 |

### 8.2 저장 정책

| 저장 방식 | 요구사항 |
| --- | --- |
| autosave | 짧은 debounce 후 draft patch 저장. 실패 시 local pending 표시 |
| 수동 저장 | 상단 `저장`으로 즉시 저장 |
| 충돌 처리 | 다른 세션에서 같은 draft 수정 시 merge 불가 영역을 diff로 표시 |
| 오프라인 | local draft queue에 보존하고 재연결 시 동기화 |
| 저장 단위 | graph metadata, node, edge, layout, selected tab, viewport 일부 |

저장 성공은 배포가 아니다. registry의 활성 agent, schedule, run template은 배포 전까지 바뀌지 않는다.

### 8.3 테스트 정책

| 테스트 유형 | 목적 | 처리 |
| --- | --- | --- |
| 전체 테스트 | 시작 노드부터 전체 graph 실행 | 상단 `테스트` 기본 동작 |
| 노드 단위 테스트 | 선택 노드 config와 schema 확인 | 우측 패널에서 실행 |
| downstream 테스트 | 특정 노드부터 하위 흐름 실행 | 실패 디버깅용 |
| mock 테스트 | 외부 쓰기/결제/파일 삭제를 mock 처리 | 기본 테스트 모드 |
| live 테스트 | 실제 tool call 허용 | 명시 승인과 비용 안내 필요 |

테스트 결과는 graph snapshot 기준으로 저장한다. 테스트 중 사용자가 draft를 수정하면 실행 중인 test run에는 반영하지 않고, 테스트 완료 후 “현재 초안과 다른 버전의 테스트 결과”임을 표시한다.

### 8.4 배포 정책

배포 전 필수 검증은 다음이다.

| 검증 | 실패 시 처리 |
| --- | --- |
| 시작 노드 존재 | 배포 차단 |
| 도달 불가능 노드 확인 | warning 또는 배포 차단 정책 결정 |
| cycle 검증 | 허용된 loop가 아니면 배포 차단 |
| 필수 prompt/model/tool 누락 | 배포 차단 |
| input/output schema 호환 | 배포 차단 |
| 권한/연결 상태 | blocked면 배포 차단, approve-required면 승인 요청 |
| 비용 한도 | 예상 비용 초과 시 승인 또는 설정 변경 요구 |
| 스케줄 충돌 | 캘린더/맡긴 일 영향 확인 |
| 최근 테스트 | test_passed 없으면 테스트 요구 또는 강제 배포 확인 |

배포 완료 시 새 `agent_version`이 `deployed`가 되고, 기존 deployed version은 `superseded` 또는 archived 상태로 전환된다. 진행 중 run은 시작 당시 version snapshot을 계속 사용한다. 신규 run과 schedule의 다음 실행부터 새 version을 사용한다.

### 8.5 Rollback / version restore

| 상황 | 처리 |
| --- | --- |
| 배포 후 실패율 증가 | 이전 deployed version으로 rollback |
| draft가 망가짐 | 최근 저장 시점 또는 deployed version에서 새 draft 생성 |
| schedule 실행 중 rollback | 진행 중 run은 기존 snapshot 유지, 다음 schedule부터 rollback version 사용 |
| 권한 정책 변경 때문에 rollback 불가 | rollback version의 권한/connection 재검증 요구 |

## 9. 승인 노드 / 조건 분기 Edge Case

### 9.1 승인 노드

| 상황 | 처리 |
| --- | --- |
| 승인 요청이 여러 개 생성됨 | 동일 run 안에서는 순차 표시 또는 묶음 승인 정책 필요. 기본은 긴급/비용 높은 순 |
| 승인 만료 | `expired` 상태로 전환하고 reject fallback 또는 사용자 지시 대기로 이동 |
| 승인 후 payload 변경 | 승인 직전 비용/대상/권한을 재검증. 변경이 크면 재승인 |
| 승인 권한 없는 사용자 | 승인 버튼 비활성화, 필요한 role 또는 소유자에게 요청 |
| 거절 edge 없음 | 배포 전 warning. 거절 시 run은 사용자 지시 대기로 전환 |
| 승인됨 edge 없음 | 배포 차단 |
| 테스트 중 승인 | 기본은 mock approval. live approval은 별도 test approval card 생성 |
| 동일 외부 쓰기 중복 승인 | idempotency key와 대상 fingerprint로 중복 실행 방지 |
| 승인 후 외부 작업 실패 | 승인 완료와 외부 작업 실패를 분리해 로그와 audit에 기록 |

### 9.2 조건 분기

| 상황 | 처리 |
| --- | --- |
| 조건이 겹침 | 평가 순서 표시. 첫 match 또는 multi-match 정책을 명시 |
| 어떤 조건도 match 안 됨 | default edge 필요. 없으면 run은 failed 또는 사용자 지시 대기 |
| 조건 expression 오류 | validation 단계에서 배포 차단 |
| upstream field 삭제 | 연결된 조건 edge warning, 배포 차단 후보 |
| LLM 분류 confidence 낮음 | threshold 이하 fallback edge 또는 사용자 확인 node로 이동 |
| 조건 edge가 cycle 생성 | loop limit, max iteration, timeout 설정 없으면 배포 차단 |
| 병렬 분기 결과 충돌 | merge node 또는 conflict policy 필요 |

### 9.3 루프 / 재시도 / fallback

| 상황 | 처리 |
| --- | --- |
| tool timeout | retry 정책 후 fallback edge 실행 |
| provider rate limit | backoff, fallback model/tool, 비용/지연 로그 표시 |
| schema mismatch | 자동 변환 가능하면 transform 제안, 불가능하면 failed |
| 검색 결과 없음 | 일정 생성으로 바로 가지 않고 대체 검색 또는 사용자 질문 |
| 지도 반영 실패 | 일정 생성 결과는 유지하고 지도 artifact만 failed 표시 |
| 저장 실패 | 사용자 승인 결과와 생성 artifact는 임시 보존, 재저장 CTA |

## 10. Agent Registry / 연결 / 맡긴 일 연계

### 10.1 Agent Registry 연계

| 연계 지점 | 요구사항 |
| --- | --- |
| 목록 카드 | 배포된 version의 모델, 도구 수, 권한, 최근 실행, 월 비용 반영 |
| 상세 빌더 탭 | `무한캔버스에서 편집` 진입, draft/deployed 상태 표시 |
| 활성 토글 | 배포된 graph validation과 connection 상태 기준으로 on/off |
| 템플릿 저장 | 현재 graph를 개인 템플릿으로 저장 가능 |
| 복제 | deployed 또는 draft graph를 새 agent draft로 복제 |
| 실행 기록 | canvas test run과 실제 run을 구분해 표시 |

### 10.2 연결 화면 연계

| 연계 지점 | 요구사항 |
| --- | --- |
| 모델 선택 | provider/model 후보는 연결 화면의 상태와 capability를 참조 |
| 도구 호출 | tool registry와 MCP connection 상태를 참조 |
| 권한 정책 | connection rule이 node permission보다 우선할 수 있음 |
| 연결 만료 | 해당 노드 warning, 테스트/배포 차단 또는 fallback 요구 |
| 연결 비활성화 영향 | 어떤 agent version/node/schedule이 영향받는지 연결 화면에 표시 |
| 새 연결 추가 | 팔레트/노드 설정에서 연결 화면 또는 연결 모달로 이동 후 복귀 |

### 10.3 맡긴 일 / run 연계

| 연계 지점 | 요구사항 |
| --- | --- |
| 수동 실행 | 배포된 agent graph로 `run` 생성 |
| 테스트 실행 | `canvas_test_run`으로 분리, 실제 맡긴 일 목록에는 테스트 배지 |
| 장시간 실행 | graph step을 run timeline으로 표시 |
| 승인 대기 | approval node가 `approval_request`를 만들고 맡긴 일에 승인 대기 노출 |
| 실패 디버깅 | run에서 실패 node로 deep link |
| 재시도 | 실패 node부터 재시도 또는 전체 run 복제 실행 |
| multi-agent | 특정 node가 하위 agent run을 생성할 수 있음 |

### 10.4 캘린더 / 주제 / 기억 / 파일 연계

| 화면 | 연계 |
| --- | --- |
| 캘린더 | 스케줄 노드가 calendar_event와 schedule을 생성/갱신 |
| 주제 | 시작 context와 저장 노드가 topicId를 사용. 여행 주제 작업면에 일정/지도 반영 |
| 기억 | 검색/스크랩 읽기 노드가 source를 참조하고, 저장 노드가 결정/선호도를 생성 가능 |
| 스크랩 | 스크랩 읽기 노드가 URL/영상/기사 원문과 요약을 입력으로 사용 |
| 파일 | 생성된 일정표/PDF/문서 artifact 저장 및 다운로드 |
| 설정 | 기본 모델, 비용 한도, 승인 정책, Dev Mode token scope 적용 |

## 11. 데이터 필드 / API 힌트

### 11.1 주요 객체

```ts
type AgentBuilderVersion = {
  id: string;
  agentId: string;
  versionNumber: number;
  status: "draft" | "test_ready" | "test_passed" | "deployed" | "archived" | "superseded";
  displayName: string;
  description?: string;
  graph: AgentGraph;
  validationSummary: ValidationSummary;
  lastSavedAt: string;
  lastTestRunId?: string;
  deployedAt?: string;
  createdBy: string;
};

type AgentGraph = {
  nodes: AgentNode[];
  edges: AgentEdge[];
  viewport?: CanvasViewport;
  layoutMode: "manual" | "auto";
};

type AgentNode = {
  id: string;
  type: "start" | "llm" | "tool_call" | "condition" | "search" | "scrap_read" | "map_update" | "approval" | "schedule" | "code";
  displayName: string;
  description?: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputSchema: SchemaField[];
  outputSchema: SchemaField[];
  permissionPolicy?: PermissionPolicy;
  validationStatus: "valid" | "warning" | "invalid";
  lastTestResult?: NodeTestResult;
};

type AgentEdge = {
  id: string;
  sourceNodeId: string;
  sourceHandle?: string;
  targetNodeId: string;
  targetHandle?: string;
  type: "success" | "condition" | "approval_approved" | "approval_rejected" | "fallback";
  label?: string;
  condition?: string;
  priority?: number;
  mapping?: FieldMapping[];
};
```

### 11.2 노드 config 힌트

| node type | config 핵심 필드 |
| --- | --- |
| start | `triggerTypes`, `inputSchema`, `defaultTopicScope`, `metadataKeys` |
| llm | `providerId`, `modelId`, `prompt`, `temperature`, `maxTokens`, `responseFormat`, `fallbackModelId` |
| tool_call | `toolId`, `connectionId`, `operation`, `argumentsMapping`, `timeoutMs`, `retryPolicy` |
| condition | `conditions`, `defaultEdgeId`, `evaluationMode`, `confidenceThreshold` |
| search | `sourceScopes`, `queryMapping`, `limit`, `rerank`, `includeCitations` |
| scrap_read | `sourceFilters`, `contentMode`, `summaryMode`, `maxSources` |
| map_update | `targetSurface`, `placeMapping`, `routeOptimization`, `writeMode` |
| approval | `approvalType`, `payloadTemplate`, `expiresIn`, `approverPolicy`, `approvedEdgeId`, `rejectedEdgeId` |
| schedule | `rrule`, `timezone`, `startAt`, `endAt`, `approvalPolicy`, `runTemplate` |
| code | `runtime`, `script`, `timeoutMs`, `memoryLimitMb`, `networkPolicy`, `filesystemPolicy` |

### 11.3 API 후보

| API | 목적 |
| --- | --- |
| `GET /agents/{agentId}/builder` | 최신 draft/deployed 요약 조회 |
| `POST /agents/{agentId}/versions/draft` | deployed/template에서 새 draft 생성 |
| `GET /agents/{agentId}/versions/{versionId}` | 특정 version graph 조회 |
| `PATCH /agents/{agentId}/versions/{versionId}` | draft metadata 저장 |
| `PATCH /agents/{agentId}/versions/{versionId}/graph` | node/edge/layout patch 저장 |
| `POST /agents/{agentId}/versions/{versionId}/validate` | graph validation 실행 |
| `POST /agents/{agentId}/versions/{versionId}/test-runs` | canvas test run 생성 |
| `GET /agent-test-runs/{testRunId}` | 테스트 run 상태 조회 |
| `GET /agent-test-runs/{testRunId}/node-logs?nodeId=` | 노드별 테스트 로그 조회 |
| `POST /agents/{agentId}/versions/{versionId}/deploy` | draft 배포 |
| `POST /agents/{agentId}/versions/{versionId}/rollback` | 이전 version rollback |
| `GET /tools?query=&capability=` | 팔레트/도구 호출 노드 후보 조회 |
| `GET /models?capability=&providerStatus=active` | LLM 노드 모델 후보 조회 |
| `GET /connections/impact?agentId=&versionId=` | 배포/권한 변경 영향 분석 |
| `GET /approval-requests?agentId=&runId=&status=` | 승인 노드가 만든 승인 요청 조회 |

### 11.4 실시간 이벤트

| 이벤트 | 사용처 |
| --- | --- |
| `builder.draft.saved` | 상단 저장 상태 갱신 |
| `builder.validation.updated` | 노드 상태와 배포 버튼 갱신 |
| `test_run.node.started` | 노드 running 상태 표시 |
| `test_run.node.completed` | 노드 성공/로그/메트릭 갱신 |
| `test_run.node.failed` | 실패 노드 강조 |
| `approval.requested` | 승인 노드 waiting 상태와 맡긴 일 승인 대기 갱신 |
| `agent.version.deployed` | registry 카드와 상세 패널 갱신 |
| `connection.status.changed` | 관련 노드 warning 갱신 |

## 12. 상태 / 빈 상태 / 로딩 / 에러 / 권한 Edge Case

### 12.1 로딩/빈 상태

| 상태 | 처리 |
| --- | --- |
| 최초 로딩 | 헤더 skeleton, 팔레트 skeleton, 캔버스 loading placeholder 표시 |
| graph 없음 | `시작 노드부터 추가하세요` 빈 캔버스와 템플릿 선택 CTA |
| 팔레트 검색 결과 없음 | 검색어 초기화와 연결 화면 CTA |
| 노드 미선택 | 우측 패널에 graph validation summary와 최근 테스트 결과 표시 |
| 기록 없음 | `아직 테스트 실행 기록이 없습니다.`와 테스트 CTA |

### 12.2 에러 상태

| 에러 | 처리 |
| --- | --- |
| draft 조회 실패 | 재시도, registry로 돌아가기 |
| autosave 실패 | 상단 `저장 실패`, local pending 보존, 재시도 |
| graph patch 충돌 | server version diff 표시 후 merge/overwrite 선택 |
| validation 실패 | 문제 node/edge 목록과 캔버스 하이라이트 |
| 테스트 시작 실패 | 비용/권한/연결/입력 누락 원인 분리 |
| 테스트 중 연결 끊김 | 실행 상태 polling 재개 또는 trace id로 복구 |
| 배포 실패 | draft 보존, 실패 validation/permission/connection 표시 |
| version 삭제됨 | registry로 fallback하고 toast 표시 |

### 12.3 권한/보안

| 상황 | 처리 |
| --- | --- |
| read-only agent | 편집/저장/배포 disabled, `복제해서 편집` 제공 |
| workspace 권한 부족 | 배포/권한 변경/스케줄 생성 제한 |
| 코드 실행 노드 | sandbox, timeout, network/filesystem policy 필수 |
| 민감 source 사용 | 테스트 로그와 prompt preview에서 masking |
| 외부 쓰기 tool | approval node 또는 approve-required policy 없으면 배포 차단 |
| credential 만료 | 관련 노드 warning, 연결 화면 복구 CTA |

### 12.4 데이터 정합성

| 상황 | 처리 |
| --- | --- |
| 노드 삭제로 downstream 입력 사라짐 | 영향 노드 warning과 엣지 제거 확인 |
| schema field rename | 자동 mapping 업데이트 또는 수동 확인 요구 |
| 중복 node name | 허용하되 nodeId 기준. UI 검색에서는 경로/타입 함께 표시 |
| 시작 노드 여러 개 | manual/schedule trigger별 허용 여부 결정. 기본은 trigger type이 다르면 허용 |
| 저장 노드가 여러 개 | 저장 대상 충돌 감지, 실행 순서 명시 |
| graph가 너무 큼 | 미니맵/검색/그룹화 제공, 성능 경고 |

## 13. 수용 기준

### 13.1 화면 기본

- 좌측 글로벌 내비에서 `에이전트`가 활성 상태로 표시된다.
- breadcrumb는 `에이전트 > {agentName} 편집`을 표시하고 registry 복귀가 가능하다.
- 상단에는 저장 상태, `저장`, `테스트`, `배포`, 더보기 액션이 표시된다.
- `플로우`, `구성`, `지식`, `권한`, `기록` 탭이 표시되고 탭 전환 시 draft context가 유지된다.
- 팔레트에는 이미지에 보이는 기본/고급 블록이 모두 표시된다.

### 13.2 캔버스 편집

- 노드를 팔레트에서 추가하고 이동/삭제/복제할 수 있다.
- 노드 간 엣지를 연결할 수 있고 schema mismatch는 연결 시점 또는 validation에서 표시된다.
- 조건/승인/fallback edge는 라벨과 규칙을 편집할 수 있다.
- 자동 레이아웃, 미니맵, 줌, pan, fit view가 동작한다.
- undo/redo는 노드/엣지/config/layout 변경에 적용된다.

### 13.3 노드 설정

- LLM 노드는 prompt, model, parameter, input/output schema, permission, log를 확인/수정할 수 있다.
- 도구 호출 노드는 tool/connection, argument mapping, permission, retry/timeout을 설정할 수 있다.
- 승인 노드는 승인 payload, 만료, 승인됨/거절됨 edge를 설정할 수 있다.
- 스케줄 노드는 반복 규칙, timezone, 비용 상한, 승인 정책을 설정할 수 있다.
- 노드별 최근 테스트 로그는 status, duration, token/cost, input/output sample을 표시한다.

### 13.4 Lifecycle

- autosave와 수동 저장은 draft version에만 반영된다.
- 테스트는 graph snapshot 기준으로 실행되고 노드별 상태가 실시간 갱신된다.
- 외부 쓰기/결제/삭제는 테스트에서 mock 또는 승인 필요로 처리된다.
- 배포 전 validation은 시작 노드, schema, cycle, 권한, 연결, 비용, 스케줄 충돌을 확인한다.
- 배포 완료 후 Agent Registry 카드와 상세 패널은 최신 deployed version 정보를 반영한다.
- 이전 deployed version으로 rollback하거나 새 draft를 만들 수 있다.

### 13.5 연계

- 연결 만료/비활성화는 관련 모델/도구 노드에 warning으로 표시된다.
- 배포된 graph로 생성된 run은 맡긴 일에서 조회되고 실패 노드로 deep link 가능하다.
- 승인 노드는 `approval_request`를 생성하고 맡긴 일/알림에 승인 대기로 표시된다.
- 스케줄 노드는 캘린더와 맡긴 일의 schedule/run template로 연결된다.
- 저장 노드는 주제/파일/기억/작업면 artifact 저장 대상과 연결된다.

### 13.6 접근성/사용성

- 키보드만으로 노드 선택, 팔레트 검색, 저장, 테스트, 배포, undo/redo가 가능하다.
- 색상만으로 상태를 구분하지 않고 텍스트/아이콘/tooltip을 함께 제공한다.
- 긴 prompt와 schema field는 패널 폭 안에서 읽고 편집할 수 있다.
- 확대/축소 상태에서도 노드 제목과 위험 상태는 식별 가능하다.
- destructive action은 영향 범위와 확인 없이 즉시 실행되지 않는다.

## 14. 자체 리뷰: 이미지 기능 및 엣지케이스 반영 체크

read-only nested subagent로 엣지케이스 리뷰를 시도했으나 agent message가 생성되지 않아 실패했다. 따라서 이 섹션을 자체 리뷰 결과로 남긴다.

| 점검 항목 | 반영 내용 |
| --- | --- |
| 이미지 visible UI | 좌측 내비, breadcrumb, 탭, 저장/테스트/배포, 팔레트, 캔버스 툴바, draft selector, 미니맵, 줌, 우측 노드 설정 패널 반영 |
| 노드/엣지 | 시작, 의도 분류, 여행 자료 검색, 일정 생성, 지도 반영, 사용자 승인, 저장과 실선/점선/승인 edge 반영 |
| 필수 키워드 | 노드/엣지/팔레트/자동 레이아웃/미니맵/줌/undo-redo 별도 섹션 작성 |
| 노드별 설정 | prompt/model/permission/schema/log 별도 섹션 작성 |
| lifecycle | draft/test/deploy/rollback과 graph snapshot 기준 테스트 명시 |
| 승인/분기 edge case | 승인 만료, payload 변경, 승인 권한 없음, 조건 겹침, default edge 누락, cycle 반영 |
| 연계 | Agent Registry, 연결, 맡긴 일, 캘린더, 주제, 기억, 파일 연계 반영 |
| 데이터/API | graph/node/edge 타입, config 힌트, API, 실시간 이벤트 포함 |

## 15. 오픈 질문

| 질문 | 영향 |
| --- | --- |
| MVP에서 `구성/지식/권한/기록` 탭을 모두 구현할지, registry 상세 탭으로 일부 대체할지 | builder 범위와 중복 UI 결정 필요 |
| 시작 노드를 여러 개 허용할지 | manual/chat/schedule trigger를 한 graph에 담는 방식에 영향 |
| 조건 expression을 자연어, JSON rule, JS-like expression 중 무엇으로 저장할지 | 보안, validation, UI 복잡도에 영향 |
| 승인 노드를 모든 external_write 앞에 필수로 둘지, 권한 정책에서 자동 삽입할지 | 사용자 제어감과 안전 정책 구현 방식에 영향 |
| 테스트 실행에서 live tool call을 어느 범위까지 허용할지 | 비용/보안/실제 외부 변경 위험에 영향 |
| 코드 실행 노드를 MVP에 포함할지 | sandbox, 보안, 로그 masking, timeout 구현 부담 큼 |
| 자동 레이아웃 엔진을 클라이언트에서 돌릴지 서버에서 canonical layout을 저장할지 | 협업 편집과 성능에 영향 |
| 노드 그룹/subflow를 MVP에 넣을지 | 큰 graph 관리성은 좋아지나 편집 모델이 복잡해짐 |
| 배포 승인 권한을 agent 소유자만 가질지 workspace admin도 가질지 | 팀/허브 공유 agent 운영 정책에 영향 |
| schedule 노드 배포 시 기존 schedule을 자동 마이그레이션할지 새 schedule만 만들지 | 운영 안정성과 사용자 예상 동작에 영향 |
| 테스트 로그 보존 기간과 비용 집계 포함 범위는 어떻게 할지 | 비용 화면, 감사 로그, 개인정보 보존 정책에 영향 |
| `sparkle` 버튼의 1차 기능을 자동 정리, 누락 설정 제안, 테스트 케이스 생성 중 무엇으로 둘지 | 이미지의 보이는 UI를 실제 기능으로 매핑하는 우선순위 필요 |
