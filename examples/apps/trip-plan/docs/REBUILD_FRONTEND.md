# Rebuild Frontend Plan

Frontend target is React 19, Vite, Tailwind CSS 4.

## Principles

- Build the actual planning workspace, not a marketing page.
- Keep map visible as the primary canvas.
- Keep AI chat as a first-class editor, not just a Q&A box.
- Use server state as source of truth.
- Store only layout preferences and map viewport in browser storage.

## Layout

Desktop:

```text
+-------------------------------------------------------------+
| left sidebar | map canvas                         | AI chat |
|              |                                    |         |
| schedule     | pins/routes/legend                 | sessions|
| places       |                                    | messages|
+-------------------------------------------------------------+
```

Mobile:

```text
+--------------------+
| map                |
+--------------------+
| planner sections   |
+--------------------+
| AI chat            |
+--------------------+
```

Panels:

- Left planner sidebar can collapse.
- AI chat panel can collapse.
- If both collapse, map fills the workspace.
- Schedule and places sections can independently collapse.

## Route Structure

```text
/                       -> redirect to last workspace/trip
/workspaces/:workspaceId
/trips/:tripId
/trips/:tripId/chat/:sessionId
/settings/import
```

## Component Tree

```text
App
  Router
    TripWorkspacePage
      WorkspaceShell
        PlannerSidebar
          ScheduleSection
          PlacesSection
        MapCanvas
          MapLegend
          RouteLayer
          PlaceMarkers
          ItineraryMarkers
        ChatPanel
          ChatSessionList
          ChatMessageList
          ChatComposer
          CheckpointControls
```

## State

Use a query/cache library after scaffold if it helps, but do not introduce it before the base flow works.

Initial state approach:

- `useTripState(tripId)` fetches `/api/trips/{tripId}/state`.
- Mutations call `/api/trips/{tripId}/operations`.
- Chat sends messages through `/api/chat-sessions/{sessionId}/messages`.
- SSE hook subscribes to `/api/chat-sessions/{sessionId}/events`.
- Frontend does not branch on provider protocol. Codex app-server and external API events are already normalized by the backend.

## Styling

Tailwind CSS 4 with a small token layer.

Primary tokens:

- `--color-bg: #f5f6f8`
- `--color-surface: #ffffff`
- `--color-text: #24262d`
- `--color-muted: #9aa0a6`
- `--color-line: #eaedf0`
- `--color-teal: #1fc1b6`
- `--color-violet: #975fff`

No oversized hero UI. This is a work surface.

## Map

Keep Leaflet initially.

Map responsibilities:

- Persist viewport in URL or localStorage.
- Show all itinerary pins in violet.
- Highlight selected day route and sequence numbers.
- Show places in neutral gray.
- Open popup with grouped items.
- Focus marker from list action.

Provider abstraction:

```ts
type MapProvider = "leaflet";
```

Future providers can be added without changing domain state.

## Chat UX

- `Cmd+Enter` sends message.
- Pending state appears immediately.
- SSE events update progress.
- Assistant message is persisted in DB.
- If operations apply, trip state refreshes.
- Rollback control targets latest checkpoint.
- Chat sessions are scoped to a trip, and the session list allows separate conversations for different planning topics.

## Data Contracts

Frontend uses typed DTOs generated or manually maintained from backend contracts.

Initial DTOs:

- `TripStateDto`
- `TripDto`
- `TripDayDto`
- `PlaceDto`
- `ItineraryItemDto`
- `ChatSessionDto`
- `ChatMessageDto`
- `CheckpointDto`
- `OperationDto`
- `ChatEventDto`

## Implementation Order

1. Vite React app scaffold.
2. Tailwind 4 setup.
3. API client and DTOs.
4. Trip workspace static layout.
5. Map canvas with server state.
6. Planner sidebar schedule/places.
7. Operations mutations.
8. Chat sessions and messages.
9. SSE progress events.
10. Codex app-server event rendering.
