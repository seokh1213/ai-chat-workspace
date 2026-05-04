ALTER TABLE workspaces ADD COLUMN ai_provider TEXT NOT NULL DEFAULT 'codex-app-server';
ALTER TABLE workspaces ADD COLUMN ai_model TEXT NOT NULL DEFAULT 'gpt-5.4-mini';
ALTER TABLE workspaces ADD COLUMN ai_effort TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE workspaces ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}';
