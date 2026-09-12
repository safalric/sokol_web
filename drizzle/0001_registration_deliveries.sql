CREATE TABLE registration_deliveries (
  receipt_id TEXT PRIMARY KEY NOT NULL,
  fingerprint TEXT NOT NULL,
  event_name TEXT NOT NULL,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('trip', 'camp')),
  state TEXT NOT NULL DEFAULT 'awaiting' CHECK (state IN ('awaiting', 'ready', 'complete', 'manual', 'rejected', 'resolved')),
  payload TEXT,
  organizer_status TEXT NOT NULL DEFAULT 'pending' CHECK (organizer_status IN ('pending', 'sent', 'manual')),
  participant_status TEXT NOT NULL DEFAULT 'pending' CHECK (participant_status IN ('pending', 'sent', 'manual')),
  organizer_first_attempt INTEGER,
  participant_first_attempt INTEGER,
  organizer_attempts INTEGER NOT NULL DEFAULT 0,
  participant_attempts INTEGER NOT NULL DEFAULT 0,
  organizer_provider_id TEXT,
  participant_provider_id TEXT,
  created_at INTEGER NOT NULL,
  retain_until INTEGER NOT NULL,
  next_attempt INTEGER NOT NULL,
  lease_token TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  resolved_at INTEGER
);
--> statement-breakpoint
CREATE INDEX idx_registration_deliveries_due ON registration_deliveries (state, next_attempt);
--> statement-breakpoint
CREATE INDEX idx_registration_deliveries_retention ON registration_deliveries (retain_until);
