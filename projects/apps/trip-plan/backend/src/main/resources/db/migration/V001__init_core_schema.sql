CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination_name TEXT,
  start_date TEXT,
  end_date TEXT,
  timezone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE trip_days (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date_text TEXT,
  weekday TEXT,
  title TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(trip_id, day_number)
);

CREATE TABLE places (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  reviews TEXT,
  note TEXT,
  address TEXT,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  lat REAL,
  lng REAL,
  status TEXT NOT NULL DEFAULT 'ready',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE itinerary_items (
  id TEXT PRIMARY KEY,
  trip_day_id TEXT NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  time_text TEXT,
  duration_minutes INTEGER,
  memo TEXT,
  lat REAL,
  lng REAL,
  sort_order INTEGER NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_trips_workspace ON trips(workspace_id);
CREATE INDEX idx_trip_days_trip_order ON trip_days(trip_id, sort_order);
CREATE INDEX idx_places_trip_name ON places(trip_id, name);
CREATE INDEX idx_items_day_order ON itinerary_items(trip_day_id, sort_order);
CREATE INDEX idx_items_place ON itinerary_items(place_id);
