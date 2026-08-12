CREATE TABLE IF NOT EXISTS registration_rate_limits (
  client_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (client_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_registration_rate_limits_updated_at
ON registration_rate_limits (updated_at);
