PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date_text TEXT,
  weekday TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, day_number)
);

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  reviews TEXT,
  note TEXT,
  lat REAL,
  lng REAL,
  coord_source TEXT,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plan_items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'poi',
  title TEXT NOT NULL,
  category TEXT,
  time_text TEXT,
  memo TEXT,
  lat REAL,
  lng REAL,
  sort_order INTEGER NOT NULL,
  locked INTEGER NOT NULL DEFAULT 0,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  label TEXT,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  before_plan_json TEXT NOT NULL,
  after_plan_json TEXT NOT NULL,
  operations_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_edit_runs (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  provider TEXT,
  model TEXT,
  user_message TEXT NOT NULL,
  ai_message TEXT,
  operations_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'proposed',
  error TEXT,
  checkpoint_id TEXT REFERENCES checkpoints(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_days_plan_order ON trip_days(plan_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_plan_items_day_order ON plan_items(day_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_plan_items_place ON plan_items(place_id);
CREATE INDEX IF NOT EXISTS idx_places_name ON places(name);
CREATE INDEX IF NOT EXISTS idx_checkpoints_plan_created ON checkpoints(plan_id, created_at DESC);
