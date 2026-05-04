CREATE SCHEMA IF NOT EXISTS chat_files;

CREATE TABLE chat_files.chat_attachments (
  id TEXT PRIMARY KEY,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  chat_message_id TEXT REFERENCES chat_messages(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  kind TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  text_preview TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE chat_files.chat_attachment_blobs (
  attachment_id TEXT PRIMARY KEY REFERENCES chat_files.chat_attachments(id) ON DELETE CASCADE,
  content BYTEA NOT NULL
);

CREATE INDEX idx_chat_attachments_session ON chat_files.chat_attachments(chat_session_id, created_at);
CREATE INDEX idx_chat_attachments_message ON chat_files.chat_attachments(chat_message_id, created_at);
