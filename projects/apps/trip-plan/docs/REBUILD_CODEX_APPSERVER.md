# Codex app-server Integration Plan

Codex app-server is one `AiProvider` implementation. It is the target local integration, but it is not step one. First, the Kotlin backend must own DB state, operations, checkpoints, chat sessions, and the provider-neutral streaming contract.

## Why app-server

Compared with `codex exec`, app-server is a better fit for an app-like chat experience.

Expected benefits:

- Long-running Codex sessions
- Native thread/session resume
- Richer event stream
- Stop/cancel support
- Better alignment with OpenClaw-style harness integration
- Cleaner separation between browser UI and local Codex credentials

## Transport

Backend starts or connects to:

```bash
codex app-server --listen ws://127.0.0.1:8765
```

Only bind to loopback. Browser must not connect directly.

Spring backend owns:

- app-server connection URL
- auth/token if needed
- protocol translation
- event persistence
- SSE relay to frontend

Current implementation can either connect to an externally started app-server or start one from Spring when `CODEX_APP_SERVER_MANAGED=true`. In the `dev` profile Spring starts or reuses the app-server by default. The default backend URL is `CODEX_APP_SERVER_URL=ws://127.0.0.1:8765`.

The app-server process is not the product chat session. It is a shared local gateway process. Product sessions remain rows in `chat_sessions`; provider thread ids are stored per chat session in `ai_provider_sessions`, so separate trip chats do not share one Codex thread accidentally.

The backend sends `cwd=/tmp` by default through `CODEX_APP_SERVER_CWD`. Travel editing does not need file access, and using an ASCII cwd avoids Codex turn metadata header issues when the repository path contains non-ASCII characters.

## High-Level Flow

```text
React chat UI
  POST /api/chat-sessions/{id}/messages
        |
        v
Spring ChatService
  routes session and message requests
        |
        v
Spring ChatRunService
  save user message
  create ai_edit_run
  call AiProvider.streamChat()
        |
        v
CodexAppServerProvider
  connects to Codex app-server websocket
  converts thread/turn/message events
        |
        v
Spring ChatRunService
  consumes AiStreamEvent flow
  stores assistant message
  parses operations
  applies operations
  creates checkpoint
  emits SSE events
        |
        v
React SSE client
```

## Spring Components

### CodexAppServerProcess

Responsibilities:

- Start app-server in local development when enabled
- Detect if app-server is already running
- Stop the Spring-owned process on backend shutdown
- Restart the Spring-owned process when `CODEX_APP_SERVER_RESTART_ON_EXIT=true`
- Expose health status

Status: implemented as lifecycle management through `CODEX_APP_SERVER_MANAGED=true`; enabled by default in local `dev`, disabled in tests.

### CodexAppServerClient

Responsibilities:

- WebSocket connect
- Send requests
- Receive protocol events
- Correlate events to chat run
- Surface typed events to application services

Status: implemented with JDK `java.net.http.WebSocket`.

Cancel support tracks the active app-server `{threadId, turnId}` per app run and sends `turn/interrupt` when the UI stops a Codex response. The app-owned cancel marker still prevents late operation application if the provider is already finishing or cannot be interrupted.

### CodexAppServerProvider

Responsibilities:

- Implement `AiProvider`
- Convert Codex protocol events into `AiStreamEvent`
- Hide Codex-specific protocol names from `ChatRunService`
- Persist external thread ids through `ai_provider_sessions`

Status: implemented for `initialize`, `thread/start`, `thread/resume`, `turn/start`, `turn/interrupt`, `item/agentMessage/delta`, and `turn/completed`.

### CodexPromptBuilder

Responsibilities:

- Build system/developer prompt
- Include current trip state
- Include operation schema
- Include session context
- Enforce JSON-only response contract

Status: implemented. `turn/start` now sends the generated operation output schema, and the backend still validates parsed operations before applying them.

### ChatRunService

Responsibilities:

- Save user message
- Create run
- Subscribe to Codex events
- Save assistant message
- Dispatch operations to OperationService
- Publish SSE events

Status: implemented as a dedicated service. `ChatService` now owns chat session CRUD and SSE subscription wiring; `ChatRunService` owns run execution, provider streaming, operation application, checkpoint linkage, and cancel markers.

## Browser Events

The backend exposes provider-neutral SSE, not Codex protocol directly.

```text
run.started
assistant.message.delta
assistant.message.completed
operations.proposed
run.applied
run.completed
run.cancelled
run.failed
```

## Fallback Mode

Before app-server is fully integrated:

- Keep a `CodexExecProvider` behind the same `AiProvider` interface.
- It can run `codex exec --json`.
- It can emit coarse events: started, turn.started, completed.

After app-server lands, `CodexExecProvider` remains a diagnostic fallback.

External API providers use the same contract. For example, an API that returns SSE can be implemented as `ExternalSseProvider`, and an API that returns a single completion can emit one `assistant.message.completed` event followed by `run.completed`.

## Security Rules

- Never expose `~/.codex/auth.json` to the browser.
- Never expose external API keys to the browser.
- Do not let Codex write DB directly.
- Do not let Codex execute arbitrary app mutations.
- Apply only validated operations.
- Bind local app-server to `127.0.0.1`.
- Treat provider protocol events as untrusted input.

## Protocol Snapshot

Protocol message names and payload shapes are generated into `projects/apps/trip-plan/docs/codex-app-server-protocol/`.

```bash
codex app-server generate-ts --out projects/apps/trip-plan/docs/codex-app-server-protocol/ts --experimental
codex app-server generate-json-schema --out projects/apps/trip-plan/docs/codex-app-server-protocol/json-schema --experimental
```

The Kotlin adapter centralizes the app-server method names, notification names, and payload builders in `CodexAppServerProtocol.kt`.

## Open Questions

- Decide whether Spring should spawn app-server or keep requiring an external app-server URL.

## Implementation Order

1. Define `AiProvider` Kotlin interface.
2. Implement local rule provider.
3. Implement `CodexExecProvider` using current `codex exec --json` behavior.
4. Add SSE relay.
5. Generate app-server protocol schema/types.
6. Implement WebSocket app-server adapter.
7. Add external API provider skeleton using the same event model.
8. Add stop/cancel and thread picker UX.

Implemented through step 8 for app-owned chat sessions.
