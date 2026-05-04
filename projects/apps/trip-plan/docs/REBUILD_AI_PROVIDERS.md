# AI Provider Abstraction Plan

The backend should treat local Codex and hosted AI APIs as interchangeable providers. The product UI should expose a single `AI` path inside chat sessions; concrete provider choice is a backend or workspace-level policy.

## Goal

Chat, streaming progress, operation extraction, checkpoint creation, and rollback should not depend on a specific AI transport.

Supported target transports:

- Local rule provider
- `codex exec --json`
- `codex app-server` WebSocket
- OpenAI-compatible Chat Completions SSE
- OpenRouter Chat Completions SSE

## Kotlin Contract

Use Kotlin coroutines as the common streaming boundary.

```kotlin
interface AiProvider {
    val id: String
    fun streamChat(request: AiChatRequest): Flow<AiStreamEvent>
}
```

`ChatRunService` consumes only this interface. It does not know whether events came from Codex, OpenAI-style SSE, OpenRouter, another hosted API, or a local rule provider.

## Request Shape

```kotlin
data class AiChatRequest(
    val runId: String,
    val workspaceId: String,
    val tripId: String,
    val chatSessionId: String,
    val providerSessionId: String?,
    val model: String?,
    val userMessage: String,
    val tripContext: TripContextSnapshot,
    val operationSchema: OperationSchema,
    val priorMessages: List<ChatMessageSnapshot>
)
```

By default the request includes the full trip context, not only selected places. The UI may pass focus hints such as selected day or selected place, but the backend prompt builder still has access to the whole trip.

## Event Shape

Provider-specific events are normalized into application events.

```kotlin
sealed interface AiStreamEvent {
    data class RunStarted(val runId: String) : AiStreamEvent
    data class ProviderConnected(val provider: String) : AiStreamEvent
    data class ProviderThreadStarted(val externalThreadId: String?) : AiStreamEvent
    data class MessageDelta(val delta: String) : AiStreamEvent
    data class MessageCompleted(val content: String) : AiStreamEvent
    data class OperationsDetected(val operationsJson: String) : AiStreamEvent
    data class RunCompleted(val runId: String) : AiStreamEvent
    data class RunFailed(val message: String) : AiStreamEvent
}
```

Non-streaming providers can emit `RunStarted`, one `MessageCompleted`, then `RunCompleted`.

## Provider Implementations

### MockProvider

Development-only provider that returns deterministic responses and optional operations.

### CodexExecProvider

Runs `codex exec --json` and maps JSONL events into `AiStreamEvent`. This is the shortest migration path from the current prototype.

### CodexAppServerProvider

Connects to local `codex app-server` over WebSocket, persists external thread ids in `ai_provider_sessions`, maps app-server events into `AiStreamEvent`, and sends `turn/interrupt` when a running Codex response is stopped.

Current defaults:

- provider id: `codex-app-server`
- URL: `ws://127.0.0.1:8765`
- model: `gpt-5.4-mini`
- effort: `medium`
- cwd: `/tmp`
- managed process: enabled in `dev` profile with `CODEX_APP_SERVER_MANAGED=true`

The React UI exposes provider selection at workspace level, not inside each chat session. New chat sessions inherit the workspace provider/model/settings.

### OpenAiCompatibleProvider

Calls an OpenAI Chat Completions compatible endpoint. Workspace settings provide:

- Base URL, default `https://api.openai.com/v1/chat/completions`
- API key, optional for local compatible endpoints
- Model

The provider requests `stream=true` and parses OpenAI-style SSE deltas.

### OpenRouterProvider

Calls OpenRouter's Chat Completions endpoint. Workspace settings provide:

- OpenRouter API key
- Model, default `openai/gpt-5.2`
- optional `HTTP-Referer`
- optional `X-OpenRouter-Title`

## Supported User-Facing Providers

- `codex-app-server`
- `openai-compatible`
- `openrouter`

## Runtime Selection

Each chat session stores:

- `provider`: inherited from workspace settings, default `codex-app-server`
- `model`
- provider settings JSON

The server resolves this into an `AiProvider` bean. The browser does not choose among local/Codex/external providers inside a chat session and never receives provider credentials.

## Security

- Provider credentials are backend-only.
- Browser talks only to Spring REST/SSE endpoints.
- AI responses are untrusted until parsed and validated.
- AI providers cannot write the DB directly.
- Only validated operations can mutate trip state.

## Why This Matters

This keeps the product architecture stable while we move through providers:

```text
React chat UI
  -> Spring ChatRunService
  -> AiProvider.streamChat()
  -> Flow<AiStreamEvent>
  -> operation parser / validator / applier
  -> browser SSE
```

Switching from local Codex app-server to an external API should require a provider adapter and configuration change, not a frontend rewrite.
