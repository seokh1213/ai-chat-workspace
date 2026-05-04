CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'local-rule',
  ai_settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_view TEXT NOT NULL DEFAULT 'canvas',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE task_nodes (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES task_nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date TEXT,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE task_links (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL REFERENCES task_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES task_nodes(id) ON DELETE CASCADE,
  label TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE plan_checkpoints (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_plans_workspace ON plans(workspace_id, updated_at DESC);
CREATE INDEX idx_task_nodes_plan_order ON task_nodes(plan_id, sort_order ASC);
CREATE INDEX idx_task_nodes_parent ON task_nodes(parent_id);
CREATE INDEX idx_task_links_plan ON task_links(plan_id);
CREATE INDEX idx_plan_checkpoints_plan ON plan_checkpoints(plan_id, created_at DESC);
