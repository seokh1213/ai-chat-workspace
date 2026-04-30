CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'local-rule',
  model TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE ai_edit_runs (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT,
  user_message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  assistant_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
  operations_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  error TEXT,
  checkpoint_id TEXT REFERENCES plan_checkpoints(id) ON DELETE SET NULL,
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_chat_sessions_plan ON chat_sessions(plan_id, updated_at DESC);
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id, created_at ASC);
CREATE INDEX idx_ai_edit_runs_session ON ai_edit_runs(chat_session_id, created_at DESC);
