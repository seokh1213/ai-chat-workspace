UPDATE workspaces
SET ai_provider = 'codex-app-server'
WHERE ai_provider = 'trip-ai';

UPDATE workspaces
SET ai_provider = 'openai-compatible'
WHERE ai_provider = 'external-api';

UPDATE chat_sessions
SET provider = 'codex-app-server'
WHERE provider = 'trip-ai';

UPDATE chat_sessions
SET provider = 'openai-compatible'
WHERE provider = 'external-api';

UPDATE ai_provider_sessions
SET provider = 'codex-app-server'
WHERE provider = 'trip-ai';

UPDATE ai_provider_sessions
SET provider = 'openai-compatible'
WHERE provider = 'external-api';
