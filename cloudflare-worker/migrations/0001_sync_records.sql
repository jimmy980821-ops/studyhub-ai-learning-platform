CREATE TABLE IF NOT EXISTS sync_records (
  sync_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS sync_records_updated_at_idx
  ON sync_records(updated_at);
