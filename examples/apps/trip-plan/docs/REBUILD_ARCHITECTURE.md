# Rebuild Architecture

이 문서는 현재 Node/vanilla JS 프로토타입을 범용 AI 여행 플래너로 재구현하기 위한 기준 문서다.

## Technology Baseline

- Backend: Kotlin 2.3.20, Spring Boot 4.0.5
- Runtime: JDK 21
- JDK path: `/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home`
- Database: SQLite
- Migration: Flyway
- Frontend: React 19, Vite, Tailwind CSS 4
- Map: Leaflet 우선 유지, 지도 provider 교체 가능하도록 adapter 분리
- AI provider: Kotlin coroutine `Flow` 기반 streaming abstraction
- Local AI adapter: 마지막 단계에서 Codex app-server WebSocket 연동
- External AI adapter: 향후 외부 API SSE/WebSocket/REST streaming 연동 가능하도록 분리

## Product Direction

현재 앱은 오키나와 여행 계획 전용이지만, 재구현 대상은 특정 여행지에 묶이지 않는 범용 여행 계획 도구다.

핵심 기능:

- 여행별 workspace 관리
- 여행 일정과 조사 장소 관리
- 지도 기반 동선 확인
- AI 채팅 세션 목록 관리
- 여러 여행과 여러 상담 세션 전환
- AI가 제안한 일정 편집 operations 검증/적용
- checkpoint 기반 rollback
- provider-neutral AI streaming 기반 장기 세션과 진행 이벤트

## Multi-Trip and Chat Session Scope

여러 여행 편집은 core scope에 포함한다. `workspace -> trips -> trip_days/places/itinerary_items` 구조로 저장하고, UI는 여행 목록과 최근 여행 진입을 제공한다.

채팅 세션 기능도 core scope에 포함한다. 하나의 trip에는 여러 chat session이 연결될 수 있고, 각 세션은 별도 provider/model/thread 상태를 가질 수 있다. 예를 들어 "전체 일정 재구성", "북부 동선 상담", "맛집 후보 정리"를 같은 여행 안에서 독립된 상담 기록으로 유지한다.

AI 요청에는 기본적으로 전체 trip context를 제공한다. 선택된 날짜나 장소는 focus hint로 넘길 수 있지만, 전체 수정을 요청할 수 있으므로 서버 prompt builder가 전체 일정과 조사 장소에 접근할 수 있어야 한다.

## Target Repository Layout

```text
repo-root/
  settings.gradle.kts
  build.gradle.kts
  backend/
    build.gradle.kts
    src/main/kotlin/...
    src/main/resources/
      application.yml
      db/migration/
      db/seed/
  frontend/
    package.json
    vite.config.ts
    src/
  docs/
  legacy-node/
```

Repository root는 `trip-planner/`다. 코드/문서/미래 frontend/backend는 모두 이 저장소 안에서 관리하고, 실제 여행 원본 자료는 저장소 밖에서 관리한다.

현재 Node 구현은 `legacy-node/`로 이동했다. 초기 migration 기간에는 같은 repository 안에서 보관하되, 기본 개발 경로는 Kotlin backend와 React frontend다.

## System Boundary

```text
Browser
  React UI
  Leaflet map
  SSE event client
        |
        v
Spring Boot API
  REST controllers
  SSE event stream
  Operation engine
  Checkpoint service
  AiProvider adapters
    Codex app-server
    External SSE API
        |
        v
SQLite
  trips / days / items / places
  chat sessions / messages
  checkpoints / ai edit runs
```

브라우저는 Codex app-server나 외부 AI API에 직접 연결하지 않는다. Spring backend가 provider와 통신하고, 필요한 진행 상태만 SSE로 브라우저에 전달한다.

## Backend Modules

### trip

- workspace/trip/day/place/item CRUD
- 지도에 필요한 좌표 payload 구성
- 일정 순서 재정렬

### operation

- AI 또는 UI가 제출한 operations 검증
- transaction 안에서 plan 변경
- 적용 전후 snapshot 생성
- checkpoint 생성

### chat

- AI 채팅 세션 생성/조회
- 메시지 저장
- 세션별 현재 trip context 연결
- SSE 이벤트 발행

### ai

- coroutine `Flow<AiStreamEvent>` 기반 provider abstraction
- local fallback
- Codex app-server adapter
- external SSE/API adapter
- 향후 OpenAI/Anthropic/Gemini 등 direct adapter

### import

- 별도 SQL seed 적용 runner
- 외부 Google Maps/Triple export를 SQL seed로 변환하는 개발 도구
- 실제 여행 데이터는 generic app code와 분리
- 현재 `legacy-node/data/plan.js`, `legacy-node/data/places.js`는 legacy prototype 자료로만 취급

## Frontend Modules

### pages

- Trip workspace page
- Chat session list/detail
- Settings/import page

### components

- Map canvas
- Planner sidebar
- Itinerary item editor
- Place catalog list
- Chat panel
- Checkpoint rollback control

### client

- REST API client
- SSE client
- optimistic UI helper
- local layout preference storage

## State Ownership

서버가 원본이다.

- plan, places, chat sessions, messages, checkpoints: SQLite
- layout preference, panel collapsed state, map viewport: browser localStorage or URL
- AI 진행 상태: transient SSE event

프론트는 서버 상태를 캐시할 수 있지만, 일정 편집 결과의 최종 원본은 SQLite다.

## AI Editing Principle

AI는 DB를 직접 수정하지 않는다.

AI는 다음 JSON만 반환한다.

```json
{
  "message": "사용자에게 보여줄 설명",
  "operations": []
}
```

Spring backend는 operations를 검증하고 적용한다. 실패하면 plan은 변경하지 않고, 실패 사유를 chat message로 저장한다.

## Codex app-server Position

Codex app-server 연동은 provider adapter 중 하나이며, 마지막 migration 단계다.

도입 전:

- REST chat endpoint
- local fallback or codex exec bridge
- operation engine 검증

도입 후:

- Spring backend가 Codex app-server를 시작하거나 기존 endpoint에 연결
- app-server 이벤트를 내부 `AiStreamEvent`로 변환
- 브라우저에는 SSE로 `started`, `thinking`, `message_delta`, `operation_proposed`, `applied`, `failed`, `completed` 이벤트 제공

## AI Provider Abstraction

AI 호출 경로는 UI와 operation engine에서 분리한다. 로컬 Codex app-server, `codex exec`, 외부 API SSE, 외부 REST API는 모두 같은 provider interface 뒤에 둔다.

```kotlin
interface AiProvider {
    val id: String
    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent>
    suspend fun cancel(runId: String)
}
```

Provider adapter는 원본 protocol event를 그대로 노출하지 않고 application-level event로 변환한다.

```text
Codex app-server WebSocket ┐
External API SSE          ├─ AiProvider.streamChat() -> Flow<AiStreamEvent> -> ChatRunService -> Browser SSE
External REST completion  ┘
```

외부 API가 token streaming만 제공하거나 non-streaming completion만 제공해도 adapter가 `message_delta`, `message_completed`, `run_completed` 이벤트로 정규화한다.

## Version Notes

- Spring Boot 4.0.5는 현재 stable Spring Boot 4 line이다.
- Kotlin 2.3.20은 Kotlin 공식 release 문서 기준 최신 stable update target이다.
- JDK 21은 Spring Boot 4와 Kotlin JVM target의 기준 런타임으로 사용한다.
