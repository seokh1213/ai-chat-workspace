# Core Data Model

SQLite 기준의 초기 모델이다. PostgreSQL로 옮겨도 구조는 유지한다.

## Entity Overview

```text
workspaces
  data_spaces
    source_records
    domain_views
    chat_sessions
      chat_messages
    ai_edit_runs
    ai_provider_sessions
    checkpoints
```

## workspaces

```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ai_provider TEXT NOT NULL DEFAULT 'codex-app-server',
  ai_model TEXT,
  ai_effort TEXT NOT NULL DEFAULT 'medium',
  provider_settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## data_spaces

도메인별 작업 대상이다. Trip Planner의 `trips`에 해당한다.

```sql
CREATE TABLE data_spaces (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

예시 `type`:

- `travel-plan`
- `research-board`
- `content-calendar`
- `crm-pipeline`
- `study-plan`

## source_records

AI가 읽고 수정하는 기본 단위다.

```sql
CREATE TABLE source_records (
  id TEXT PRIMARY KEY,
  data_space_id TEXT NOT NULL REFERENCES data_spaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## domain_views

같은 원천 데이터를 다른 방식으로 보여주는 뷰 설정이다.

```sql
CREATE TABLE domain_views (
  id TEXT PRIMARY KEY,
  data_space_id TEXT NOT NULL REFERENCES data_spaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

예시:

- 여행: day timeline, map
- CRM: kanban, table
- 콘텐츠: calendar, board

## chat_sessions

```sql
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  data_space_id TEXT NOT NULL REFERENCES data_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## chat_messages

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
```

## ai_edit_runs

```sql
CREATE TABLE ai_edit_runs (
  id TEXT PRIMARY KEY,
  data_space_id TEXT NOT NULL REFERENCES data_spaces(id) ON DELETE CASCADE,
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
  duration_ms INTEGER,
  created_at TEXT NOT NULL
);
```

## checkpoints

```sql
CREATE TABLE checkpoints (
  id TEXT PRIMARY KEY,
  data_space_id TEXT NOT NULL REFERENCES data_spaces(id) ON DELETE CASCADE,
  label TEXT,
  reason TEXT,
  source TEXT NOT NULL,
  before_state_json TEXT NOT NULL,
  after_state_json TEXT NOT NULL,
  operations_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
```

## ai_provider_sessions

```sql
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
  updated_at TEXT NOT NULL
);
```

