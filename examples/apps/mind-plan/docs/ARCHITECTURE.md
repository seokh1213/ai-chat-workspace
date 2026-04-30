# Mind Plan Architecture

## 목표

기존 `trip-planner`의 워크스페이스, AI 채팅 세션, SSE 응답, provider 추상화 패턴을 가져오되 도메인을 여행이 아니라 범용 계획 편집으로 바꾼다.

## UX 흐름

1. 워크스페이스 선택 또는 생성
2. 계획 생성 또는 기존 계획 선택
3. 왼쪽에서 계획 메타와 작업 목록 편집
4. 가운데에서 캔버스, 칸반, 마인드맵으로 작업 구조 확인
5. 오른쪽 AI 채팅에서 자연어로 작업 추가, 완료, 제목 변경 등 반영

## 데이터 모델

- `workspaces`: 개인/팀 단위 작업 공간, AI provider 설정 보유
- `plans`: 하나의 계획 또는 프로젝트
- `task_nodes`: 캔버스와 마인드맵에 표시되는 작업 노드
- `task_links`: 노드 사이 관계
- `chat_sessions`: 한 계획 안의 여러 AI 상담 세션
- `chat_messages`: 대화 내역
- `ai_edit_runs`: AI 수정 실행 내역
- `plan_checkpoints`: AI 변경 전 롤백용 스냅샷

## AI Provider

초기 구현은 `AiProvider` 인터페이스로 분리했다.

- `local-rule`: 설치 없이 동작하는 규칙 기반 provider
- `claude-cli`: 로컬 Claude CLI 명령어 호출 provider
- `codex-app-server`: 후속으로 연결할 provider 슬롯

provider 결과는 사용자용 `message`와 적용용 `operations`로 분리한다. UI에는 message를 Markdown으로 보여주고, 서버는 operations를 DB에 적용한다.

## 1a80f46 반영 내용

원본 `trip-planner`의 `1a80f46` 커밋에서 채팅 스크롤 UX를 가져왔다.

- 채팅 로그를 `chat-log-frame` 안의 독립 스크롤 컨테이너로 분리
- 사용자가 하단 근처를 보고 있을 때만 자동 스크롤
- 중간 내용을 읽는 동안 새 응답이 오면 `최신으로` 버튼 표시
- 작업 목록, 칸반 컬럼도 패널 내부에서만 스크롤되도록 `min-height: 0`과 `overflow-y: auto` 적용
