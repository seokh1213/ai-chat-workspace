# Rebuild Migration Plan

The rebuild should keep the current prototype usable while moving toward Kotlin/Spring + React.

## Phase 0: Documentation

Status: completed.

Deliverables:

- Architecture document
- DB schema document
- API contract
- AI operation contract
- AI provider abstraction plan
- Seed data plan
- Codex app-server plan
- Frontend plan

Exit criteria:

- Backend scaffold can be created without making new architecture decisions.
- Frontend scaffold can be created without rethinking layout.

## Phase 1: Backend Scaffold

Create `projects/apps/trip-plan/backend/`.

Baseline:

- Gradle Kotlin DSL app build with `backend` included
- Spring Boot 4.0.5
- Kotlin 2.3.20
- JDK 21
- SQLite JDBC
- Flyway
- Spring Web MVC
- Jackson Kotlin module
- Validation
- Actuator

Initial package layout:

```text
com.example.tripplanner
  TripPlannerApplication.kt
  config/
  common/
  workspace/
  trip/
  operation/
  chat/
  ai/
    provider/
  import/
```

Exit criteria:

- `cd projects/apps/trip-plan` 후 `./gradlew :backend:test` passes.
- App starts on a configurable port.
- Flyway creates initial SQLite schema.
- `GET /actuator/health` works.

## Phase 2: Core DB and Seed Runner

Implement:

- Workspace repository
- Trip repository
- Place repository
- Itinerary repository
- Opt-in SQL seed runner
- `projects/apps/trip-plan/backend/src/main/resources/db/seed/001_default_workspace.sql`

Exit criteria:

- Flyway creates schema only.
- Seed runner can apply initial SQL idempotently.
- No real Okinawa trip data is committed as app seed.
- `GET /api/workspaces` returns the seeded default workspace.

## Phase 3: Operation Engine

Implement:

- `Operation` sealed interface
- JSON polymorphic deserialization
- `OperationValidator`
- `OperationApplier`
- `CheckpointService`

Supported operations:

- `add_item`
- `update_item`
- `move_item`
- `delete_item`
- `reorder_day`
- `replace_day_plan`

Exit criteria:

- Operations apply transactionally.
- Failed operation batch leaves DB unchanged.
- Checkpoint is created on success.
- Rollback restores previous state.

## Phase 4: Frontend Scaffold

Create `projects/apps/trip-plan/frontend/`.

Status: completed.

Baseline:

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- Leaflet

Exit criteria:

- Dev server starts.
- App can fetch backend trip state.
- Basic layout renders map/sidebar/chat shell.

Current implementation fetches backend health and workspace state first. Trip state wiring comes after the trip API is implemented.

## Phase 5: UI Parity

Port current UX:

- Left planner sidebar
- Schedule and places sections
- Collapsible side panels
- Map pins and selected day route
- Item editing
- Add/move/delete/update operations
- Latest checkpoint rollback

Exit criteria:

- Existing Node UI workflows work in React.
- Node prototype is no longer needed for daily use.

## Phase 6: Chat Sessions

Implement:

- Chat session list
- Session create/select
- Message persistence
- `POST /chat-sessions/{id}/messages`
- Basic local/mock AI response
- Provider-neutral `AiProvider` interface returning coroutine `Flow<AiStreamEvent>`

Exit criteria:

- Multiple chat sessions per trip.
- Messages survive refresh.
- UI can switch sessions.
- Local rule provider and future adapters share the same ChatRunService path.

Status: completed. `ChatService` handles chat session API concerns, and `ChatRunService` handles provider execution and AI edit runs. The session UI now exposes a single `AI` route; local/Codex/external adapter selection is hidden behind backend policy.

## Phase 7: SSE Progress

Implement backend event stream:

- `GET /chat-sessions/{id}/events`
- run lifecycle events
- message completed event
- operation applied/failed event

Exit criteria:

- Chat pending state uses SSE.
- Operation application refreshes UI.
- Errors show in chat.

## Phase 8: Codex Exec Adapter

Before app-server, implement `codex exec --json` adapter in Kotlin.

Purpose:

- Validate prompt/operation contract.
- Reuse current working behavior.
- Provide coarse progress events.

Exit criteria:

- Backend can call local Codex CLI.
- Browser receives started/completed/failed events.
- Operations returned by Codex are applied through the engine.
- Adapter implements the same `AiProvider` contract as mock and external providers.

## Phase 9: Codex app-server Adapter

Implement WebSocket app-server integration.

Steps:

1. Generate app-server protocol schema/types.
2. Start or connect to local app-server.
3. Send chat turn payload.
4. Convert protocol events to internal events.
5. Persist provider thread id in `ai_provider_sessions`.
6. Support cancel/stop.

Exit criteria:

- Existing chat sessions can bind to Codex threads.
- Long-running session can resume.
- Stop/cancel works.
- Browser never receives Codex credentials or raw auth data.

Status: implemented for external app-server connection, opt-in Spring-managed process startup/shutdown, streaming, thread resume, generated output schema, and provider-native `turn/interrupt` cancellation. Protocol TypeScript and JSON Schema snapshots are generated under `projects/apps/trip-plan/docs/codex-app-server-protocol/`, and Kotlin method/payload names are centralized in `CodexAppServerProtocol.kt`.

## Phase 9.5: External API Provider Skeleton

Implement a provider skeleton for external hosted AI APIs.

Scope:

- API key/config loaded only on backend.
- SSE streaming adapter maps remote chunks to `AiStreamEvent`.
- Non-streaming REST completion can be wrapped as a short event flow.
- Provider-specific conversation ids are stored in `ai_provider_sessions`.

Exit criteria:

- ChatRunService is unchanged when switching from Codex provider to external provider.
- Browser SSE event names remain unchanged.

Status: replaced by explicit workspace-level `openai-compatible` and `openrouter` providers. Both normalize provider output into the same chat SSE events.

## Phase 10: Retire Node Prototype

Move current Node files into `projects/apps/trip-plan/legacy-node/` or remove them after parity.

Keep:

- Documentation
- Migration notes
- External-data conversion notes, if still useful

Exit criteria:

- Kotlin backend + React frontend are the default dev commands.
- README points to new stack.

Status: completed. Legacy Node files are under `projects/apps/trip-plan/legacy-node/`; Kotlin backend and React frontend remain the app development path.
