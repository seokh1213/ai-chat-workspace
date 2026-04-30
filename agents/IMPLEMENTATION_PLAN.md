# Agent Implementation Plan

다음 AI Agent는 이 순서로 작업한다.

## Ground Rules

- 기존 `trip-planner` 코드를 직접 수정하지 않는다.
- 이 프로젝트는 `/Users/user/personal/ai-chat-workspace` 안에서만 작업한다.
- 처음부터 여행 도메인을 이식하지 않는다.
- 먼저 generic core를 세우고, 여행은 나중에 adapter 예제로 붙인다.
- UI/UX는 기존 trip-planner의 채팅 UX를 기준으로 한다.

## Phase 1: Project Scaffolding

1. Git init
2. Monorepo 구조 생성
3. Backend: Kotlin Spring Boot
4. Frontend: React + TypeScript
5. SQLite + Flyway 설정
6. 공통 dev script 작성

권장 구조:

```text
backend/
frontend/
docs/
agents/
templates/
scripts/
```

## Phase 2: Core Backend

구현 순서:

1. `workspace`
2. `data_space`
3. `source_record`
4. `chat_session`
5. `chat_message`
6. `checkpoint`
7. `ai_edit_run`
8. `ai_provider_session`

Trip Planner에서 복사 후 이름 변경해도 되는 영역:

- chat event broker
- chat run registry
- provider abstraction
- Codex app-server client
- OpenAI style provider
- response parser
- tool block stream filter

## Phase 3: Generic Domain Adapter

처음 adapter는 `generic-records`로 한다.

지원 operations:

```text
chat.set_title
domain.upsert_record
domain.update_record
domain.delete_record
domain.reorder_records
```

## Phase 4: Frontend Shell

구현 순서:

1. Workspace select screen
2. Data space list
3. Editor shell
4. Generic source record panel
5. Chat session home
6. Active chat
7. Workspace settings
8. Provider status
9. Checkpoint rollback

Trip Planner에서 가져올 UX:

- active chat header
- message meta
- message copy
- markdown renderer
- streaming bubble
- scroll to latest
- draft localStorage

## Phase 5: AI Integration

1. Local deterministic provider
2. OpenAI-compatible provider
3. OpenRouter provider
4. Codex app-server provider
5. provider status endpoint

## Phase 6: Example Domain

`travel-plan` adapter는 마지막에 추가한다.

목표:

- 기존 Trip Planner 데이터 모델을 참고하되 generic `source_records`를 우선 사용한다.
- 지도는 optional view로 둔다.

## Phase 7: External Bot

Telegram adapter부터 추천한다.

이유:

- command UX가 단순하다.
- message edit로 pseudo streaming 구현이 쉽다.

## Acceptance Checklist

- [ ] workspace CRUD
- [ ] data space CRUD
- [ ] source record CRUD
- [ ] chat session CRUD
- [ ] chat message send
- [ ] browser SSE streaming
- [ ] operation preview
- [ ] operation apply
- [ ] checkpoint rollback
- [ ] provider settings
- [ ] message copy
- [ ] full session copy
- [ ] streaming scroll UX
- [ ] Docker compose draft

