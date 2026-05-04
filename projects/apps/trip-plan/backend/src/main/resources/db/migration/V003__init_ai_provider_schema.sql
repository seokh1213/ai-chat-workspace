CREATE TABLE ai_provider_sessions (
  id TEXT PRIMARY KEY,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_thread_id TEXT,
  external_conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_event_json TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(chat_session_id, provider, external_thread_id)
);

CREATE INDEX idx_ai_provider_sessions_chat ON ai_provider_sessions(chat_session_id, provider);
