# 06. 연결 / Connections 화면 상세 기획

## 1. 화면 목적

`연결` 화면은 개인형 Agent 플랫폼이 외부 모델, API, MCP 서버, 저장소, 검색/지도 서비스, 코드 실행 도구를 안전하게 쓰기 위한 운영 화면이다. 사용자는 여기서 연결 상태, 활성 여부, 권한, 비용 한도, 테스트 요청 로그를 확인하고, 에이전트·맡긴 일·스케줄이 어떤 도구를 실제로 호출할 수 있는지 제어한다.

PRD 기준으로 `연결`은 일반 사용자가 매일 쓰는 화면이 아니라, 에이전트 빌더와 scheduler가 참조하는 기반 설정 화면이다. 따라서 이 화면의 핵심은 “연결을 추가한다”가 아니라 “연결된 기능이 어디에 쓰이고, 꺼도 되는지, 어떤 권한과 비용 제한 안에서 실행되는지”를 분명히 보여주는 것이다.

| 사용자 문제 | 화면에서의 해결 방식 |
| --- | --- |
| 어떤 모델/도구가 실제로 연결되어 있는지 모름 | 카드 그리드에서 연결 상태, 유형, 마지막 동기화, 권한, 월 사용액을 표시 |
| 에이전트 실행이 왜 막혔는지 모름 | 상세 패널에서 API 상태, 허용 도구, 권한 rule, 비용 한도, 최근 테스트 요청을 제공 |
| 연결을 끄면 어떤 자동화가 깨지는지 불안함 | 비활성화 전 영향받는 agent, schedule, run, topic을 미리 계산해 확인 |
| 외부 쓰기나 결제성 호출이 위험함 | read/write/approve-required/blocked rule과 테스트 로그, audit log를 분리 |
| 여러 provider와 MCP가 섞여 관리가 어려움 | provider/tool/MCP/service/capability 분류를 명시하고 필터로 탐색 |

## 2. 화면 범위와 전제

- 이 문서는 첨부 이미지와 `/docs/personal-agent-platform-prd.md` 기준의 PC 웹 화면 상세다.
- 소유 파일은 이 문서 하나이며, 글로벌 좌측 내비게이션은 공통 셸로 간주한다.
- 화면명은 한국어 `연결`, 영문 라우트/내부 개념은 `Connections`를 사용한다.
- 연결 대상은 `connection` 객체로 통합하되, 실제 실행 가능 기능은 `tool`, `capability`, `provider`, `credential`, `mcp_server`로 나누어 관리한다.
- MVP에서는 OpenRouter, Codex app-server, Gemini, Claude, Kimi, Qwen, Google Drive, YouTube, Web Search, Map을 대표 샘플로 둔다.
- API key, OAuth token, app-server token 원문은 저장 직후 다시 보여주지 않는다. 화면에는 마스킹된 식별자와 마지막 검증 시간만 표시한다.

## 3. 정보 구조

### 3.1 전체 레이아웃

| 영역 | 구성 | 역할 |
| --- | --- | --- |
| 좌측 글로벌 내비게이션 | 허브명, 알림, 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말, 사용자 플랜 | 앱 전체 이동. 현재 메뉴 `연결` 활성화. |
| 중앙 헤더 | 제목 `연결`, 보조 설명, `연결 추가`, 오버플로 버튼 | 화면 정체성, 신규 연결, 관리 메뉴 진입. |
| 중앙 탭 | `도구`, `모델`, `MCP`, `권한`, `비용` | 연결 목록을 운영 관점별로 전환. |
| 검색/필터 바 | 연결 검색, 상태 필터, 유형 필터, 정렬 | 많은 연결 중 필요한 대상을 찾음. |
| 연결 카드 그리드 | 연결 카드 10개, 상태 배지, 활성 토글, 동기화/권한/사용액 | 연결 상태를 스캔하고 하나를 선택. |
| 페이지 요약 | `10개 연결 중 1-10 표시` | 현재 표시 범위 안내. |
| 우측 상세 패널 | 선택 연결 헤더, 상세 탭, API 상태, 허용 도구, 권한 규칙, 지출 한도, 테스트 로그 | 선택 연결의 운영 설정과 진단. |

### 3.2 화면에 보이는 주요 정보

이미지 기준으로 다음 요소가 보인다.

| 위치 | 화면 요소 | 기능 요구사항 |
| --- | --- | --- |
| 좌측 메뉴 | `연결` 메뉴 활성 상태 | 파란색 아이콘과 강조 배경으로 현재 화면 표시 |
| 중앙 헤더 | `연결`, `외부 도구와 모델을 연결하고, 권한과 사용을 관리합니다.` | 화면 목적을 짧게 설명 |
| 중앙 액션 | `+ 연결 추가`, `...` | 신규 연결 플로우, 일괄 작업/가져오기/내보내기/감사 로그 진입 |
| 탭 | `도구`, `모델`, `MCP`, `권한`, `비용` | 같은 연결 데이터를 다른 관점으로 필터링 |
| 검색 | `연결 검색...` | 이름, provider, service, tool, capability, endpoint 검색 |
| 필터 | `모든 상태`, `모든 유형`, `정렬` | 상태/유형/정렬 조건 적용 |
| 카드 | OpenRouter, Codex app-server, Gemini, Claude, Kimi, Qwen, Google Drive, YouTube, Web Search, Map | 연결별 상태, 토글, 최근 동기화, 권한, 월 사용액 표시 |
| 우측 패널 | OpenRouter 상세 | 선택 카드의 운영 정보와 설정 탭 표시 |
| 상세 탭 | `개요`, `설정`, `사용량`, `로그` | 진단/설정/비용/이력 정보 분리 |
| API 상태 | `정상`, `2분 전`, 새로고침 | health check 결과와 재검사 |
| 허용된 도구 | 텍스트 생성, 채팅, 코드 실행, 웹 검색, 파일 분석, 이미지 분석 | capability 단위 허용 범위 |
| 권한 규칙 | 읽기/쓰기/차단 rule | 연결별 permission policy 요약 |
| 지출 한도 | 월/일 한도, 알림 임계값 | 사용량 막대와 차단 기준 |
| 최근 테스트 요청 | `models/list`, `chat/completions`, `embeddings`, `files/upload` | endpoint별 테스트 성공/실패 이력 |

## 4. 진입 / 종료 / 전환 동선

### 4.1 진입 동선

| 진입점 | 동작 |
| --- | --- |
| 좌측 내비게이션 `연결` 클릭 | 마지막 선택 탭, 검색/필터, 선택 연결을 복원한다. 없으면 `도구` 탭과 가장 최근 사용 연결을 선택한다. |
| 오늘 화면의 연결 가이드 CTA | 필요한 연결 유형이 있으면 `연결 추가` 플로우를 바로 열고, 없으면 연결 목록으로 진입한다. |
| 에이전트 빌더의 도구/모델 설정 | 해당 agent가 참조하는 connection을 선택한 상태로 진입한다. agent context를 우측 패널에 표시할 수 있다. |
| 맡긴 일 실패 로그 | 실패한 run이 사용한 connection을 선택하고 `로그` 탭으로 진입한다. 실패 endpoint와 시간 범위를 필터링한다. |
| 설정의 모델/비용/개발자 탭 | provider 또는 비용 탭으로 진입한다. 전역 정책과 연결별 정책의 차이를 표시한다. |
| URL 직접 접근 | `connectionId`가 있으면 해당 연결 상세를 연다. 권한 없거나 삭제된 연결이면 목록으로 fallback하고 오류 toast를 표시한다. |

### 4.2 종료 동선

| 종료 액션 | 결과 |
| --- | --- |
| 좌측 메뉴 이동 | 탭, 검색어, 필터, 선택 연결, 스크롤 위치를 세션 범위에서 보존한다. |
| 우측 패널 닫기 | 선택 연결을 해제하고 목록 폭을 유지한다. URL의 `connectionId`가 있으면 제거한다. |
| 에이전트 빌더로 돌아가기 | 방금 설정한 connection/tool/capability 변경 사항을 agent draft에 반영한다. |
| 맡긴 일 상세로 돌아가기 | 실패 원인을 확인한 run의 로그 위치로 복귀한다. |
| 설정 화면 이동 | 전역 비용 한도, 기본 모델, Dev Mode token 등 연결 외 정책 화면으로 이동한다. |

### 4.3 내부 전환

| 전환 | 트리거 | 기대 동작 |
| --- | --- | --- |
| 탭 전환 | `도구`/`모델`/`MCP`/`권한`/`비용` 클릭 | 같은 connection 데이터를 탭 관점에 맞게 재그룹화한다. 선택 연결이 탭 범위 밖이면 선택 해제하거나 관련 탭으로 안내한다. |
| 카드 선택 | 연결 카드 클릭 | 우측 상세 패널을 선택 connection 기준으로 갱신한다. |
| 활성 토글 | 카드 우상단 토글 클릭 | 비활성화 영향 분석 후 확인 모달을 표시한다. 영향 없음이면 즉시 반영 가능하다. |
| 상태 필터 | `모든 상태` 드롭다운 | 연결됨, 오류, 만료, 비활성, 설정 필요, 승인 대기 상태로 제한한다. |
| 유형 필터 | `모든 유형` 드롭다운 | provider, MCP, storage, search, map, code, file, media, direct API 등으로 제한한다. |
| 정렬 | `정렬` 버튼 | 최근 사용, 최근 동기화, 비용 높은 순, 오류 우선, 이름순, 의존 agent 수 순으로 정렬한다. |
| 상세 탭 전환 | 우측 `개요`/`설정`/`사용량`/`로그` | 우측 패널 내부만 갱신한다. 목록 선택과 필터는 유지한다. |
| health check 재실행 | API 상태 카드의 새로고침 클릭 | 선택 connection의 live check를 실행하고 상태, 지연 시간, 최근 테스트 요청을 갱신한다. |

## 5. 핵심 시나리오

### 5.1 연결 상태를 확인하고 정상 여부 판단

1. 사용자가 `연결` 화면에 진입한다.
2. 카드 그리드에서 OpenRouter가 `연결됨`, 마지막 동기화 `2분 전`, 권한 `읽기/쓰기`, 이번 달 사용 `$14.32`임을 확인한다.
3. 사용자가 OpenRouter 카드를 선택한다.
4. 우측 `개요` 탭에서 API 상태가 `정상`이고 모든 서비스가 정상 작동 중임을 확인한다.
5. 필요하면 새로고침 버튼으로 health check를 재실행한다.
6. 시스템은 check 결과를 `connection_health_check`와 `audit_log`에 기록한다.

### 5.2 새 provider 연결 추가

1. 사용자가 `+ 연결 추가`를 클릭한다.
2. 연결 유형 선택에서 `모델 제공자`, `MCP 서버`, `외부 서비스`, `저장소`, `검색/지도`, `직접 API` 중 하나를 고른다.
3. 예를 들어 `모델 제공자 > OpenRouter`를 선택하면 API key 입력, 기본 모델 라우팅, capability 허용 범위, 비용 한도 설정을 단계별로 입력한다.
4. 시스템은 API key를 저장하기 전 한 번만 원문을 받고, 저장 후 마스킹된 key fingerprint만 표시한다.
5. 저장 직후 `models/list` 같은 최소 테스트를 실행한다.
6. 성공하면 카드가 목록에 추가되고, 에이전트 빌더의 모델 선택 후보에 반영된다.
7. 실패하면 저장 여부를 분리한다. credential 저장 실패, credential 저장 성공 but 검증 실패, provider endpoint 실패를 구분해 표시한다.

### 5.3 에이전트가 사용할 도구 범위 제한

1. 사용자가 Claude 또는 Web Search 연결을 선택한다.
2. 우측 `설정` 탭에서 capability별 허용 여부를 연다.
3. `웹 검색`은 읽기 자동 허용, `파일 업로드`는 승인 필요, `결제 정보 변경`은 차단으로 설정한다.
4. agent별 override가 있으면 전역 connection rule과 agent rule의 우선순위를 보여준다.
5. 저장 시 해당 rule이 영향을 주는 agent, schedule, run template을 계산한다.
6. 이후 에이전트 빌더와 맡긴 일 생성 플로우는 이 rule을 기준으로 실행 가능 도구를 제한한다.

### 5.4 비용 한도를 넘기기 전 자동 차단

1. OpenRouter 월 사용량이 `$50.00 / $100.00`, 일 사용량이 `$3.20 / $10.00`으로 표시된다.
2. 사용자가 알림 임계값을 `80%`로 설정한다.
3. run 실행 중 일 한도 80%에 도달하면 알림을 생성하고 계속 실행한다.
4. 일 한도 100%에 도달하면 approve-required 또는 blocked 정책에 따라 실행을 멈춘다.
5. 비용 초과로 멈춘 run은 맡긴 일 상세에 `비용 한도 대기` 상태로 표시된다.
6. 사용자가 한도를 높이거나 해당 run을 승인하면 재개한다.

### 5.5 연결 비활성화 전 영향 확인

1. 사용자가 Google Drive 카드의 활성 토글을 끈다.
2. 시스템은 이 연결을 참조하는 agent, schedule, active run, topic, file sync job을 조회한다.
3. 영향이 있으면 확인 모달에 `영향받는 에이전트`, `예정된 자동 작업`, `진행 중 맡긴 일`, `읽기 불가 자료`를 표시한다.
4. 진행 중 run이 있으면 `이번 실행 후 끄기`, `즉시 중지하고 끄기`, `취소` 중 선택하게 한다.
5. 비활성화하면 해당 connection의 capability는 실행 후보에서 제거되고, 기존 로그와 사용량 기록은 보존된다.

### 5.6 실패한 테스트 요청을 추적

1. 맡긴 일에서 `chat/completions` 실패 알림을 클릭해 연결 화면으로 이동한다.
2. OpenRouter 상세의 `로그` 탭이 열리고, 실패한 endpoint와 시간 범위가 자동 선택된다.
3. 사용자는 status code, latency, request id, agent/run/schedule 참조, 비용 추정치를 확인한다.
4. 재시도 가능한 오류면 `테스트 다시 실행`을 누른다.
5. 권한 차단 오류면 권한 rule을 수정하거나 해당 agent의 도구 설정으로 이동한다.

## 6. 컴포넌트별 상세 기능

### 6.1 좌측 글로벌 내비게이션

| 요소 | 기능 |
| --- | --- |
| 허브명 `내 AI 허브` | 워크스페이스/허브 전환. 허브 변경 시 연결 목록과 credential 범위를 재조회한다. |
| 알림 아이콘 | 연결 만료, health check 실패, 비용 한도 경고, 승인 대기를 표시한다. |
| 메뉴 목록 | 현재 `연결` 메뉴를 활성 상태로 표시한다. |
| 사용자 카드 | 플랜, 결제/사용량, 계정 보안 화면으로 이동한다. |

허브별 연결과 개인 연결이 모두 있을 수 있다. 화면에는 현재 허브에서 사용 가능한 연결만 기본 표시하되, 권한이 있으면 `개인 연결`, `허브 공유 연결`, `관리자 제공 연결` 필터를 제공한다.

### 6.2 화면 헤더

| 요소 | 기능 |
| --- | --- |
| 제목 `연결` | 현재 페이지의 최상위 제목. |
| 보조 문구 | `외부 도구와 모델을 연결하고, 권한과 사용을 관리합니다.` |
| `+ 연결 추가` | 연결 추가 플로우를 연다. |
| 오버플로 버튼 | 일괄 health check, 연결 가져오기/내보내기, audit log, 비활성 연결 보기, 문서 링크를 제공한다. |

`연결 추가`는 connection 생성만 담당한다. 생성 후 실제 에이전트 사용 여부는 agent builder, schedule, 전역 기본 설정에서 따로 연결한다.

### 6.3 탭

| 탭 | 목적 | 표시 기준 |
| --- | --- | --- |
| 도구 | 실행 가능한 외부 기능 중심으로 확인 | tool service, storage, search, map, file, code, media connection |
| 모델 | LLM/image/embedding provider 중심으로 확인 | OpenRouter, Gemini, Claude, Kimi, Qwen 등 model provider |
| MCP | MCP server와 MCP tool 목록 확인 | mcp_server, mcp_tool, local app-server |
| 권한 | read/write/approve/blocked rule 관리 | connection permission policy와 agent override |
| 비용 | 사용량, 한도, 알림, 차단 정책 관리 | provider/service별 usage와 cost limit |

탭은 데이터 분리 화면이 아니라 보기 전환이다. 예를 들어 OpenRouter는 `모델`, `도구`, `권한`, `비용` 탭에 모두 나타날 수 있다.

### 6.4 검색/필터/정렬

| 요소 | 기능 |
| --- | --- |
| 검색 입력 | connection name, provider key, service name, endpoint, tool name, capability label을 검색한다. |
| 상태 필터 | 전체, 연결됨, 오류, 만료, 비활성, 설정 필요, 승인 대기, 비용 차단. |
| 유형 필터 | 전체, model provider, MCP server, storage, search, map, code runner, file analyzer, media service, direct API. |
| 정렬 | 최근 사용, 최근 동기화, 비용 높은 순, 실패율 높은 순, 의존 agent 많은 순, 이름순. |

검색 결과가 없으면 `연결 추가`, `필터 초기화`, `비활성 연결 포함` CTA를 표시한다.

### 6.5 연결 카드

카드는 연결 상태를 빠르게 스캔하고 상세 패널을 여는 단위다. 이미지 기준 카드에는 아이콘, 이름, 상태 배지, 활성 토글, 마지막 동기화, 권한, 이번 달 사용액이 있다.

| 요소 | 기능 |
| --- | --- |
| 아이콘 | provider/service 로고 또는 유형별 기본 아이콘. |
| 이름 | 사용자 표시명. 예: OpenRouter, Codex app-server, Gemini. |
| 상태 배지 | 연결됨, 오류, 만료, 설정 필요, 비활성, 승인 대기. |
| 활성 토글 | 실행 후보 포함 여부를 제어한다. 끄기 전 영향 분석 필요. |
| 마지막 동기화 | health check 또는 metadata sync 기준 상대 시간. 예: 2분 전, 방금 전. |
| 권한 | 읽기 전용, 읽기/쓰기, 승인 필요, 차단 포함 요약. |
| 이번 달 사용 | provider 청구 비용 또는 내부 추정 비용. 무료/미연동이면 `$0.00`. |
| 선택 상태 | 파란 테두리와 배경 강조. 우측 상세 패널과 동기화. |

카드 목록 예시는 다음이다.

| 연결 | 분류 | 상태 | 권한 | 이번 달 사용 | 화면상 특이점 |
| --- | --- | --- | --- | --- | --- |
| OpenRouter | model provider, routing provider | 연결됨 | 읽기/쓰기 | `$14.32` | 선택 상태, 상세 패널 표시 |
| Codex app-server | local service, MCP/app bridge, code tool | 연결됨 | 읽기/쓰기 | `$3.21` | 터미널 아이콘, 로컬 실행성 도구 |
| Gemini | model provider | 연결됨 | 읽기 전용 | `$0.00` | 별 아이콘 |
| Claude | model provider | 연결됨 | 읽기/쓰기 | `$8.77` | 주황 로고 |
| Kimi | model provider | 연결됨 | 읽기/쓰기 | `$1.09` | 검정 로고 |
| Qwen | model provider | 연결됨 | 읽기/쓰기 | `$0.64` | 보라 로고 |
| Google Drive | storage, file source | 연결됨 | 읽기/쓰기 | `$0.00` | OAuth 기반 저장소 |
| YouTube | media source, transcript service | 연결됨 | 읽기 전용 | `$0.00` | 스크랩/기억과 연계 |
| Web Search | search service | 연결됨 | 읽기 전용 | `$0.00` | 웹 검색 capability |
| Map | map service | 연결됨 | 읽기 전용 | `$0.00` | 여행/지도 작업면과 연계 |

### 6.6 우측 상세 패널 헤더

| 요소 | 기능 |
| --- | --- |
| 연결 아이콘 | 선택 연결 식별. |
| 연결명 | 예: OpenRouter. |
| 상태 배지 | 현재 상태. 이미지 기준 `연결됨`. |
| 닫기 버튼 | 패널 닫기. 목록 선택 해제. |
| 상세 탭 | 개요, 설정, 사용량, 로그. |

패널은 카드 선택 시 열린다. 선택 연결이 삭제되거나 권한이 사라지면 패널을 닫고 목록을 갱신한다.

### 6.7 상세 탭: 개요

`개요` 탭은 운영 상태를 한 번에 판단하는 탭이다.

| 섹션 | 기능 |
| --- | --- |
| API 상태 | health check 결과, 메시지, 마지막 체크 시간, 수동 새로고침. |
| 허용된 도구 | 이 connection으로 호출 가능한 tool/capability 칩 표시. |
| 권한 규칙 | 읽기/쓰기/차단 rule 요약, 편집 진입. |
| 지출 한도 | 월/일 한도, 현재 사용량, 알림 임계값, 진행률 막대. |
| 최근 테스트 요청 | endpoint, 성공/실패, 상대 시간, 모두 보기 링크. |

이미지의 OpenRouter 예시는 다음이다.

| 섹션 | 표시값 |
| --- | --- |
| API 상태 | 정상, 모든 서비스가 정상적으로 작동 중입니다, 2분 전 |
| 허용된 도구 | 텍스트 생성, 채팅, 코드 실행, 웹 검색, 파일 분석, 이미지 분석 |
| 권한 규칙 | 읽기: 모든 모델 및 라우팅 정보 / 쓰기: 채팅 생성, 파일 업로드 / 차단: 결제 정보 변경, API 키 관리 |
| 지출 한도 | 월 `$50.00 / $100.00` 50%, 일 `$3.20 / $10.00` 32%, 알림 임계값 80% |
| 최근 테스트 요청 | models/list, chat/completions, embeddings, files/upload 모두 성공 |

### 6.8 상세 탭: 설정

| 설정 그룹 | 필드 | 기능 |
| --- | --- | --- |
| 기본 정보 | 표시명, 설명, 유형, 소유 범위, 활성 여부 | 목록 표시와 권한 범위 결정. |
| 인증 | credential 유형, key fingerprint, OAuth 계정, 만료일, 재인증 | 원문 비노출. 재검증/교체만 제공. |
| endpoint | base URL, region, timeout, retry policy | provider별 API 호출 설정. |
| capability | 허용 capability, 기본 tool mapping, agent 사용 가능 여부 | 에이전트 빌더와 run 실행 후보에 반영. |
| permission | read/write/approve-required/blocked rule | 위험 작업과 자동 실행 차단. |
| fallback | 기본 provider 실패 시 대체 provider | 모델 라우팅과 scheduler 재시도에 사용. |

설정 저장 전에는 변경 영향 preview를 보여준다. 예를 들어 base URL 변경은 모든 health check와 run 호출에 영향을 주므로 active run이 있으면 저장을 막거나 다음 실행부터 적용하게 한다.

### 6.9 상세 탭: 사용량

| 항목 | 기능 |
| --- | --- |
| 기간 선택 | 오늘, 7일, 30일, 이번 달, 사용자 지정. |
| 비용 | 총액, 일별 추이, agent별 비용, topic별 비용, endpoint별 비용. |
| 토큰/요청 | input token, output token, embedding token, request count, cache hit. |
| 성능 | 평균 latency, p95 latency, 성공률, 실패율, retry 수. |
| 한도 | 월 한도, 일 한도, run당 한도, 알림 임계값, 초과 시 동작. |
| 내보내기 | CSV 또는 audit report 다운로드. |

비용 데이터는 provider 청구 API가 있으면 실제값, 없으면 내부 추정값으로 표시한다. 추정값인 경우 `추정` 배지를 붙인다.

### 6.10 상세 탭: 로그

| 항목 | 기능 |
| --- | --- |
| 테스트 요청 로그 | health check와 수동 테스트 endpoint의 성공/실패 이력. |
| 실행 로그 | agent/run/schedule에서 이 connection을 호출한 요약. |
| 권한 로그 | rule 변경, 승인, 차단, override 변경 기록. |
| 인증 로그 | key 추가, rotate, 폐기, OAuth 재인증, 만료 알림. |
| 필터 | endpoint, 상태, actor, agent, run, schedule, 기간. |
| 상세 | request id, status code, latency, cost, error code, masked payload. |

민감 정보는 로그에서 마스킹한다. prompt/body 전체 원문은 기본 저장하지 않고, 디버그 모드에서 사용자가 명시적으로 켠 경우에도 보존 기간을 제한한다.

## 7. Provider / Tool / MCP / Service / Capability 분류

### 7.1 분류 기준

| 분류 | 내부 객체 | 설명 | 예시 |
| --- | --- | --- | --- |
| Provider | `provider` | 모델, API 라우팅, 외부 API 공급자 | OpenRouter, Gemini, Claude, Kimi, Qwen |
| Tool | `tool` | 에이전트나 채팅이 호출하는 실행 단위 | 텍스트 생성, 채팅, 코드 실행, 웹 검색, 파일 분석 |
| MCP | `mcp_server`, `mcp_tool` | MCP 프로토콜로 노출되는 서버와 도구 | Codex app-server, local MCP tools |
| Service | `service` | OAuth/API로 연결되는 외부 서비스 | Google Drive, YouTube, Map, Web Search |
| Capability | `capability` | permission과 UI 노출을 묶는 기능 범주 | read_model_info, create_chat, upload_file, search_web |
| Credential | `credential` | provider/service 접속 비밀값 | API key, OAuth token, local token |
| Connection | `connection` | 위 요소를 사용자/허브 범위에서 묶는 표시·정책 단위 | OpenRouter 연결, Google Drive 연결 |

### 7.2 Capability 예시

| Capability | 사용자 표시 | 기본 권한 | 위험도 | 관련 화면 |
| --- | --- | --- | --- | --- |
| `model.read` | 모델 및 라우팅 정보 읽기 | read | 낮음 | 에이전트, 설정 |
| `chat.create` | 채팅 생성 | write | 중간 | 오늘, 주제, 에이전트 |
| `embedding.create` | 임베딩 생성 | write | 중간 | 기억, 스크랩, 파일 |
| `file.upload` | 파일 업로드 | approve-required | 중간 | 파일, 에이전트 |
| `file.read` | 파일 읽기 | read | 중간 | 파일, 기억 |
| `web.search` | 웹 검색 | read | 낮음 | 오늘, 스크랩, 리서치 |
| `image.analyze` | 이미지 분석 | write | 중간 | 파일, 스크랩 |
| `code.execute` | 코드 실행 | approve-required | 높음 | 에이전트, 맡긴 일 |
| `billing.update` | 결제 정보 변경 | blocked | 높음 | 설정 |
| `credential.manage` | API 키 관리 | blocked | 높음 | 연결, 설정 |

### 7.3 연결별 기본 매핑

| 연결 | Provider | Service | MCP | 주요 Tool | 주요 Capability |
| --- | --- | --- | --- | --- | --- |
| OpenRouter | 있음 | 없음 | 없음 | chat, text generation, embeddings | model.read, chat.create, embedding.create |
| Codex app-server | 있음 또는 local | 있음 | 있음 | code execution, local workspace access | code.execute, file.read, file.write, tool.call |
| Gemini | 있음 | 없음 | 없음 | chat, image analysis, embeddings | model.read, chat.create, image.analyze |
| Claude | 있음 | 없음 | 없음 | chat, text generation, file analysis | model.read, chat.create, file.read |
| Kimi | 있음 | 없음 | 없음 | chat, long context reading | model.read, chat.create |
| Qwen | 있음 | 없음 | 없음 | chat, code, multilingual generation | model.read, chat.create, code.assist |
| Google Drive | 없음 | 있음 | 선택 | file read/write, sync | file.read, file.write, file.sync |
| YouTube | 없음 | 있음 | 선택 | transcript fetch, metadata read | media.read, transcript.read |
| Web Search | 없음 | 있음 | 선택 | search, page fetch | web.search, page.read |
| Map | 없음 | 있음 | 선택 | geocode, route, place search | map.search, map.route, map.read |

## 8. Health Check

### 8.1 상태 모델

| 상태 | 의미 | UI 표시 | 실행 영향 |
| --- | --- | --- | --- |
| `connected` | 최근 health check 성공 | 초록 `연결됨` | 실행 후보 포함 |
| `degraded` | 일부 endpoint 실패 또는 지연 증가 | 노랑 `일부 오류` | 낮은 우선순위 또는 fallback 사용 |
| `error` | 주요 endpoint 실패 | 빨강 `오류` | 새 run 생성 차단 또는 승인 필요 |
| `expired` | credential 만료 | 빨강 `만료` | 재인증 전 실행 차단 |
| `disabled` | 사용자가 비활성화 | 회색 `비활성` | 실행 후보 제외 |
| `setup_required` | 필수 설정 누락 | 회색 `설정 필요` | 설정 완료 전 실행 불가 |
| `cost_blocked` | 비용 한도 초과 | 주황 `비용 차단` | 한도 조정/승인 전 실행 차단 |

### 8.2 Check 항목

| 대상 | 테스트 | 성공 기준 |
| --- | --- | --- |
| Provider metadata | `models/list` 또는 equivalent | 2xx 응답, 모델 목록 파싱 가능 |
| Chat/text generation | 최소 prompt 요청 | 2xx 응답, 응답 본문 스키마 유효 |
| Embedding | 짧은 문자열 임베딩 | vector shape와 dimension 유효 |
| File upload/read | 작은 테스트 파일 또는 dry-run | 업로드 가능 또는 dry-run permission 확인 |
| OAuth service | token introspection 또는 metadata read | 계정 식별 가능, scope 충족 |
| MCP server | initialize, tools/list | MCP protocol handshake 성공 |
| Web/map service | 샘플 query | rate limit 이내, 결과 schema 유효 |
| Cost API | usage 조회 | 사용량 조회 가능 또는 추정 모드 fallback |

### 8.3 실행 정책

- 카드의 마지막 동기화 시간은 health check와 metadata sync 중 최신 성공 시간을 우선 표시한다.
- 수동 새로고침은 현재 선택 connection만 검사한다.
- 오버플로의 일괄 health check는 비활성 연결을 제외하고 실행한다.
- 실패한 check는 endpoint, status code, latency, error code를 로그에 남긴다.
- 동일 오류가 반복되면 알림을 합친다. 예를 들어 1시간 안에 같은 credential 만료 오류는 하나의 알림으로 유지한다.
- health check 자체가 비용을 만들 수 있으면 무료 endpoint를 우선 사용하고, 비용 발생 테스트는 명시 승인 또는 설정된 테스트 예산 안에서만 실행한다.

## 9. 허용 도구 / 권한 Rule / 비용 한도 / 테스트 로그

### 9.1 허용 도구

허용 도구는 connection이 제공할 수 있는 기능 중 이 허브에서 실제로 사용할 수 있게 켠 목록이다. 이미지의 OpenRouter는 `텍스트 생성`, `채팅`, `코드 실행`, `웹 검색`, `파일 분석`, `이미지 분석` 6개가 보인다.

| 필드 | 설명 |
| --- | --- |
| `toolId` | 내부 tool 식별자 |
| `displayName` | 사용자 표시명 |
| `capabilityIds` | tool 실행에 필요한 capability 목록 |
| `enabled` | 현재 connection에서 허용 여부 |
| `defaultPermission` | read/write/approve-required/blocked |
| `availableToAgents` | 에이전트 빌더에서 선택 가능한지 |
| `availableToSchedules` | 반복 작업에서 자동 실행 가능한지 |
| `requiresApprovalReason` | 승인 필요 사유 |

### 9.2 권한 Rule

권한 rule은 connection 기본 정책, agent override, run-time approval 순으로 적용한다.

| Rule | 의미 | 예시 |
| --- | --- | --- |
| `read` | 자동 실행 가능하지만 외부 상태 변경 없음 | 모델 목록 조회, 웹 검색, 지도 장소 조회 |
| `write` | 외부 API 호출 또는 생성 작업 가능 | 채팅 생성, 임베딩 생성, 파일 업로드 |
| `approve-required` | 실행 전 사용자 승인 필요 | 코드 실행, 대량 파일 업로드, 외부 저장소 쓰기 |
| `blocked` | 사용자 승인으로도 실행 불가. 설정 변경 필요 | 결제 정보 변경, API key 관리, credential export |

우선순위는 더 제한적인 rule을 기본으로 한다. 예를 들어 connection은 write를 허용하지만 특정 agent가 read-only이면 해당 agent 실행에서는 read-only가 적용된다.

### 9.3 비용 한도

| 한도 | 설명 | 초과 시 동작 |
| --- | --- | --- |
| 월 사용 한도 | connection별 월 비용 상한 | 차단 또는 승인 대기 |
| 일 사용 한도 | connection별 일 비용 상한 | 차단 또는 승인 대기 |
| run당 한도 | 단일 맡긴 일 실행 비용 상한 | run 일시정지 후 승인 요청 |
| agent별 한도 | 특정 agent의 월/일 비용 상한 | 해당 agent 실행 제한 |
| 알림 임계값 | 50%, 80%, 90% 등 알림 기준 | 알림 생성, 실행은 유지 |
| 테스트 예산 | health check와 수동 테스트 비용 상한 | 테스트 중단 |

비용 한도는 연결 화면에서 connection별로 보되, 전역 비용 정책은 설정 화면과 동기화한다. 연결별 한도는 전역 한도를 넘을 수 없다.

### 9.4 테스트 로그

| 필드 | 설명 |
| --- | --- |
| `testLogId` | 테스트 로그 식별자 |
| `connectionId` | 대상 연결 |
| `endpoint` | models/list, chat/completions, embeddings, files/upload 등 |
| `status` | success, failed, skipped, blocked |
| `statusCode` | 외부 API status code |
| `latencyMs` | 응답 시간 |
| `checkedAt` | 테스트 시간 |
| `actorType` | user, system, schedule, agent |
| `trigger` | manual, periodic, after_save, run_failure |
| `requestId` | provider request id 또는 내부 trace id |
| `errorCode` | 실패 시 표준화된 오류 코드 |
| `costEstimate` | 테스트 비용 추정 |
| `relatedRunId` | 실패 run에서 진입한 경우 |

로그 목록에는 payload 원문을 표시하지 않는다. 필요한 경우 masked payload와 schema validation 결과만 제공한다.

## 10. 비활성화 영향 Edge Case

### 10.1 영향 분석 대상

연결 비활성화, credential 교체, 권한 축소, 비용 한도 축소 전 다음 참조를 계산한다.

| 대상 | 확인 내용 |
| --- | --- |
| Agent | 기본 모델, 허용 도구, 테스트 채팅, 배포 상태에서 해당 connection을 참조하는지 |
| 맡긴 일 run | 진행 중/승인 대기/실패 후 재시도 대기 run이 해당 connection을 쓰는지 |
| Schedule | 반복 작업의 다음 실행에 해당 connection이 필요한지 |
| Topic | 주제 작업면, 연결 자료, 자동화가 해당 service를 쓰는지 |
| Memory/Scrap/File | 외부 자료 읽기, 동기화, 요약, 임베딩이 해당 connection에 의존하는지 |
| Calendar/Todo | 자동 일정 제안, 지도 경로 계산, task 위임이 해당 connection에 의존하는지 |
| Default routing | 전역 기본 모델 또는 fallback provider로 설정되어 있는지 |

### 10.2 비활성화 선택지

| 선택지 | 동작 |
| --- | --- |
| 즉시 끄기 | 실행 후보에서 즉시 제거. 진행 중 run은 실패 또는 일시정지 처리. |
| 이번 실행 후 끄기 | active run은 계속 진행하고 새 run/schedule부터 차단. |
| 특정 agent에서만 끄기 | connection은 유지하고 agent override로만 제외. |
| 읽기 전용으로 낮추기 | write capability만 제거하고 read capability는 유지. |
| 취소 | 아무 변경도 하지 않음. |

### 10.3 Edge Case 목록

| 상황 | 기대 동작 |
| --- | --- |
| 활성 run이 동일 connection을 이미 호출 중 | 중간 취소 가능 여부를 provider별로 판단한다. 취소 불가면 run 완료 후 비활성화 선택지를 제공한다. |
| schedule 다음 실행 시간이 임박 | 비활성화 확인 모달에 다음 실행 시간과 예상 실패를 표시한다. |
| fallback provider가 있음 | fallback으로 자동 전환 가능한 agent/schedule과 불가능한 항목을 구분한다. |
| OAuth token 만료와 사용자가 끈 상태가 동시에 발생 | 사용자 비활성화를 우선 상태로 표시하고, 상세에는 credential 만료도 함께 표시한다. |
| 비용 한도 때문에 차단된 연결을 끔 | 비용 차단 run은 비활성화로 상태를 바꾸지 않고 `비용 차단 + 연결 비활성` 복합 원인을 기록한다. |
| 권한 축소로 기존 agent draft가 invalid | 에이전트 빌더에서 해당 tool을 `사용 불가`로 표시하고 저장 전 수정 요구. |
| 연결 삭제 요청 | 삭제 대신 기본은 비활성화와 credential 폐기다. 로그와 사용량 기록은 audit 목적상 보존한다. |
| 공유 연결을 개인 사용자가 끄려 함 | 개인 override만 허용하거나 관리자 권한 필요 메시지를 표시한다. |
| Map/Web Search 같은 읽기 전용 서비스가 꺼짐 | 여행 작업면, 리서치, 자동 요약에서 관련 CTA를 비활성화하고 대체 provider를 제안한다. |
| Google Drive가 꺼짐 | 기존 파일 메타데이터는 보존하지만 원문 재조회, 동기화, 새 업로드는 차단한다. |

## 11. 설정 / 에이전트 / 맡긴 일 연계

### 11.1 설정 화면 연계

| 설정 영역 | 연결 화면과의 관계 |
| --- | --- |
| 모델 | 기본 provider와 모델 라우팅은 설정에서 관리하고, 연결 화면은 provider별 상태와 capability를 관리한다. |
| 비용 | 전역 월/일 한도는 설정이 상위 정책이다. 연결별 한도는 그 안에서 세분화한다. |
| 보안 | API key rotation, OAuth 재인증, 접근 로그는 보안 설정과 연결 로그 양쪽에서 진입 가능해야 한다. |
| Dev Mode | 자체 API token, TUI, MCP, localhost API가 connection/service로 등록될 수 있다. |

### 11.2 에이전트 화면 연계

| 에이전트 기능 | 연결 화면 의존성 |
| --- | --- |
| 모델 선택 | 활성 model provider와 사용 가능한 model/capability만 노출한다. |
| 도구 선택 | connection의 allowed tool과 permission rule을 기준으로 선택 가능 여부를 계산한다. |
| 권한 설정 | agent rule은 connection rule보다 넓어질 수 없다. |
| 테스트 채팅 | 테스트 실행 로그가 connection의 로그 탭에도 남는다. |
| 배포 검증 | agent 배포 전 필수 connection health와 비용 한도를 검증한다. |

### 11.3 맡긴 일 / Schedule 연계

| 맡긴 일 기능 | 연결 화면 의존성 |
| --- | --- |
| run 생성 | 필요한 connection이 연결됨/활성/권한 충족/비용 한도 이내인지 확인한다. |
| run 진행 | connection 실패, 비용 차단, 권한 차단이 run 상태 전환 원인이 된다. |
| run 로그 | provider request id와 connection test log를 연결한다. |
| 반복 schedule | 다음 실행 전 health check와 credential 만료를 검사한다. |
| 승인 대기 | approve-required capability, 비용 초과, 외부 쓰기 작업이 approval_request를 만든다. |

## 12. 상태 / 오류 / 빈 화면

| 상태 | UI |
| --- | --- |
| 초기 로딩 | 카드 skeleton과 우측 패널 skeleton을 표시한다. |
| 연결 없음 | `아직 연결이 없습니다`, `연결 추가`, 추천 provider 목록을 표시한다. |
| 검색 결과 없음 | `조건에 맞는 연결이 없습니다`, 필터 초기화와 연결 추가 CTA. |
| 상세 로딩 실패 | 우측 패널에 오류 메시지와 다시 시도 버튼. 목록은 유지. |
| health check 실패 | 카드 상태를 오류로 갱신하고 상세 API 상태에 실패 endpoint 표시. |
| 권한 없음 | 관리 권한 없는 연결은 읽기 전용으로 표시하고 편집/토글을 비활성화. |
| 비용 정보 없음 | `$0.00`으로 오인하지 않게 `사용량 조회 불가` 또는 `추정 불가` 표시. |
| provider rate limit | `일시 제한` 상태와 다음 재시도 가능 시간을 표시. |

## 13. 데이터 필드 / API 힌트

### 13.1 Connection

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | connection id |
| `workspaceId` | string | 허브/워크스페이스 범위 |
| `ownerType` | enum | user, workspace, system |
| `displayName` | string | 카드와 상세 패널 표시명 |
| `description` | string | 연결 설명 |
| `iconUrl` | string | 로고 또는 아이콘 |
| `category` | enum | provider, mcp, service, storage, search, map, code, file, media |
| `providerKey` | string | openrouter, gemini, claude 등 |
| `status` | enum | connected, degraded, error, expired, disabled, setup_required, cost_blocked |
| `enabled` | boolean | 실행 후보 포함 여부 |
| `lastSyncedAt` | datetime | 마지막 metadata sync |
| `lastHealthCheckedAt` | datetime | 마지막 health check |
| `permissionSummary` | string | 카드용 권한 요약 |
| `monthlyUsageAmount` | number | 이번 달 사용액 |
| `currency` | string | USD 등 |
| `createdAt` | datetime | 생성일 |
| `updatedAt` | datetime | 수정일 |

### 13.2 Credential

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | credential id |
| `connectionId` | string | 연결 id |
| `type` | enum | api_key, oauth, local_token, service_account |
| `maskedLabel` | string | 마스킹된 표시값 |
| `fingerprint` | string | key 식별용 hash prefix |
| `expiresAt` | datetime | 만료일 |
| `lastRotatedAt` | datetime | 마지막 교체일 |
| `scopes` | string[] | OAuth/API scope |
| `status` | enum | valid, expired, revoked, unknown |

### 13.3 Permission Policy

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | policy id |
| `connectionId` | string | 연결 id |
| `capabilityId` | string | capability id |
| `rule` | enum | read, write, approve_required, blocked |
| `scope` | enum | connection, agent, schedule, run |
| `scopeId` | string | agentId/scheduleId 등 |
| `reason` | string | rule 사유 |
| `updatedBy` | string | 변경자 |
| `updatedAt` | datetime | 변경일 |

### 13.4 Usage / Limit

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `connectionId` | string | 연결 id |
| `period` | enum | day, month, run |
| `usedAmount` | number | 사용액 |
| `limitAmount` | number | 한도 |
| `currency` | string | 통화 |
| `usagePercent` | number | 진행률 |
| `alertThresholdPercent` | number | 알림 임계값 |
| `onLimitExceeded` | enum | block, require_approval, notify_only |

### 13.5 API 힌트

| API | 용도 |
| --- | --- |
| `GET /api/connections` | 목록 조회. 탭, 검색, 상태, 유형, 정렬 query 지원. |
| `POST /api/connections` | 신규 연결 생성. credential 저장과 metadata 검증은 단계 분리 가능. |
| `GET /api/connections/{connectionId}` | 상세 조회. 개요/설정/사용량/로그 요약 포함. |
| `PATCH /api/connections/{connectionId}` | 표시명, 활성 여부, endpoint, capability 설정 변경. |
| `POST /api/connections/{connectionId}/health-check` | 수동 health check 실행. |
| `GET /api/connections/{connectionId}/impact` | 비활성화/권한 변경/삭제 전 영향 분석. |
| `PUT /api/connections/{connectionId}/permissions` | 권한 rule 저장. |
| `PUT /api/connections/{connectionId}/limits` | 비용 한도 저장. |
| `GET /api/connections/{connectionId}/usage` | 사용량 조회. 기간 query 지원. |
| `GET /api/connections/{connectionId}/logs` | 테스트/실행/권한/인증 로그 조회. |
| `POST /api/connections/{connectionId}/tests` | endpoint별 수동 테스트 실행. |
| `POST /api/connections/{connectionId}/credentials/rotate` | credential 교체 시작. |
| `POST /api/connections/{connectionId}/oauth/reauthorize` | OAuth 재인증 시작. |

## 14. 수용 기준

1. 사용자는 연결 목록에서 이름, 상태, 활성 토글, 마지막 동기화, 권한, 이번 달 사용액을 확인할 수 있다.
2. `도구`, `모델`, `MCP`, `권한`, `비용` 탭이 존재하고 같은 연결 데이터를 탭 기준으로 탐색할 수 있다.
3. 검색, 상태 필터, 유형 필터, 정렬 조건이 목록에 반영된다.
4. 연결 카드를 선택하면 우측 상세 패널이 열리고 선택 연결의 개요가 표시된다.
5. OpenRouter 상세에는 API 상태, 허용된 도구 6개, 권한 규칙, 지출 한도, 최근 테스트 요청이 표시된다.
6. health check를 수동 실행할 수 있고 결과가 상태와 테스트 로그에 반영된다.
7. 활성 토글을 끌 때 영향받는 agent, schedule, active run, topic/source/file 의존성을 확인한 뒤 적용할 수 있다.
8. permission rule은 read/write/approve-required/blocked를 지원하고, agent/schedule에서 더 넓은 권한으로 우회할 수 없다.
9. 월/일/run당 비용 한도와 알림 임계값을 표시하고, 한도 초과 시 block 또는 approve-required 동작을 지원한다.
10. 테스트 로그는 endpoint, 성공/실패, 시간, latency, request id, 관련 run을 확인할 수 있다.
11. credential 원문은 저장 후 화면에 다시 노출되지 않고, 마스킹 표시와 rotation/reauthorize 액션만 제공한다.
12. 연결 상태 오류, credential 만료, 비용 차단, 비활성 상태가 UI와 실행 정책에 구분되어 반영된다.
13. 에이전트 빌더는 활성 connection의 tool/capability/permission을 기준으로 사용 가능 도구를 계산한다.
14. 맡긴 일과 schedule은 실행 전 connection health, 권한, 비용 한도를 검증한다.
15. 빈 상태, 검색 결과 없음, 권한 없음, 상세 로딩 실패, 사용량 조회 불가 상태가 각각 명확한 UI를 가진다.

## 15. 오픈 질문

| 질문 | 후보 |
| --- | --- |
| `도구` 탭과 `모델` 탭의 중복 노출을 어느 정도 허용할지 | 같은 connection을 여러 탭에 노출하되 탭별 강조 필드만 바꿈 |
| Codex app-server를 provider, MCP, service 중 어디에 주로 배치할지 | 카드 category는 `MCP/local service`, capability는 code/file/tool로 분리 |
| OpenRouter가 제공하지 않는 `웹 검색`, `파일 분석`, `이미지 분석` capability를 어떻게 모델링할지 | provider 자체 capability와 플랫폼 조합 capability를 구분 |
| 비용 사용량을 provider 청구 API와 내부 추정값 중 무엇으로 우선 표시할지 | 실제 청구 API 우선, 없으면 `추정` 배지 |
| 연결별 비용 한도가 전역 한도와 충돌할 때 UX | 전역 한도를 상위 제한으로 두고 연결별 한도는 그 이하만 허용 |
| health check 주기 | provider 중요도와 최근 실패 여부에 따라 5분/30분/일 1회 등 차등 |
| 테스트 로그의 prompt/body 보존 범위 | 기본 미보존, 사용자가 디버그 모드에서 켠 경우 짧은 TTL로 masked 저장 |
| 공유 연결의 권한 변경 주체 | 관리자만 connection rule 변경, 일반 사용자는 agent override만 허용 |
| 비활성화와 credential 폐기의 구분 | 비활성화는 실행 후보 제외, 폐기는 인증 제거. 삭제는 별도 위험 액션 |
| 연결 추가 플로우에서 추천 provider 순서 | 최근 실패/필요 기능/에이전트 요구사항/플랜 지원 여부 기준 |

## 16. 엣지케이스 자체 리뷰

첨부 화면에는 정상 연결만 보이지만 구현 시 오류와 운영 상태가 더 중요하다. 개발 착수 전 아래 항목을 확인해야 한다.

| 검토 항목 | 확인 결과 |
| --- | --- |
| 이미지를 기준으로 보이는 기능 누락 여부 | 좌측 내비게이션, 헤더, 탭, 검색/필터/정렬, 10개 카드, 우측 상세 탭, API 상태, 허용 도구, 권한 규칙, 지출 한도, 테스트 요청을 모두 반영. |
| 비활성화 영향 | agent, schedule, active run, topic, memory/scrap/file, default routing까지 영향 분석 대상으로 반영. |
| 권한 우회 | connection rule보다 agent/schedule override가 넓어질 수 없도록 명시. |
| 비용 차단 | 알림 임계값, 일/월/run 한도, block/approval 정책을 분리. |
| credential 보안 | 원문 재노출 금지, 마스킹, rotation/reauthorize, 로그 마스킹 반영. |
| health check 비용 | 비용 발생 테스트는 무료 endpoint 우선 또는 테스트 예산 안에서 실행하도록 반영. |
| BE/FE 필드 정합 | connection, credential, permission policy, usage/limit, test log 필드명을 API 힌트와 맞춤. |
| 목록 key | 카드/로그/허용 도구는 각각 `connectionId`, `testLogId`, `toolId`를 key로 사용할 수 있게 필드 반영. |
