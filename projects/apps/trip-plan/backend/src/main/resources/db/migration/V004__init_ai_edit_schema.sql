CREATE TABLE checkpoints (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  label TEXT,
  reason TEXT,
  source TEXT NOT NULL,
  before_state_json TEXT NOT NULL,
  after_state_json TEXT NOT NULL,
  operations_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE ai_edit_runs (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  chat_session_id TEXT REFERENCES chat_sessions(id) ON DELETE SET NULL,
  provider_session_id TEXT REFERENCES ai_provider_sessions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT,
  provider_run_id TEXT,
  user_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
  assistant_message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
  operations_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  error TEXT,
  checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_checkpoints_trip ON checkpoints(trip_id, created_at DESC);
CREATE INDEX idx_ai_runs_session ON ai_edit_runs(chat_session_id, created_at DESC);
