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
- Moved `TripPlannerApplicationTests` from SQLite to PostgreSQL Testcontainers
  so Flyway migration checks use the same database dialect as deployment.
- Added the `workspaces.owner` migration with default `wukong`, scoped
  workspace repository writes/reads to that owner, and added target-trip
  validation for AI item/place operations.
- Scoped attachment downloads by `sessionId`, forced unsafe attachment MIME
  types to download with `nosniff`, and redacted upstream/provider error text.
- Moved provider streaming and model attachment input assembly from
  `ChatRunService` into `ChatProviderRunner`.
- Moved chat run result persistence into `ChatRunResultWriter`.
- Moved AI trip operation application into `TripOperationApplier`, trip day
  date synchronization into `TripDayPlanner`, and rollback restore into
  `TripStateRestorer`.
- Split trip item/place persistence from `TripRepository` into
  `TripItemRepository` and `TripPlaceRepository`; moved row/binding helpers into
  focused files.
- Split broad integration tests into shared support, app workflow tests, and AI
  operation tests.
- Narrowed `dev-stop.sh` so it stops project-managed dev processes instead of
  killing every listener on the default ports.
- Updated README, API contract, and infra docs for PostgreSQL, async chat runs,
  current image tags, and the `dev` namespace.

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

1. `TripOperation` is still accepted as `Map<String, Any?>` at the API boundary.
   The application logic is isolated in `TripOperationApplier`; next step is a
   typed command parser without changing the external JSON contract.
2. `recordCheckpoint` and `chatEditRun` have long parameter lists. Replace with
   parameter objects.

## Contract And Docs Priority

1. Kotlin DTOs and TypeScript API types are manually duplicated. Move toward
   OpenAPI or another generated contract source.
2. Continue moving API docs toward generated OpenAPI or another contract source
   so DTO and TypeScript drift is mechanically detected.

## Verification Notes

- Frontend `npm run build`: passed.
- `git diff --check`: passed.
- Docker backend full test:
  `./gradlew :backend:test --no-daemon --project-cache-dir /tmp/gradle-project-cache`
  passed against a disposable PostgreSQL container.
- Modified source/test files are under 400 lines after the repository, service,
  chat run, and integration-test splits.
- Docker app image build:
  `docker buildx build --platform linux/amd64 --load -t trip-plan/app:local .`
  passed after the backend split.
