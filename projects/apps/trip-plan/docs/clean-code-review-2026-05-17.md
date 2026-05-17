# Clean Code Review - 2026-05-17

## Basis

- Workspace harness: `/home/wukong/.codex/CLEAN_CODE.md`
- Definition used: readable and changeable by a maintainer without hidden
  context; names reveal intent; functions/components have one primary reason to
  change; duplication is removed only when it preserves domain meaning; tests
  are part of cleanliness.

## Implemented This Pass

- Moved the place add button above the empty-state block in desktop and mobile
  place sections, matching the schedule section.
- Prevented workspace API responses from serializing `openAiApiKey`,
  `openRouterApiKey`, and raw `settingsJson`.
- Prevented chat session API responses from serializing raw provider
  `settingsJson`.
- Updated the workspace settings form so blank secret fields preserve existing
  server-side keys instead of clearing them.
- Added serialization tests for workspace and chat session secret redaction.

## Frontend Priority

1. `App.tsx`, `useTripChat.ts`, `useChatEventStream.ts`,
   `useEditorScreenState.ts`, and `MapCanvas.tsx` exceed the clean-code function
   responsibility limit. Split by screen container, chat session lifecycle,
   stream event handling, editor detail/focus/resize state, and map lifecycle.
2. `EditorScreenProps`, `PlannerSidebarProps`, and `ChatPanelProps` still have
   wide prop surfaces. Continue replacing full props/state forwarding with
   schedule, places, layout, meta, map, and chat contracts.
3. Desktop and mobile schedule/place cards duplicate view-model calculations.
   Extract pure view-model builders before extracting shared UI.
4. Mobile action buttons and coordinate input handling are duplicated across
   forms and sections.

## Backend Priority

1. `ChatRunService.kt` is the largest risk: run lifecycle, provider streaming,
   SSE publishing, attachments, cancellation, and persistence are in one
   service. Extract around current private function boundaries with tests for
   success, failure, and cancellation.
2. `TripService.kt` applies AI operations through `Map<String, Any?>`.
   Introduce typed commands or a validated parser before deeper service splits.
3. `TripRepository.kt` and `ChatRepository.kt` exceed file limits. Split by
   aggregate/table responsibility and move mappers into focused files.
4. `recordCheckpoint` and `chatEditRun` have long parameter lists. Replace with
   parameter objects.

## Contract And Docs Priority

1. Kotlin DTOs and TypeScript API types are manually duplicated. Move toward
   OpenAPI or another generated contract source.
2. `REBUILD_API.md` has stale chat send response documentation.
3. README and infra docs have drifted from the current PostgreSQL and image tag
   defaults.

## Verification Notes

- Frontend `npm run build`: passed.
- `git diff --check`: passed.
- Docker backend targeted test:
  `./gradlew :backend:test --tests app.tripplanner.workspace.WorkspaceSerializationTests`: passed in a container copy.
- Full backend test suite in a container copy compiles, then fails in existing
  `TripPlannerApplicationTests` SQLite/Flyway setup before this change's
  assertions. Treat that as a separate test harness cleanup item.
