-- Local-first event store (SQLite). Consent is linked via sessions, not event fields.

CREATE TABLE IF NOT EXISTS consent_records (
    consent_id TEXT PRIMARY KEY,
    participant_pseudo_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    granted_at TEXT NOT NULL,
    revoked_at TEXT,
    active INTEGER NOT NULL CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    consent_id TEXT NOT NULL,
    application TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    FOREIGN KEY (consent_id) REFERENCES consent_records (consent_id)
);

CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    application TEXT NOT NULL,
    event_type TEXT NOT NULL,
    context_category TEXT NOT NULL,
    metadata_json TEXT NOT NULL,
    received_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions (session_id)
);

CREATE INDEX IF NOT EXISTS idx_events_session_ts
    ON events (session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_sessions_consent
    ON sessions (consent_id);
