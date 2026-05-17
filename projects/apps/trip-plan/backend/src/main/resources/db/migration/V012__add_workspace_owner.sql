ALTER TABLE workspaces ADD COLUMN owner TEXT NOT NULL DEFAULT 'wukong';

CREATE INDEX idx_workspaces_owner ON workspaces(owner, created_at);
