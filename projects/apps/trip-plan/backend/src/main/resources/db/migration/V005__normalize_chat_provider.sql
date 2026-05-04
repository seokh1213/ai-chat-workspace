UPDATE chat_sessions
SET provider = 'trip-ai'
WHERE provider IN ('mock', 'local-rule', 'codex-app-server', 'external-api');

UPDATE ai_provider_sessions
SET provider = 'trip-ai'
WHERE provider IN ('mock', 'local-rule', 'codex-app-server', 'external-api');
