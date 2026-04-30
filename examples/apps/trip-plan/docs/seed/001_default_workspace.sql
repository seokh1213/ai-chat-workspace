-- Bootstrap seed only.
-- Apply after Flyway schema migrations.
-- Real trip data, including Okinawa data, is intentionally kept outside the code repository.

INSERT OR IGNORE INTO workspaces (
  id,
  name,
  created_at,
  updated_at
) VALUES (
  'workspace_default',
  'Default workspace',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
