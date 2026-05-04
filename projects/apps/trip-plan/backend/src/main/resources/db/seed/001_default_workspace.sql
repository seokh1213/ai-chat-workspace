-- Bootstrap seed only.
-- Real trip data, including Okinawa data, is intentionally kept outside the code repository.

INSERT INTO workspaces (
  id,
  name,
  created_at,
  updated_at
) VALUES (
  'workspace_default',
  'Default workspace',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;
