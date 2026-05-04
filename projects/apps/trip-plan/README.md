# AI 여행 플래너

범용 AI 여행 플래너로 재구현 중인 모노레포입니다.

legacy Node prototype은 `projects/apps/trip-plan/legacy-node/`에 보관했습니다. 실제 여행 데이터는 generic app seed와 분리해 관리합니다.

## Rebuild Plan

범용 AI 여행 플래너로 재구현하기 위한 문서:

- `projects/apps/trip-plan/docs/REBUILD_ARCHITECTURE.md`: Kotlin/Spring + React 전체 아키텍처
- `projects/apps/trip-plan/docs/REBUILD_DB_SCHEMA.md`: SQLite/Flyway 목표 스키마
- `projects/apps/trip-plan/docs/REBUILD_SEED_DATA.md`: 별도 SQL 기반 초기 데이터 방침
- `projects/apps/trip-plan/docs/REBUILD_API.md`: REST/SSE API 계약
- `projects/apps/trip-plan/docs/REBUILD_AI_OPERATIONS.md`: AI 편집 operation 계약
- `projects/apps/trip-plan/docs/REBUILD_AI_PROVIDERS.md`: 로컬/외부 AI provider 추상화 계획
- `projects/apps/trip-plan/docs/REBUILD_CODEX_APPSERVER.md`: Codex app-server 연동 계획
- `projects/apps/trip-plan/docs/REBUILD_FRONTEND.md`: React/Tailwind 프론트엔드 계획
- `projects/apps/trip-plan/docs/REBUILD_MIGRATION_PLAN.md`: 단계별 마이그레이션 계획

앱 구조:

- `projects/apps/trip-plan/backend/`: Kotlin/Spring Boot API
- `projects/apps/trip-plan/frontend/`: React/Tailwind UI
- `projects/apps/trip-plan/docs/`: 재구현 문서
- `projects/apps/trip-plan/legacy-node/`: 현재 Node prototype 보관

목표 스택:

- Kotlin 2.3.20
- Spring Boot 4.0.5
- JDK 21
- SQLite + Flyway
- React 19 + Vite + Tailwind CSS 4
- AI provider는 Kotlin coroutine `Flow` 기반 스트리밍 추상화로 설계
- 세션 UI는 단일 `AI`만 노출하고, 기본 AI 경로는 Codex app-server를 직접 호출함

초기 데이터 방침:

- schema migration과 seed data를 분리
- 초기 데이터는 별도 SQL 파일로만 작성
- 실제 오키나와 여행 데이터는 코드 저장소 seed에 포함하지 않음

## Legacy Node Prototype

아래 내용은 현재 legacy prototype 실행 방법입니다.

```bash
cd projects/apps/trip-plan/legacy-node
npm start
```

기본 주소는 `http://localhost:4173`입니다.

서버는 시작 시 `projects/apps/trip-plan/legacy-node/db/schema.sql`을 적용하고 앱의 `.data/` 아래 SQLite 파일을 생성합니다. legacy prototype의 입력 데이터 파일은 로컬 전용 자료이며 git 관리 대상에서 제외합니다.

주요 API:

- `GET /api/state`: 현재 일정과 조사 장소를 반환합니다.
- `POST /api/operations`: 일정 수정 operations를 검증 후 적용하고 checkpoint를 만듭니다.
- `GET /api/checkpoints`: 최근 checkpoint 목록을 반환합니다.
- `POST /api/checkpoints/:id/rollback`: 해당 checkpoint 적용 전 상태로 되돌립니다.

AI 편집 구조와 operation 스키마는 `projects/apps/trip-plan/docs/AI_EDITING.md`에 정리되어 있습니다.
화면에서는 AI 상담 헤더의 되돌리기 버튼으로 최근 checkpoint를 되돌릴 수 있습니다.

`OPENAI_API_KEY`가 있으면 `/api/chat`이 OpenAI Responses API를 호출합니다.

```bash
cd projects/apps/trip-plan/legacy-node
OPENAI_API_KEY=... npm start
```

로컬 Codex CLI 로그인 상태를 쓰려면 `AI_PROVIDER=codex`로 실행합니다. 이 방식은 서버가 `codex exec`를 호출하므로 브라우저에 `~/.codex/auth.json` 내용이 노출되지 않습니다.

```bash
cd projects/apps/trip-plan/legacy-node
AI_PROVIDER=codex npm start
```

선택 옵션:

- `CODEX_SESSION_ID=...`: 특정 Codex 세션을 계속 재개합니다.
- `CODEX_RESUME_LAST=1`: 최근 Codex 세션을 재개합니다. 다른 Codex 작업과 섞일 수 있어 테스트용으로만 권장합니다.
- `CODEX_MODEL=gpt-5.4-mini`: Codex CLI 호출 모델을 지정합니다. 기본값은 `gpt-5.4-mini`입니다.
- `CODEX_REASONING_EFFORT=medium`: Codex CLI reasoning effort를 지정합니다. 기본값은 `medium`입니다.
- `CODEX_TIMEOUT_MS=120000`: Codex CLI 응답 제한 시간을 지정합니다.

현재 구현은 `codex exec` 기반의 얇은 브리지입니다. 새 세션 시작에는 `--sandbox read-only`를 적용합니다. 현재 설치된 `codex exec resume` 명령은 별도 `--sandbox` 옵션을 노출하지 않아 재개 시에는 해당 Codex 세션/설정의 정책을 따릅니다. OpenClaw처럼 장기 실행 `codex app-server` JSON-RPC를 붙이면 스트리밍, thread picker, compaction, stop 같은 제어를 더 정교하게 구현할 수 있습니다.

## Backend Scaffold

Spring Boot backend는 `projects/apps/trip-plan/backend` project입니다.

기본 SQLite 파일은 앱의 `.data/` 아래 backend용 파일로 생성됩니다.

```bash
cd projects/apps/trip-plan
./gradlew :backend:test
./gradlew :backend:bootRun --args='--spring.profiles.active=dev'
```

개발 기본 포트는 `8081`입니다. Frontend Vite proxy도 같은 포트를 사용합니다.

`dev` profile에서는 Spring이 loopback Codex app-server를 자동으로 준비합니다. 이미 떠 있는 app-server가 있으면 그 프로세스를 그대로 사용하고 중복 실행하지 않습니다.

```bash
codex app-server --listen ws://127.0.0.1:8765
```

위 명령은 수동으로 app-server를 먼저 확인하고 싶을 때만 사용합니다.

Backend 기본 설정:

- `CODEX_APP_SERVER_URL=ws://127.0.0.1:8765`
- `CODEX_APP_SERVER_MODEL=gpt-5.4-mini`
- `CODEX_APP_SERVER_EFFORT=medium`
- `CODEX_APP_SERVER_CWD=/tmp`
- `CODEX_APP_SERVER_MANAGED=true` (`dev` profile)
- `CODEX_APP_SERVER_EXECUTABLE=codex`
- `CODEX_APP_SERVER_STARTUP_TIMEOUT_SECONDS=8`
- `CODEX_APP_SERVER_RESTART_ON_EXIT=true` (`dev` profile)
- `CODEX_APP_SERVER_RESTART_DELAY_SECONDS=2`
- `EXTERNAL_AI_ENABLED=false`
- `EXTERNAL_AI_URL=`
- `EXTERNAL_AI_MODE=rest`

`CODEX_APP_SERVER_CWD`는 Codex가 파일 작업을 하지 않는 여행 편집 용도라 `/tmp`로 둡니다. 현재 프로젝트 경로처럼 비 ASCII 문자가 섞인 경로는 일부 Codex turn metadata 헤더에서 문제가 날 수 있어 ASCII 경로를 기본값으로 둡니다.

Spring이 app-server를 같이 띄우는 것은 process lifecycle 관리입니다. 여행별 채팅 세션은 우리 DB의 `chat_sessions`와 Codex thread id 매핑으로 별도 관리하므로, Spring이 미리 띄우는 app-server 프로세스 하나를 여러 채팅 세션이 안전하게 공유합니다.

프론트의 새 대화 영역은 provider 종류를 노출하지 않습니다. 새 대화는 단일 `AI` 경로로 생성되고, 백엔드는 Codex app-server를 호출합니다. AI 호출 실패 시 deterministic local 답변으로 위장하지 않고 실패 상태를 기록합니다. provider 선택 정책은 추후 워크스페이스 설정으로 이동할 수 있게 분리되어 있습니다.

채팅 응답은 `/api/chat-sessions/{sessionId}/events` SSE로 `assistant.message.delta`를 받아 화면에 즉시 표시합니다. 중지 버튼은 브라우저 요청을 abort하고 `/api/chat-sessions/{sessionId}/runs/current/cancel`로 현재 run을 취소 표시해 늦게 도착한 AI operation이 적용되지 않게 합니다. Codex app-server provider는 가능한 경우 같은 취소 요청에서 `turn/interrupt`도 전송합니다.

## Frontend Scaffold

React frontend는 `projects/apps/trip-plan/frontend` project입니다. 개발 서버는 backend 8081로 `/api`, `/actuator` 요청을 proxy합니다.

```bash
cd projects/apps/trip-plan/frontend
npm install
npm run build
npm run dev
```
