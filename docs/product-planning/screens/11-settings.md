# 11. 설정 / Settings 화면 상세 기획

## 1. 화면 목적

`설정` 화면은 개인형 Agent 플랫폼의 전역 운영 콘솔이다. 사용자는 여기서 모델 접속 방식, 기본 모델 라우팅, 사용량과 비용 한도, 승인 정책, 보안 상태, 개발자용 로컬 접근 권한을 한 번에 관리한다.

PRD 기준으로 설정은 단순 프로필 편집 화면이 아니다. 채팅, 주제, 에이전트, 맡긴 일, 스케줄이 실제로 어떤 모델과 도구를 호출할 수 있는지 결정하는 상위 정책 화면이다. 따라서 이 화면의 핵심은 "개인 설정을 저장한다"가 아니라 "AI 실행 경로가 안전하고 예측 가능한 비용 안에서 동작하게 한다"이다.

| 사용자 문제 | 화면에서의 해결 방식 |
| --- | --- |
| 어떤 모델 접속 방식이 살아 있는지 모름 | OpenRouter API Key, Local Codex OAuth, Direct Provider Key 카드를 병렬 표시 |
| 작업 유형별 기본 모델을 매번 고르기 번거로움 | 빠른 답변, 깊은 추론, 코딩, 라이트 작업, 이미지별 모델 라우팅 매트릭스 제공 |
| 비용이 갑자기 늘어날까 불안함 | 월/일 한도, 알림 임계값, 현재 사용량, 이번 달 토큰/비용 카드 제공 |
| 위험한 작업이 자동 실행될까 걱정됨 | 고위험 작업, 비용 임계 초과, 데이터 내보내기, 고비용 모델 변경 승인 정책 제공 |
| API key와 로컬 접근 권한이 노출될까 불안함 | 보안 체크리스트, 토큰 원문 1회 노출, scope 분리, audit log 제공 |
| 외부 자동화나 TUI에서 내 workspace를 쓰고 싶음 | Dev Mode에서 자체 API token, TUI/MCP/HTTP API 접근, localhost endpoint, scope 관리 |

## 2. 화면 범위와 전제

- 이 문서는 첨부 이미지와 `/docs/personal-agent-platform-prd.md` 기준의 PC 웹 화면 상세다.
- 소유 파일은 이 문서 하나이며, 좌측 글로벌 내비게이션과 사용자 카드의 공통 동작은 공통 셸 책임으로 본다.
- 화면명은 한국어 `설정`, 영문 라우트/내부 개념은 `Settings`를 사용한다.
- 첨부 화면은 `설정 > 모델` 탭이 열린 상태다. 다른 탭인 `프로필`, `보안`, `비용`, `개발자`도 같은 화면의 하위 탭으로 정의한다.
- 설정 화면의 변경은 전역 기본값이다. 개별 에이전트, 연결, 스케줄, 주제에서 override가 있으면 전역값보다 구체 정책이 우선한다.
- credential 원문은 저장 직후 한 번만 표시하고 이후에는 마스킹한다. 화면에는 fingerprint, 마지막 검증 시간, 마지막 사용 시간, 만료일, 상태만 표시한다.
- 모델명과 provider명은 샘플 데이터다. 실제 구현은 provider metadata API 또는 내부 model catalog에서 받아온다.

## 3. 정보 구조

### 3.1 전체 레이아웃

| 영역 | 구성 | 역할 |
| --- | --- | --- |
| 좌측 글로벌 내비게이션 | 허브명, 알림, 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말, 사용자 플랜 | 앱 전체 이동. 현재 메뉴 `설정` 활성화. |
| 중앙 헤더 | 제목 `설정`, 탭 `프로필/모델/보안/비용/개발자` | 설정 범위 전환. 첨부 화면에서는 `모델` 탭 활성. |
| 모델 접속 방식 | OpenRouter API Key, Local Codex OAuth, Direct Provider Key 카드 | 모델 호출 경로의 연결 상태, 최근 확인, 관리 액션 표시. |
| 모델 선택 | 작업 유형별 provider/model 드롭다운, 기본 설정 별표 | AI 작업 유형별 라우팅 기본값 지정. |
| 사용 현황 | 이번 달 토큰, 이번 달 비용, 실패율, 평균 응답 시간 | 사용량과 품질 지표 스캔. |
| Dev Mode | 자체 API 토큰, 접근 방식, 로컬 엔드포인트, 감사 로그 | 개발자/자동화 접근 통제. |
| 우측 운영 패널 | 비용 한도, 승인 정책, 보안 체크리스트, 도움말 카드 | 전역 비용/승인/보안 상태와 가이드 접근. |

### 3.2 탭 구조

| 탭 | 목적 | 주요 구성 |
| --- | --- | --- |
| 프로필 | 개인/허브 표시 정보와 기본 언어, 시간대, 알림 선호 관리 | 이름, 프로필 이미지, 플랜, 기본 허브, 언어/시간대, 알림 채널 |
| 모델 | 모델 접속 방식과 작업 유형별 기본 모델 관리 | OpenRouter, Local Codex OAuth, Direct Provider Key, 모델 라우팅, 사용 현황 |
| 보안 | 계정 보안과 credential 보호 상태 관리 | 2단계 인증, HTTPS 전용, API key rotation, 접근 로그, 비정상 활동 알림 |
| 비용 | 비용 한도와 차단 조건 관리 | 월 한도, 일 한도, 알림 임계값, provider별 비용, 차단/승인 정책 |
| 개발자 | 로컬 자동화와 외부 개발 접근 관리 | 자체 API token, TUI, MCP, HTTP API, localhost endpoint, scope, audit log |

### 3.3 첨부 화면에서 추출한 표시 요소

| 위치 | 화면 요소 | 기능 요구사항 |
| --- | --- | --- |
| 좌측 메뉴 | `설정` 활성 상태 | 파란색 아이콘과 강조 배경으로 현재 화면 표시 |
| 상단 탭 | `프로필`, `모델`, `보안`, `비용`, `개발자` | 설정 범위를 전환하며 현재 `모델` 탭을 파란색 underline으로 표시 |
| 중앙 섹션 제목 | `모델 접속 방식` | provider credential 상태 카드 그룹의 제목 |
| OpenRouter 카드 | API Key, 최근 확인, `키 관리`, `...`, `연결됨` | API key 기반 통합 라우터 연결 관리 |
| Local Codex 카드 | 계정, 최근 확인, `다시 인증`, `...`, `연결됨` | 로컬 Codex OAuth 연결과 재인증 |
| Direct Provider 카드 | 사용 중 provider 수, 최근 확인, `키 관리`, `...`, `부분 연결` | OpenAI/Claude/Gemini 등 직접 provider key 관리 |
| 모델 선택 표 | 작업 유형, OpenRouter, Local Codex, Direct Provider, 기본 설정 | 작업 유형별 모델 라우팅 지정 |
| 기본 설정 별표 | 파란 별, 회색 별 | 해당 작업 유형에서 우선 사용할 접속 방식을 지정 |
| 사용 현황 카드 | 이번 달 토큰, 이번 달 비용, 실패율, 평균 응답 시간 | 이번 달 usage/cost/reliability/latency 요약 |
| 비용 한도 패널 | 월 사용 한도, 알림 임계값, 일 사용 한도, 현재 사용 | 비용 제한과 현재 소비 상태 표시 |
| 승인 정책 패널 | 고위험 작업, 비용 임계 초과, 데이터 내보내기, 모델 변경 | 위험 조건별 승인 필요/알림 정책 표시 |
| 보안 체크리스트 | 2단계 인증, HTTPS 전용, API 키 순환, 접근 로그 기록, 비정상 활동 알림 | 보안 권장 상태와 활성/정상 여부 표시 |
| Dev Mode | 자체 API 토큰, 접근 방식, 로컬 엔드포인트, scope, 감사 로그 | 로컬 개발/자동화 통합 관리 |
| 도움말 카드 | `가이드 보기` | 모델 설정과 개발자 기능 가이드로 이동 |

## 4. 진입 / 종료 / 전환 동선

### 4.1 진입 동선

| 진입점 | 동작 |
| --- | --- |
| 좌측 내비게이션 `설정` 클릭 | 마지막으로 열었던 탭을 복원한다. 기록이 없으면 `모델` 탭 또는 제품 기본 탭으로 진입한다. |
| 연결 화면의 provider 비용/권한 링크 | `모델` 또는 `비용` 탭으로 진입하고 해당 provider를 강조한다. |
| 에이전트 빌더의 모델 선택 경고 | `모델` 탭으로 진입하고 누락된 provider credential 또는 작업 유형 row를 강조한다. |
| 맡긴 일의 비용 한도 대기 상태 | `비용` 탭 또는 우측 비용 한도 패널로 진입하고 차단된 run을 연결 표시한다. |
| 승인 대기 알림 | `승인 정책` 영역을 강조하고 관련 approval_request 상세로 이동할 수 있게 한다. |
| 도움말의 Dev Mode 튜토리얼 | `개발자` 탭으로 진입하고 TUI/MCP/HTTP API 접근 설정을 강조한다. |
| URL 직접 접근 | `tab`, `provider`, `credentialId`, `tokenId` query를 해석해 해당 영역을 연다. 권한이 없으면 탭 기본 상태로 fallback한다. |

### 4.2 종료 동선

| 종료 액션 | 결과 |
| --- | --- |
| 좌측 메뉴 이동 | 저장되지 않은 변경이 있으면 저장/폐기 확인 후 이동한다. 저장된 탭, 선택 provider, 스크롤 위치는 세션 범위에서 보존한다. |
| 모델 드롭다운 변경 후 이탈 | 변경 즉시 저장이면 toast를 표시한다. 일괄 저장 방식이면 변경 내용 요약 모달을 표시한다. |
| credential 관리 모달 닫기 | 새 키가 검증되지 않았으면 저장하지 않는다. 저장된 키는 원문 재표시 없이 fingerprint만 남긴다. |
| 비용 한도 편집 취소 | 입력값을 이전 저장 상태로 되돌리고 현재 running run에는 영향을 주지 않는다. |
| Dev token 생성 완료 후 닫기 | token 원문 복사 여부와 관계없이 원문 표시 상태를 종료하면 다시 조회할 수 없다. |

### 4.3 내부 전환

| 전환 | 트리거 | 기대 동작 |
| --- | --- | --- |
| 탭 전환 | `프로필/모델/보안/비용/개발자` 클릭 | 같은 Settings route 안에서 중앙 콘텐츠를 전환한다. 우측 운영 패널은 탭에 맞게 유지 또는 축약한다. |
| provider 카드 선택 | OpenRouter/Local Codex/Direct Provider 카드 클릭 | 카드 상세 모달 또는 하단 상세 drawer를 연다. `키 관리`, `다시 인증`은 직접 액션으로 동작한다. |
| 모델 드롭다운 변경 | 표의 provider/model select 변경 | 해당 작업 유형의 candidate model을 변경하고 compatibility, 비용, 권한을 검증한다. |
| 기본 별표 변경 | 기본 설정 열의 별 클릭 | 해당 작업 유형에서 우선 접속 방식을 변경한다. 변경 전 사용 중인 agent/schedule 영향 범위를 계산한다. |
| 비용 편집 | 우측 `비용 한도 > 편집` 클릭 | 월 한도, 알림 임계값, 일 한도, 차단 조건을 편집 모드로 전환한다. |
| 승인 정책 편집 | 우측 `승인 정책 > 편집` 클릭 | 위험 작업별 `승인 필요`, `알림만`, `자동 허용`, `차단` 중 선택한다. |
| 보안 항목 클릭 | 체크리스트 row 클릭 | 해당 보안 설정 탭 또는 상세 모달로 이동한다. |
| Dev 접근 토글 | TUI/MCP/HTTP API 스위치 변경 | scope와 token 상태를 검증하고 audit log를 남긴다. |

## 5. 핵심 시나리오

### 5.1 OpenRouter API Key 연결 상태 확인

1. 사용자가 `설정 > 모델` 탭에 진입한다.
2. `OpenRouter API Key` 카드에서 상태가 `연결됨`, API key가 `sk-or-v1-********************55a1`, 최근 확인이 `2분 전`임을 확인한다.
3. 사용자가 `키 관리`를 누른다.
4. 시스템은 현재 key fingerprint, 마지막 검증 시간, 마지막 사용 시간, 연결된 모델 목록, 최근 실패 로그를 보여준다.
5. 사용자가 새 key를 입력하면 저장 전 `models/list` 또는 최소 검증 요청을 수행한다.
6. 검증 성공 시 기존 key를 대체하고 model catalog를 갱신한다.
7. 검증 실패 시 기존 key는 유지하고 실패 원인, status code, request id를 표시한다.

### 5.2 Local Codex OAuth 재인증

1. 사용자가 `Local Codex OAuth` 카드에서 계정 `minho@codex.local`, 최근 확인 `5분 전`을 확인한다.
2. OAuth 세션이 만료되었거나 provider catalog 동기화가 실패하면 카드 상태를 `재인증 필요`로 표시한다.
3. 사용자가 `다시 인증`을 누른다.
4. 시스템은 로컬 Codex 인증 플로우를 열고 계정 확인을 완료한다.
5. 인증 완료 후 사용 가능한 모델 목록을 갱신하고 `codex-short-latest`, `codex-reasoning`, `codex-code-latest`, `codex-mini`, `codex-vision` 같은 후보를 표에 표시한다.
6. 실패하면 기존 세션이 유효한지, 완전 만료인지 구분하고 후속 액션을 안내한다.

### 5.3 Direct Provider Key 일부 연결 상태 관리

1. 사용자가 `Direct Provider Key` 카드에서 상태가 `부분 연결`, 사용 중 `2/4 제공자`, 최근 확인 `1시간 전`임을 확인한다.
2. `키 관리`를 누르면 provider 목록이 열린다.
3. 각 provider는 OpenAI, Anthropic, Gemini, Kimi 등으로 표시하고 `연결됨`, `미설정`, `검증 실패`, `quota 초과`, `권한 부족` 상태를 가진다.
4. 사용자는 provider별 key를 추가, 교체, 폐기, 테스트할 수 있다.
5. provider가 연결되면 모델 선택 표의 Direct Provider 열 후보가 갱신된다.
6. 연결되지 않은 provider를 기본값으로 선택하려 하면 저장을 막고 연결 플로우로 안내한다.

### 5.4 작업 유형별 모델 라우팅 설정

1. 사용자가 모델 선택 표에서 `빠른 답변` row를 확인한다.
2. OpenRouter 열은 `Fast LLM 3.1`, Local Codex 열은 `codex-short-latest`, Direct Provider 열은 `Provider Lite 1.0`을 표시한다.
3. 사용자가 별표를 OpenRouter에서 Direct Provider로 변경한다.
4. 시스템은 해당 작업 유형을 사용하는 전역 채팅, agent default, schedule template, run retry policy의 영향 범위를 계산한다.
5. 비용, latency, capability mismatch가 없으면 저장한다.
6. 이미지 생성 같은 특정 capability가 없는 provider를 선택하면 선택은 허용하지 않고 대체 후보를 표시한다.

### 5.5 비용 한도와 알림 임계값 조정

1. 사용자가 우측 `비용 한도` 패널에서 월 사용 한도 `$100.00`, 현재 사용 `$28.42`, 사용률 `28%`를 확인한다.
2. `편집`을 누르고 월 한도, 알림 임계값 `$80.00 (80%)`, 일 사용 한도 `$5.00`을 수정한다.
3. 저장 전 시스템은 현재 실행 중 run, 예약 작업, 에이전트 예상 비용을 기준으로 새 한도 적용 시 차단될 항목을 계산한다.
4. 새 한도가 현재 사용량보다 낮으면 즉시 차단 조건을 표시하고 명시 확인을 요구한다.
5. 저장 후 비용 정책 변경 audit log를 남긴다.
6. 이후 run이 한도에 도달하면 `승인 정책`에 따라 승인 대기, 알림, 차단 중 하나로 처리한다.

### 5.6 승인 정책 변경

1. 사용자가 우측 `승인 정책` 패널에서 고위험 작업, 비용 임계 초과, 데이터 내보내기가 `승인 필요`임을 확인한다.
2. `모델 변경 (고비용)`은 `알림만`으로 표시된다.
3. 사용자가 `편집`을 눌러 조건별 정책을 바꾼다.
4. 시스템은 정책 변경으로 자동 실행 권한이 넓어지는 경우 추가 확인을 요구한다.
5. 정책 저장 후 agent, schedule, run 생성 플로우는 새 정책을 참조한다.
6. 승인 정책 변경은 audit log에 actor, oldValue, newValue, affectedScope를 남긴다.

### 5.7 Dev Mode token으로 로컬 TUI 연결

1. 사용자가 `Dev Mode` 섹션에서 자체 API 토큰 `hub_dev_token_01`이 `활성`, 생성일 `2024.05.10`, 최근 사용 `2분 전`임을 확인한다.
2. `접근 방식`에서 `TUI 접근`, `MCP 접근`, `HTTP API`가 켜져 있는지 확인한다.
3. `로컬 엔드포인트`의 `http://localhost:8787`을 복사한다.
4. scope가 `read`, `write`, `agents`, `files`, `memory` 및 추가 scope로 제한되어 있음을 확인한다.
5. 외부 TUI 또는 MCP 클라이언트가 token으로 localhost endpoint를 호출한다.
6. 시스템은 요청별 path, scope, token fingerprint, 결과, latency를 `감사 로그`에 기록한다.
7. 사용자가 이상 사용을 발견하면 token을 폐기하고 접근 방식을 끈다.

## 6. 컴포넌트별 상세 기능

### 6.1 좌측 글로벌 내비게이션

| 요소 | 기능 |
| --- | --- |
| 허브명 `내 AI 허브` | 현재 설정이 적용되는 hub/workspace를 표시한다. 허브 전환 시 credential과 token 범위를 재조회한다. |
| 알림 아이콘 | 비용 임계값 도달, 승인 대기, OAuth 만료, 보안 경고를 표시한다. |
| 메뉴 목록 | 현재 `설정` 메뉴를 파란색 활성 상태로 표시한다. |
| 사용자 카드 | 사용자명, 플랜, 계정 메뉴 진입. 첨부 화면 기준 `Minho`, `프로 플랜` 표시. |

허브별 공유 credential과 개인 credential이 함께 있을 수 있다. 화면에서는 현재 사용자가 관리 가능한 항목만 편집 가능하게 하고, 읽기 권한만 있는 항목은 잠금 상태로 표시한다.

### 6.2 화면 헤더와 탭

| 요소 | 기능 |
| --- | --- |
| 제목 `설정` | 현재 화면 식별. |
| 탭 | `프로필`, `모델`, `보안`, `비용`, `개발자` 순서. |
| 활성 탭 표시 | 파란색 text와 underline으로 표시한다. |
| 탭 상태 보존 | URL query 또는 route state로 마지막 탭을 복원한다. |

탭 전환 시 저장되지 않은 변경이 있으면 이탈 확인을 표시한다. 모델 라우팅과 비용 정책처럼 즉시 저장 가능한 설정은 변경 직후 toast로 저장 완료를 알린다.

### 6.3 모델 접속 방식 카드 공통

| 요소 | 기능 |
| --- | --- |
| provider 아이콘 | OpenRouter, Codex, key 등 접속 방식별 아이콘 표시. |
| 제목 | 접속 방식 이름 표시. |
| 상태 배지 | `연결됨`, `부분 연결`, `재인증 필요`, `검증 실패`, `비활성`, `설정 필요`. |
| 핵심 메타 | key fingerprint, OAuth 계정, 사용 중 provider 수 등 방식별 주요 값 표시. |
| 최근 확인 | 마지막 health check 또는 credential validation 시각 표시. |
| 기본 액션 | `키 관리`, `다시 인증` 등 주요 관리 액션. |
| 더보기 | 상세 로그, 비활성화, 연결 삭제, model catalog 새로고침, 도움말 진입. |

카드 상태는 단순 UI 표시가 아니라 실행 가능 여부를 결정한다. `연결됨`인 접속 방식만 모델 라우팅 기본 후보가 될 수 있고, `부분 연결`은 연결된 provider의 모델만 후보로 표시한다.

### 6.4 OpenRouter API Key

| 항목 | 요구사항 |
| --- | --- |
| 저장 | API key 원문 입력은 생성/교체 시 한 번만 받는다. 저장 후에는 복호화 원문을 UI에 다시 표시하지 않는다. |
| 표시 | `sk-or-v1-********************55a1` 같은 prefix/suffix 마스킹과 fingerprint를 표시한다. |
| 검증 | 저장 시 provider metadata 조회 또는 최소 chat/model list 요청으로 key 유효성을 확인한다. |
| 사용량 | OpenRouter API에서 받아온 사용량이 있으면 반영하고, 없으면 내부 추정 비용을 표시한다. |
| 모델 카탈로그 | text, reasoning, code, image capability별 모델 목록을 동기화한다. |
| 실패 처리 | 401/403, quota 초과, rate limit, provider 장애, 네트워크 실패를 구분해 표시한다. |
| 영향 범위 | key 교체/삭제 전 이 key를 쓰는 agent, schedule, active run, model route를 표시한다. |

### 6.5 Local Codex OAuth

| 항목 | 요구사항 |
| --- | --- |
| 계정 표시 | OAuth 계정 이메일 또는 로컬 계정 식별자를 표시한다. 첨부 화면 예시는 `minho@codex.local`. |
| 재인증 | 세션 만료, refresh 실패, scope 부족 상태에서 `다시 인증`을 노출한다. |
| 모델 후보 | `codex-short-latest`, `codex-reasoning`, `codex-code-latest`, `codex-mini`, `codex-vision` 등 app-server가 제공하는 모델을 표시한다. |
| 로컬 상태 | app-server reachable 여부, localhost endpoint, 최근 heartbeat를 확인한다. |
| scope | OAuth scope와 Dev Mode token scope를 혼동하지 않게 별도 표시한다. |
| 실패 처리 | 로컬 서버 꺼짐, OAuth 만료, 계정 불일치, 모델 catalog 실패를 구분한다. |

Local Codex OAuth는 원격 provider key와 다르게 로컬 app-server 상태에 의존한다. 앱은 연결됨 상태라도 로컬 endpoint가 내려가면 해당 모델 route를 임시 비활성으로 취급한다.

### 6.6 Direct Provider Key

| 항목 | 요구사항 |
| --- | --- |
| provider 목록 | OpenAI, Anthropic, Gemini, Kimi, 기타 direct provider를 카드 또는 테이블로 표시한다. |
| 부분 연결 | 전체 provider 중 연결된 provider 수를 `2/4 제공자`처럼 표시한다. |
| key 관리 | provider별 key 추가, 교체, 폐기, 검증, 마지막 사용 시간 확인을 지원한다. |
| 모델 후보 | 연결된 provider의 모델만 Direct Provider 열의 드롭다운에 표시한다. |
| capability 검증 | text, reasoning, code, image, embedding 등 필요한 capability가 있는지 확인한다. |
| 비용 단가 | provider별 단가 또는 내부 cost catalog와 연결한다. |
| provider fallback | 선택 provider 장애 시 같은 작업 유형 안에서 fallback 가능한 route를 표시한다. |

Direct Provider Key는 OpenRouter를 거치지 않는 직접 호출 경로다. 일부 provider만 연결되어도 화면은 사용할 수 있어야 하며, 연결되지 않은 provider의 모델은 비활성 옵션으로 표시하되 저장은 막는다.

### 6.7 모델 선택 / 모델 라우팅

모델 선택 표는 작업 유형별로 세 접속 방식의 후보 모델과 기본 접속 방식을 지정하는 매트릭스다.

| 작업 유형 | 설명 | OpenRouter 예시 | Local Codex 예시 | Direct Provider 예시 | 기본 설정 |
| --- | --- | --- | --- | --- | --- |
| 빠른 답변 | 일반 질문, 요약, 번역 | Fast LLM 3.1 | codex-short-latest | Provider Lite 1.0 | OpenRouter |
| 깊은 추론 | 복잡한 분석, 논리 추론 | Think LLM 3.1 | codex-reasoning | Provider Pro 2.0 | 미설정 또는 사용자 선택 |
| 코딩 | 코드 생성, 디버깅, 리팩터링 | Code LLM 3.1 | codex-code-latest | Provider Code 1.5 | OpenRouter |
| 라이트 작업 | 간단한 작업, 분류 | Mini LLM 3.1 | codex-mini | Provider Mini 1.0 | 미설정 또는 사용자 선택 |
| 이미지 | 이미지 생성, 분석, 편집 | Image Gen 2.1 | codex-vision | Provider Image 1.0 | 미설정 또는 사용자 선택 |

| 동작 | 요구사항 |
| --- | --- |
| 드롭다운 | provider별 연결 상태, capability, 비용 등급, latency를 함께 보여준다. |
| 기본 별표 | 작업 유형별 기본 route를 하나만 선택한다. 별표가 없는 경우 시스템 기본 fallback을 사용한다. |
| 도움말 아이콘 | `기본 설정` 열의 `?`는 default route와 fallback 규칙을 설명한다. |
| 저장 | 변경 즉시 저장하거나 row 단위 저장한다. 저장 실패 시 이전 값으로 되돌린다. |
| override | agent 또는 topic에서 별도 모델을 지정하면 전역 route보다 우선한다. |
| fallback | 기본 route 장애, quota 초과, capability 불일치 시 fallback 순서를 정의한다. |
| 검증 | 이미지 작업에 text-only 모델을 지정하는 등 capability mismatch는 저장하지 않는다. |

라우팅 결정 순서는 `명시 요청 모델 > agent override > topic override > 작업 유형 기본 설정 > 시스템 기본 모델`이다. 비용 한도나 승인 정책에 걸리면 모델이 선택되어 있어도 run은 승인 대기 또는 차단 상태가 된다.

### 6.8 사용량 / 비용 요약

| 카드 | 표시 값 | 기능 |
| --- | --- | --- |
| 이번 달 토큰 | `12.4M / 50M`, `24%` | 토큰 한도와 현재 사용률 표시. |
| 이번 달 비용 | `$28.42 / $100`, `28%` | 월 비용 한도 대비 현재 사용 표시. |
| 실패율 | `1.2%`, 전월 대비 `0.3%` 감소 | provider/model 호출 실패율 추이 표시. |
| 평균 응답 시간 | `1.32s`, 전월 대비 `0.18s` 감소 | 모델 라우팅 품질과 latency 추이 표시. |

비용 값은 provider 청구 데이터가 있으면 우선 사용하고, 없으면 내부 추정 단가와 token usage 기반으로 계산한다. 추정값이면 tooltip에 `추정 비용`임을 표시한다.

### 6.9 우측 비용 한도 패널

| 필드 | 요구사항 |
| --- | --- |
| 월 사용 한도 | 전역 월 비용 한도. 첨부 화면 예시는 `$100.00`. |
| 사용률 막대 | 현재 비용 / 월 한도를 progress bar로 표시. 첨부 화면 예시는 `28%`. |
| 알림 임계값 | 비용 알림 기준. 첨부 화면 예시는 `$80.00 (80%)`. |
| 일 사용 한도 | 하루 최대 비용. 첨부 화면 예시는 `$5.00`. |
| 현재 사용 | 이번 달 누적 비용. 첨부 화면 예시는 `$28.42`. |
| 편집 | 비용 탭 또는 인라인 편집 모드로 전환. |

한도 정책은 실행 전 예상 비용과 실행 중 누적 비용 모두에 적용한다. 예상 비용이 한도를 넘을 가능성이 높으면 실행 전 승인 카드를 띄우고, 실행 중 한도에 도달하면 run을 `waiting_approval` 또는 `failed_cost_limit`로 전환한다.

### 6.10 승인 정책 패널

| 조건 | 첨부 화면 상태 | 요구사항 |
| --- | --- | --- |
| 고위험 작업 | 승인 필요 | 외부 쓰기, 파일 삭제, 결제, 계정 변경, 대량 발송 등 위험 action은 승인 요청 생성. |
| 비용 임계 초과 | 승인 필요 | 예상 또는 누적 비용이 임계값을 넘으면 실행 전/중 승인 필요. |
| 데이터 내보내기 | 승인 필요 | 파일, 기억, 대화, 주제 데이터를 외부로 전송할 때 승인 필요. |
| 모델 변경 (고비용) | 알림만 | 고비용 모델로 route가 바뀌면 알림만 생성하고 실행은 허용. 정책 변경 가능. |

정책 값은 `자동 허용`, `알림만`, `승인 필요`, `차단` 네 단계로 관리한다. 정책이 완화되는 변경은 추가 확인을 요구하고 audit log에 남긴다.

### 6.11 보안 체크리스트

| 항목 | 첨부 화면 상태 | 요구사항 |
| --- | --- | --- |
| 2단계 인증 | 활성 | 계정 로그인 보호 상태를 표시하고 보안 탭으로 이동. |
| HTTPS 전용 | 활성 | 원격 API 호출이 HTTPS만 허용되는지 표시. localhost 예외는 개발자 탭 정책으로 분리. |
| API 키 순환 | 정상 | key rotation 권장 주기와 마지막 교체일을 표시. |
| 접근 로그 기록 | 활성 | credential, token, OAuth, Dev Mode 접근 로그가 기록 중인지 표시. |
| 비정상 활동 알림 | 활성 | 이상 사용량, 낯선 endpoint, scope 실패, repeated auth failure 알림 상태 표시. |

체크리스트는 단순 체크 표시가 아니라 클릭 가능한 진단 항목이다. 항목이 비활성이거나 경고 상태면 원인과 해결 CTA를 제공한다.

### 6.12 Dev Mode 섹션

Dev Mode는 외부 개발 도구와 로컬 자동화가 개인 Agent 플랫폼에 접근하기 위한 통제면이다. 일반 provider credential과 별개로 자체 API token, 접근 방식, endpoint, scope, audit log를 함께 관리한다.

#### 자체 API token

| 필드 | 요구사항 |
| --- | --- |
| token 이름 | 사람이 구분 가능한 이름. 첨부 화면 예시는 `hub_dev_token_01`. |
| 상태 | 활성, 만료 예정, 만료, 폐기됨, scope 오류, 최근 미사용. |
| 원문 표시 | 생성 직후 한 번만 표시하고 이후에는 fingerprint만 표시. |
| 생성일 | token 생성 날짜. 첨부 화면 예시는 `2024.05.10`. |
| 최근 사용 | 마지막 요청 시각. 첨부 화면 예시는 `2분 전`. |
| 생성 액션 | `+ 새 토큰 만들기`로 이름, 만료일, scope, 접근 방식을 입력. |
| 폐기 액션 | token 폐기 전 영향받는 TUI/MCP/client를 표시하고 즉시 무효화. |

#### 접근 방식

| 접근 방식 | 첨부 화면 상태 | 요구사항 |
| --- | --- | --- |
| TUI 접근 | 켜짐 | 터미널 UI에서 읽기/쓰기 요청 가능. token scope와 사용자 세션 정책을 따른다. |
| MCP 접근 | 켜짐 | MCP 서버가 tools/resources를 노출할 수 있게 한다. 서버별 허용 capability를 scope로 제한한다. |
| HTTP API | 켜짐 | REST/local endpoint 호출 허용. path별 scope 검사를 적용한다. |

접근 방식을 끄면 해당 방식의 새 요청은 거부한다. 이미 실행 중인 요청은 read-only면 완료 허용, write이면 정책에 따라 중지 또는 승인 대기로 전환한다.

#### 로컬 엔드포인트

| 필드 | 요구사항 |
| --- | --- |
| endpoint | 첨부 화면 예시는 `http://localhost:8787`. |
| 복사 버튼 | endpoint를 clipboard에 복사하고 audit log에는 `endpoint_copied` 이벤트만 남긴다. |
| health | 로컬 endpoint reachable 여부, 마지막 heartbeat, 버전 표시. |
| 보안 | localhost HTTP는 Dev Mode에서만 허용한다. 외부 네트워크 바인딩은 기본 차단한다. |

#### scope

| scope | 의미 | 기본 정책 |
| --- | --- | --- |
| read | workspace, topic, memory, file metadata 조회 | 낮은 위험. 기본 허용 가능. |
| write | topic, task, memory, file metadata 변경 | 승인 정책과 audit log 필수. |
| agents | agent 목록, 설정, 테스트 실행 접근 | agent별 권한 rule 적용. |
| files | 파일 조회, 첨부, 업로드, 삭제 | 삭제/외부 전송은 승인 필요. |
| memory | 기억 조회/추가/수정 | 민감 데이터 포함 가능. scope 세분화 필요. |
| mcp | MCP tool/resource 호출 | MCP server별 capability 제한 필요. |
| runs | 맡긴 일 실행 생성/제어/조회 | 비용 한도와 승인 정책 적용. |

첨부 화면은 `read`, `write`, `agents`, `files`, `memory`, `+2` 배지를 보여준다. 초과 scope는 hover 또는 상세 모달에서 모두 표시한다.

#### 감사 로그

| 로그 예시 | 요구사항 |
| --- | --- |
| `TUI 로그인` | token 인증 성공/실패, client 이름, IP 또는 local process, 시각 기록. |
| `API 호출: /v1/chat/completions` | path, method, scope, status, latency, token fingerprint 기록. |
| `MCP 세션 시작` | MCP client, server, negotiated capability, scope 기록. |
| `토큰 생성: hub_dev_token_02` | actor, token name, scope, 만료일 기록. |
| `토큰 삭제: hub_old_token` | actor, token fingerprint, 영향 범위, 삭제 시각 기록. |

감사 로그는 기본 최근 5개를 보여주고 `모두 보기`로 전체 필터 화면을 연다. 민감 payload 원문은 저장하지 않고 request id와 요약만 남긴다.

### 6.13 도움말 카드

| 요소 | 기능 |
| --- | --- |
| 제목 `도움이 필요하신가요?` | 모델 설정과 개발자 기능 도움말 진입점. |
| 설명 | `모델 설정과 개발자 기능에 대해 더 알아보세요.` |
| `가이드 보기` | 도움말 화면의 `모델/비용` 또는 `Dev Mode` 가이드로 이동. |
| 외부 링크 아이콘 | 새 도움말 패널 또는 문서 route 이동을 표시. |

## 7. OpenRouter API Key

OpenRouter는 여러 모델 provider를 단일 API key로 호출하는 통합 route다. 설정 화면에서는 "연결되었는가"뿐 아니라 "어떤 작업 유형의 기본 route로 쓰이는가", "비용이 어디까지 누적되었는가", "key가 안전하게 관리되는가"를 함께 보여줘야 한다.

| 구분 | 상세 요구사항 |
| --- | --- |
| 생성 | key 입력, 표시 이름, 비용 한도, 허용 capability, 기본 라우팅 선택을 받는다. |
| 교체 | 새 key 검증 성공 전까지 기존 key를 유지한다. 검증 성공 후 원자적으로 교체한다. |
| 폐기 | 폐기 전 영향받는 route, agent, schedule, active run을 보여준다. |
| 마스킹 | prefix와 suffix만 표시하고 중간은 숨긴다. 복사 기능은 제공하지 않는다. |
| 검증 주기 | 저장 시, 수동 확인, 주기적 background health check를 지원한다. |
| 권한 | key 관리 권한이 없는 사용자는 상태와 fingerprint만 볼 수 있다. |
| 로그 | 생성, 교체, 폐기, 검증 실패, 비용 한도 도달, route 변경을 audit log에 기록한다. |

## 8. Local Codex OAuth

Local Codex OAuth는 로컬 Codex app-server 또는 로컬 모델 실행 경로와 연결되는 인증 방식이다. 사용자 입장에서는 `다시 인증`으로 관리하지만, 제품 내부에서는 OAuth 계정 상태, 로컬 endpoint health, 사용 가능 모델 catalog를 함께 관리한다.

| 구분 | 상세 요구사항 |
| --- | --- |
| 계정 | 현재 OAuth 계정과 연결된 workspace/hub를 표시한다. |
| 인증 | 만료, refresh 실패, scope 부족, 계정 변경을 감지한다. |
| 재인증 | 사용자를 인증 플로우로 보내고 완료 후 catalog를 재동기화한다. |
| 로컬 의존성 | app-server offline이면 OAuth는 유효해도 route는 일시 사용 불가로 표시한다. |
| 모델 | short, reasoning, code, mini, vision 등 용도별 Codex 모델을 노출한다. |
| 보안 | OAuth token 원문은 표시하지 않고, scope와 만료/갱신 상태만 제공한다. |

## 9. Direct Provider Key

Direct Provider Key는 OpenRouter를 우회해 provider API를 직접 호출하는 경로다. 사용자는 비용, 장애, 모델 제공 범위, 데이터 처리 정책 때문에 provider별 직접 연결을 선택할 수 있다.

| 구분 | 상세 요구사항 |
| --- | --- |
| provider별 상태 | 연결됨, 미설정, 검증 실패, quota 초과, 권한 부족, 비활성. |
| key 입력 | provider별 key format validation과 최소 API validation을 수행한다. |
| 모델 동기화 | provider별 model list 또는 내부 catalog와 매핑한다. |
| 비용 | provider 단가, 월 사용량, 일 사용량, 한도 초과 여부를 표시한다. |
| fallback | provider 장애 시 OpenRouter 또는 Local Codex로 fallback 가능한지 표시한다. |
| 데이터 정책 | provider별 데이터 저장/학습 opt-out 여부 같은 보안 힌트를 표시할 수 있다. |

## 10. 모델 라우팅

모델 라우팅은 플랫폼 전체의 기본 실행 경로다. 채팅이나 에이전트가 별도 모델을 지정하지 않으면 이 표의 기본 설정을 따른다.

### 10.1 라우팅 우선순위

1. 사용자가 특정 요청에서 명시한 모델
2. agent 또는 workflow node에 저장된 모델 override
3. topic 또는 workspace별 모델 override
4. 설정 화면의 작업 유형별 기본 route
5. 시스템 기본 route

### 10.2 fallback 규칙

| 상황 | 처리 |
| --- | --- |
| 기본 provider key 만료 | 같은 작업 유형의 다른 연결됨 provider를 fallback 후보로 표시하고, 자동 fallback 가능 여부는 승인 정책을 따른다. |
| 비용 한도 초과 | fallback이 더 저렴하면 사용자 정책에 따라 자동 전환 또는 승인 요청. |
| capability 불일치 | fallback하지 않고 실행 전 차단. 예: 이미지 생성 작업에 text-only 모델. |
| provider rate limit | retry 후 fallback. 반복 실패는 run 로그와 설정 알림에 표시. |
| Local Codex offline | 온라인 provider fallback 또는 사용자 알림. 민감 작업이면 자동 외부 fallback 금지 가능. |

### 10.3 라우팅 저장 검증

| 검증 항목 | 실패 시 처리 |
| --- | --- |
| provider 연결 상태 | 연결 플로우로 안내하고 저장 차단. |
| 모델 capability | 해당 작업 유형과 맞지 않으면 저장 차단. |
| 비용 정책 | 고비용 모델이면 승인 정책에 따라 알림 또는 승인 요구. |
| agent 영향 | 영향을 받는 agent/schedule 수를 표시. 사용자가 확인하면 저장. |
| model catalog stale | catalog 새로고침 후 다시 선택하게 한다. |

## 11. 사용량 / 비용

### 11.1 표시 지표

| 지표 | 정의 | 데이터 기준 |
| --- | --- | --- |
| 이번 달 토큰 | 모든 provider/model 호출의 input/output token 합계 | `usage_event` 또는 provider usage API |
| 이번 달 비용 | provider 청구 비용 또는 내부 추정 비용 | `cost_event`, provider billing, pricing catalog |
| 실패율 | 모델 호출 실패 수 / 전체 호출 수 | `model_invocation_log` |
| 평균 응답 시간 | 성공 호출의 평균 latency | `model_invocation_log.latencyMs` |
| provider별 비용 | OpenRouter, Local Codex, Direct Provider별 비용 | provider grouping |
| 작업 유형별 비용 | 빠른 답변, 깊은 추론, 코딩, 라이트, 이미지별 비용 | route type grouping |

### 11.2 비용 차단 조건

| 조건 | 기본 처리 |
| --- | --- |
| 월 한도 80% 도달 | 알림 생성. 실행은 계속. |
| 월 한도 100% 도달 | 새 run 차단 또는 승인 대기. 진행 중 run은 정책에 따라 중지/승인 대기. |
| 일 한도 100% 도달 | 당일 새 요청 차단 또는 승인 대기. |
| 단일 run 예상 비용 초과 | 실행 전 승인 요청. |
| 고비용 모델 자동 전환 | 승인 정책이 `알림만`이면 알림, `승인 필요`이면 대기. |

### 11.3 비용 표시 원칙

- provider 실제 청구 비용이 있으면 실제 비용을 우선 표시한다.
- provider 비용 API가 없으면 token usage와 pricing catalog로 추정한다.
- 추정 비용은 tooltip 또는 badge로 표시한다.
- Local Codex처럼 직접 청구 비용이 없을 수 있는 경로도 compute/time cost나 내부 quota를 별도 지표로 남길 수 있다.
- 비용 데이터는 run, agent, topic, provider, route type 기준으로 drill-down 가능해야 한다.

## 12. 승인 정책

승인 정책은 자동화와 안전 사이의 경계다. 설정 화면의 전역 정책은 모든 agent, schedule, Dev Mode API 요청, 채팅 tool call에 적용된다.

| 정책 대상 | 트리거 예시 | 정책 값 |
| --- | --- | --- |
| 고위험 작업 | 외부 쓰기, 파일 삭제, 결제, 계정 변경, 대량 발송 | 자동 허용, 알림만, 승인 필요, 차단 |
| 비용 임계 초과 | 월/일 한도 초과, 단일 run 예상 비용 초과 | 알림만, 승인 필요, 차단 |
| 데이터 내보내기 | 파일/기억/대화/주제 데이터를 외부 API로 전송 | 승인 필요, 차단 |
| 고비용 모델 변경 | 저비용 route에서 고비용 route로 자동 전환 | 알림만, 승인 필요 |
| Dev Mode write | TUI/MCP/HTTP API를 통한 write scope 호출 | 승인 필요, 차단 가능 |

승인 요청에는 요청자, 실행 주체, 대상 데이터, 예상 비용, 권한 scope, 변경 요약, 만료 시간, 승인/거절 결과가 포함되어야 한다. 승인/거절은 `approval_request`와 `audit_log`에 모두 남긴다.

## 13. 보안 체크리스트

| 체크 항목 | 수용 상태 | 상세 |
| --- | --- | --- |
| 2단계 인증 | 활성/비활성/설정 필요 | 계정 탈취 방지. 비활성이면 보안 탭에서 설정 CTA. |
| HTTPS 전용 | 활성/경고 | 외부 API는 HTTPS만 허용. localhost HTTP는 Dev Mode 예외. |
| API 키 순환 | 정상/권장/만료 | key rotation 주기, 마지막 교체일, 오래된 key 경고. |
| 접근 로그 기록 | 활성/비활성 | credential, token, OAuth, run control 로그 수집 여부. |
| 비정상 활동 알림 | 활성/비활성 | 낯선 client, 과도한 요청, 실패 반복, scope 거부 알림. |
| 토큰 원문 보호 | 정상/경고 | API key와 Dev token 원문 재표시 금지. |
| 권한별 read/write 분리 | 정상/경고 | read-only와 write scope가 분리되어 있는지 점검. |
| 외부 전송 승인 | 정상/경고 | 데이터 내보내기와 외부 쓰기에 승인 정책이 연결되어 있는지 점검. |

보안 체크리스트는 녹색 상태만 보여주는 장식이 아니다. 경고 상태가 하나라도 있으면 설정 화면 상단 또는 보안 탭에 요약 경고를 표시한다.

## 14. Dev Mode 상세 요구사항

### 14.1 자체 API token 생명주기

| 상태 | 설명 | 사용자 액션 |
| --- | --- | --- |
| 활성 | 사용 가능하고 최근 검증 성공 | scope 수정, 만료일 연장, 폐기 |
| 만료 예정 | 만료일이 임박 | 재발급, 만료일 연장 |
| 만료 | 인증 불가 | 삭제, 새 token 생성 |
| 폐기됨 | 사용자가 폐기 | 로그 조회만 가능 |
| 의심 활동 | 이상 사용 감지 | 즉시 폐기, audit log 확인 |

token 생성 플로우는 이름, 만료일, 접근 방식, scope, 허용 origin/client, 설명을 받는다. 생성 완료 화면에서 원문 token은 한 번만 보여주고, 사용자가 닫으면 다시 볼 수 없다.

### 14.2 TUI / MCP / local endpoint

| 항목 | 요구사항 |
| --- | --- |
| TUI | 사용자가 로컬 터미널에서 workspace와 agent를 조작할 수 있게 한다. write 작업은 scope와 승인 정책을 따른다. |
| MCP | MCP client가 tools/resources를 호출할 수 있게 한다. server별 capability와 scope를 제한한다. |
| local endpoint | 기본 `http://localhost:8787` 같은 로컬 REST endpoint를 표시하고 health를 확인한다. |
| 외부 바인딩 | 기본 차단. 외부 네트워크 접근을 허용하려면 별도 위험 경고와 승인 필요. |
| CORS/origin | HTTP API 접근 origin을 제한한다. wildcard는 경고 상태로 표시한다. |
| rate limit | token별 요청 제한과 burst 제한을 둔다. |

### 14.3 scope 설계

scope는 coarse scope와 resource scope를 함께 지원해야 한다.

| scope 유형 | 예시 | 설명 |
| --- | --- | --- |
| coarse | `read`, `write`, `agents`, `files`, `memory`, `runs`, `mcp` | 빠른 설정에 쓰는 상위 권한. |
| resource | `topic:read`, `file:write`, `memory:append`, `agent:test`, `run:control` | 민감 작업을 세분화하는 권한. |
| boundary | `workspace:{id}`, `topic:{id}`, `agent:{id}` | 특정 허브/주제/에이전트로 권한 범위를 제한. |

MVP에서는 첨부 화면처럼 배지로 coarse scope를 표시하고, 상세 모달에서 resource scope를 확인/편집한다.

### 14.4 audit log

| 필드 | 설명 |
| --- | --- |
| eventId | 감사 로그 고유 ID |
| occurredAt | 발생 시각 |
| actorId | 사용자 또는 system actor |
| tokenFingerprint | token 원문이 아닌 fingerprint |
| accessMethod | TUI, MCP, HTTP API, OAuth, Web UI |
| action | login, token_created, token_revoked, api_call, mcp_session_started 등 |
| resourceType | agent, topic, memory, file, run, credential 등 |
| resourceId | 대상 리소스 ID |
| scopeUsed | 요청에 사용된 scope |
| result | success, denied, failed, expired |
| latencyMs | 요청 처리 시간 |
| requestId | 추적용 request id |

감사 로그는 검색, 기간 필터, token 필터, access method 필터, 결과 필터를 지원한다. 민감 입력/출력 payload는 저장하지 않는다.

## 15. Edge Case

| 상황 | 기대 처리 |
| --- | --- |
| OpenRouter key 검증 실패 | 기존 key 유지, 새 key 저장 안 함, 실패 원인과 request id 표시. |
| key 저장은 성공했지만 model catalog 동기화 실패 | credential은 연결됨으로 두되 모델 표에는 이전 catalog를 유지하고 경고 표시. |
| OAuth는 유효하지만 Local Codex app-server offline | 카드에 `로컬 서버 연결 안 됨` 표시, Local Codex route 임시 제외. |
| Direct Provider 일부만 연결 | 카드 상태 `부분 연결`, 연결된 provider 모델만 선택 가능. |
| 모델 라우팅 변경 중 다른 agent가 같은 값을 수정 | optimistic locking으로 충돌 감지, 최신 값 비교 후 다시 저장 요구. |
| 현재 사용량보다 낮은 월 한도로 변경 | 즉시 차단될 run/schedule을 보여주고 명시 확인 전 저장 차단. |
| 고비용 모델을 기본값으로 설정 | 승인 정책에 따라 알림 또는 추가 확인. 비용 한도 예상 영향 표시. |
| 이미지 작업에 text-only 모델 선택 | capability mismatch로 저장 차단. |
| 모든 provider가 비활성 | 채팅/agent 실행 불가 상태를 상단에 표시하고 연결 설정 CTA 제공. |
| Dev token 원문을 닫기 전에 복사하지 않음 | 재표시 불가. 새 token 생성 안내. |
| token 폐기와 동시에 요청 처리 중 | 새 요청은 거부. 진행 중 write 요청은 중단 또는 승인 대기로 전환. |
| scope 부족으로 MCP tool 호출 실패 | 호출 실패 로그에 필요한 scope와 현재 scope를 표시. |
| audit log 저장 실패 | 민감 작업은 fail-closed. 읽기 요청은 경고와 함께 제한적으로 허용 가능. |
| 비용 API 지연 | 내부 추정 비용으로 표시하고 데이터 freshness를 표시. |
| 시간대 변경으로 일 한도 집계 경계가 바뀜 | 새 시간대 기준 적용 시점을 명시하고 기존 집계는 보존. |
| 허브 전환 중 credential 범위 변경 | 현재 허브에서 접근 가능한 credential만 표시하고 이전 허브의 선택 상태 해제. |
| 권한 없는 사용자가 설정 진입 | 읽기 가능한 상태만 표시하고 편집 액션 비활성화. |
| 브라우저 새로고침 중 저장 요청 중복 | idempotency key로 중복 저장 방지. |
| `편집` 후 저장하지 않고 탭 이동 | 변경 감지 후 저장/폐기/취소 확인. |

## 16. 데이터 필드 / API 힌트

### 16.1 주요 객체

| 객체 | 필드 힌트 |
| --- | --- |
| `settings_profile` | `userId`, `hubId`, `displayName`, `avatarUrl`, `language`, `timezone`, `defaultHubId`, `notificationPreference` |
| `model_connection` | `connectionId`, `hubId`, `type`, `displayName`, `status`, `statusReason`, `lastCheckedAt`, `lastUsedAt`, `capabilities`, `managedBy` |
| `credential` | `credentialId`, `connectionId`, `credentialType`, `maskedValue`, `fingerprint`, `status`, `createdAt`, `rotatedAt`, `expiresAt`, `lastValidatedAt` |
| `oauth_connection` | `oauthId`, `connectionId`, `accountLabel`, `scopes`, `expiresAt`, `refreshStatus`, `lastAuthenticatedAt` |
| `model_catalog_item` | `modelId`, `provider`, `connectionType`, `displayName`, `capabilities`, `contextWindow`, `pricing`, `latencyClass`, `isAvailable` |
| `model_route` | `routeId`, `hubId`, `taskType`, `openRouterModelId`, `localCodexModelId`, `directProviderModelId`, `defaultConnectionType`, `fallbackPolicy`, `updatedAt` |
| `usage_summary` | `hubId`, `period`, `tokenUsed`, `tokenLimit`, `costUsed`, `costLimit`, `failureRate`, `avgLatencyMs`, `providerBreakdown` |
| `cost_policy` | `hubId`, `monthlyLimit`, `dailyLimit`, `alertThresholdPercent`, `blockMode`, `currency`, `updatedAt` |
| `approval_policy` | `hubId`, `riskType`, `policyMode`, `threshold`, `appliesTo`, `updatedAt` |
| `security_check` | `hubId`, `checkType`, `status`, `severity`, `lastCheckedAt`, `actionUrl` |
| `dev_token` | `tokenId`, `hubId`, `name`, `fingerprint`, `status`, `scopes`, `accessMethods`, `createdAt`, `expiresAt`, `lastUsedAt` |
| `local_endpoint` | `hubId`, `url`, `status`, `version`, `lastHeartbeatAt`, `bindAddress`, `allowedOrigins` |
| `audit_log` | `eventId`, `hubId`, `actorId`, `action`, `resourceType`, `resourceId`, `accessMethod`, `scopeUsed`, `result`, `requestId`, `occurredAt` |

### 16.2 API 예시

| API | 용도 |
| --- | --- |
| `GET /api/settings?hubId={hubId}` | 설정 화면 초기 데이터 조회. |
| `GET /api/settings/model-connections` | 모델 접속 방식 카드 데이터 조회. |
| `POST /api/settings/model-connections/{connectionId}/validate` | credential 또는 OAuth 연결 검증. |
| `PUT /api/settings/credentials/{credentialId}` | API key 교체. 원문은 요청 body로만 전달하고 응답에는 포함하지 않는다. |
| `DELETE /api/settings/credentials/{credentialId}` | credential 폐기. 영향 분석 선행 필요. |
| `POST /api/settings/local-codex/reauth` | Local Codex OAuth 재인증 시작. |
| `GET /api/settings/model-routes` | 작업 유형별 모델 라우팅 조회. |
| `PUT /api/settings/model-routes/{routeId}` | 모델 라우팅 변경. capability/cost 검증 포함. |
| `GET /api/settings/usage-summary?period=month` | 토큰, 비용, 실패율, 평균 응답 시간 조회. |
| `PUT /api/settings/cost-policy` | 비용 한도와 알림 임계값 저장. |
| `PUT /api/settings/approval-policies` | 승인 정책 저장. |
| `GET /api/settings/security-checks` | 보안 체크리스트 조회. |
| `POST /api/settings/dev-tokens` | 자체 API token 생성. 응답에 원문 token은 한 번만 포함. |
| `DELETE /api/settings/dev-tokens/{tokenId}` | 자체 API token 폐기. |
| `PUT /api/settings/dev-access` | TUI/MCP/HTTP API 접근 방식 토글 저장. |
| `GET /api/settings/audit-logs` | 감사 로그 조회. |

### 16.3 프론트 상태 힌트

| 상태 | 설명 |
| --- | --- |
| `activeTab` | 현재 탭. URL query와 동기화. |
| `selectedConnectionType` | OpenRouter, Local Codex, Direct Provider 선택 상태. |
| `dirtySections` | 저장되지 않은 섹션 목록. 탭 이동/이탈 방지에 사용. |
| `modelRouteDrafts` | 모델 라우팅 표에서 변경 중인 row draft. |
| `costPolicyDraft` | 비용 한도 편집 draft. |
| `approvalPolicyDrafts` | 승인 정책 편집 draft. |
| `devTokenRevealState` | 생성 직후 token 원문 표시 상태. 새로고침/닫기 후 소멸. |
| `impactPreview` | key 폐기, 모델 변경, 비용 한도 변경 전 영향 분석 결과. |

## 17. 수용 기준

### 17.1 화면 표시

- `설정` 화면 진입 시 좌측 내비게이션에서 `설정`이 활성 표시된다.
- 상단 탭 `프로필`, `모델`, `보안`, `비용`, `개발자`가 표시되고 `모델` 탭을 직접 열 수 있다.
- `모델` 탭에는 OpenRouter API Key, Local Codex OAuth, Direct Provider Key 카드가 모두 표시된다.
- 카드에는 상태 배지, 주요 메타, 최근 확인, 관리 액션, 더보기 액션이 표시된다.
- 모델 선택 표에는 빠른 답변, 깊은 추론, 코딩, 라이트 작업, 이미지 row와 세 접속 방식별 모델 드롭다운, 기본 설정 별표가 표시된다.
- 사용 현황에는 이번 달 토큰, 이번 달 비용, 실패율, 평균 응답 시간이 표시된다.
- 우측에는 비용 한도, 승인 정책, 보안 체크리스트, 도움말 카드가 표시된다.
- Dev Mode 섹션에는 자체 API token, 접근 방식 토글, 로컬 endpoint, scope, 감사 로그가 표시된다.

### 17.2 상호작용

- API key 원문은 생성/교체 직후 한 번만 표시되고 이후에는 마스킹된다.
- OpenRouter key 교체는 검증 성공 전까지 기존 key를 유지한다.
- Local Codex `다시 인증`은 OAuth 플로우 완료 후 모델 catalog를 갱신한다.
- Direct Provider가 부분 연결 상태일 때 연결된 provider 모델만 선택 가능하다.
- capability가 맞지 않는 모델은 작업 유형 기본값으로 저장할 수 없다.
- 기본 설정 별표는 작업 유형별 하나만 선택 가능하다.
- 비용 한도 저장 전 현재 사용량과 영향받는 run/schedule을 검증한다.
- 승인 정책 완화 변경은 추가 확인을 요구한다.
- Dev token 생성 응답의 원문 token은 화면을 닫으면 다시 조회할 수 없다.
- TUI/MCP/HTTP API 접근 토글 변경은 audit log에 남는다.

### 17.3 정책/보안

- 비용 한도 초과 시 run은 정책에 따라 승인 대기 또는 차단 상태가 된다.
- 데이터 내보내기와 외부 쓰기는 기본적으로 승인 정책을 거친다.
- credential, OAuth, Dev token 변경은 모두 audit log에 기록된다.
- audit log 저장 실패 시 민감 write 작업은 성공 처리하지 않는다.
- 권한 없는 사용자는 설정 값을 볼 수 있어도 key 관리, 비용 정책, 승인 정책, Dev token 변경을 실행할 수 없다.
- localhost HTTP 접근은 Dev Mode에서만 허용하고 외부 네트워크 바인딩은 기본 차단한다.

## 18. 엣지케이스 리뷰

이 섹션은 개발 착수 전 자체 점검 기준이다. 별도 subagent 리뷰가 불가능한 경우에도 이 목록을 기준으로 구현 설계와 QA 케이스를 보강한다.

| 검토 영역 | 확인 결과 |
| --- | --- |
| 값 변경 후 읽는 곳 | 모델 라우팅 변경은 채팅, 에이전트, 스케줄, 맡긴 일 run 생성이 모두 참조하므로 영향 분석 API 필요. |
| 이름 충돌 | OpenRouter `credential`, Local Codex `oauth_connection`, Dev Mode `dev_token`은 모두 token 성격이지만 생명주기와 노출 정책이 달라 객체명을 분리해야 한다. |
| BE-FE prop 이름 | `defaultConnectionType`, `accessMethods`, `scopes`, `fingerprint`, `lastCheckedAt`, `lastUsedAt`를 공통 명칭으로 맞추는 것이 필요. |
| 리스트 key | 모델 라우팅 row는 `taskType`, Dev token row는 `tokenId`, audit log row는 `eventId`를 안정 key로 사용해야 한다. |
| 보안 fail-open | audit log 실패, approval policy 조회 실패, scope 검증 실패는 write 작업에서 fail-closed가 기본이어야 한다. |
| 비용 fail-open | provider 비용 API 실패 시 내부 추정 비용으로 대체하되 한도 검증 자체를 생략하면 안 된다. |
| 로컬/원격 경계 | Localhost HTTP는 Dev Mode 예외이며 외부 바인딩 허용과 혼동되면 안 된다. |
| 부분 연결 | Direct Provider 부분 연결 상태에서 미연결 provider 모델이 기본 route로 저장되지 않게 해야 한다. |
| 데이터 이동 경계 | Local Codex에서 외부 provider로 fallback될 때 사용자의 파일/기억/대화 데이터가 외부로 나갈 수 있으므로 데이터 내보내기 승인 정책과 연결해야 한다. |
| 상태 신선도 | 비용, 사용량, security check, model catalog는 stale 상태를 표시해야 하며 오래된 값을 정상 상태처럼 보이면 안 된다. |
| 권한 상속 | 허브 공유 credential과 개인 credential이 섞이면 관리자 권한, 개인 override, agent override 우선순위를 명확히 해야 한다. |
| 테스트 로그 | provider 검증 요청과 실제 run 요청 로그를 구분해야 한다. 테스트 성공만으로 실제 권한/비용 정책 통과를 보장하면 안 된다. |

## 19. 오픈 질문

| 질문 | 후보/메모 |
| --- | --- |
| 설정 기본 탭은 `프로필`인가 `모델`인가 | 첨부 화면과 PRD 중요도 기준으로는 `모델` 우선. 일반 사용자 온보딩 기준이면 `프로필` 가능. |
| 모델 라우팅 변경 저장 방식 | 즉시 저장이 단순하지만 영향 분석이 필요한 변경은 row 단위 확인이 더 안전. |
| Local Codex OAuth와 Dev Mode token의 관계 | 둘 다 로컬 접근과 관련 있지만 OAuth는 모델 제공 경로, Dev token은 외부 client 접근 권한으로 분리 필요. |
| Direct Provider 목록의 MVP 범위 | OpenAI, Anthropic, Gemini, Kimi까지 둘지, 내부 catalog 기반으로 동적 노출할지 결정 필요. |
| 비용 한도 기준 통화 | 첨부 화면은 USD. 사용자 지역/결제 통화에 맞춰 KRW 표시를 지원할지 결정 필요. |
| Local Codex 비용 산정 | 직접 비용이 없을 때 token quota만 볼지, 로컬 compute 시간을 비용성 지표로 볼지 결정 필요. |
| 승인 정책의 기본값 | PRD 흐름상 외부 쓰기/데이터 내보내기/파일 삭제는 기본 승인 필요가 안전. |
| Dev token 기본 만료일 | 보안상 30일/90일 기본 만료를 둘지, 사용자가 무기한을 선택할 수 있을지 결정 필요. |
| audit log 보관 기간 | 무료/프로 플랜별 보관 기간과 export 가능 여부 결정 필요. |
| 보안 체크리스트 경고 노출 위치 | 설정 화면 상단 전역 경고까지 띄울지, 보안 탭 내부에만 둘지 결정 필요. |
| provider fallback 자동화 | 비용 절감 fallback은 자동 허용할지, 외부 provider로 데이터가 나가는 fallback은 승인 필요로 둘지 결정 필요. |
| 허브 공유 credential | 개인 credential과 허브 credential의 우선순위, 관리자 권한, 감사 로그 actor 표기 결정 필요. |
