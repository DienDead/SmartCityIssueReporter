-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('pothole','garbage','streetlight','water-logging','other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  auto_categorized BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geom geometry(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS reports_geom_gix ON reports USING GIST (geom);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at);
CREATE INDEX IF NOT EXISTS reports_category_idx ON reports (category);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
