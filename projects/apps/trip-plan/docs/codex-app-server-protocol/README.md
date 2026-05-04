# Codex App Server Protocol

Generated protocol artifacts for the local Codex app-server integration.

Generation commands:

```bash
codex app-server generate-ts --out docs/codex-app-server-protocol/ts --experimental
codex app-server generate-json-schema --out docs/codex-app-server-protocol/json-schema --experimental
```

The Kotlin backend does not compile these TypeScript files. They are kept as the source-of-truth snapshot for method names, notification names, and payload shapes used by `CodexAppServerProtocol.kt`.

Current backend usage:

- `initialize`
- `thread/start`
- `thread/resume`
- `turn/start`
- `turn/interrupt`
- `item/agentMessage/delta`
- `turn/completed`

The backend stores the active `{ threadId, turnId }` per app run and calls `turn/interrupt` when the user stops a running Codex response.
