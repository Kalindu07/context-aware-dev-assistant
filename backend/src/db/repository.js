export class DuplicateEventError extends Error {
  constructor(eventId) {
    super(`Duplicate event_id: ${eventId}`);
    this.name = "DuplicateEventError";
    this.eventId = eventId;
  }
}

function utcNowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function createRepository(db) {
  const insertConsent = db.prepare(`
    INSERT INTO consent_records (
      consent_id, participant_pseudo_id, scope, granted_at, revoked_at, active
    ) VALUES (@consent_id, @participant_pseudo_id, @scope, @granted_at, NULL, 1)
  `);

  const selectConsent = db.prepare(`
    SELECT consent_id, participant_pseudo_id, scope, granted_at, revoked_at, active
    FROM consent_records
    WHERE consent_id = ?
  `);

  const revokeConsentStmt = db.prepare(`
    UPDATE consent_records
    SET active = 0, revoked_at = ?
    WHERE consent_id = ? AND active = 1
  `);

  const insertSession = db.prepare(`
    INSERT INTO sessions (
      session_id, consent_id, application, started_at, ended_at
    ) VALUES (@session_id, @consent_id, @application, @started_at, NULL)
  `);

  const selectSession = db.prepare(`
    SELECT session_id, consent_id, application, started_at, ended_at
    FROM sessions
    WHERE session_id = ?
  `);

  const selectActiveConsentForSession = db.prepare(`
    SELECT c.active AS active
    FROM sessions s
    JOIN consent_records c ON c.consent_id = s.consent_id
    WHERE s.session_id = ?
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (
      event_id, session_id, timestamp, application,
      event_type, context_category, metadata_json, received_at
    ) VALUES (
      @event_id, @session_id, @timestamp, @application,
      @event_type, @context_category, @metadata_json, @received_at
    )
  `);

  return {
    createConsent({
      consentId,
      participantPseudoId,
      scope,
      grantedAt = utcNowIso(),
    }) {
      insertConsent.run({
        consent_id: consentId,
        participant_pseudo_id: participantPseudoId,
        scope,
        granted_at: grantedAt,
      });
      return {
        consent_id: consentId,
        participant_pseudo_id: participantPseudoId,
        scope,
        granted_at: grantedAt,
        revoked_at: null,
        active: true,
      };
    },

    getConsent(consentId) {
      const row = selectConsent.get(consentId);
      if (!row) return null;
      return {
        consent_id: row.consent_id,
        participant_pseudo_id: row.participant_pseudo_id,
        scope: row.scope,
        granted_at: row.granted_at,
        revoked_at: row.revoked_at,
        active: Boolean(row.active),
      };
    },

    revokeConsent(consentId) {
      const result = revokeConsentStmt.run(utcNowIso(), consentId);
      return result.changes > 0;
    },

    createSession({
      sessionId,
      consentId,
      application,
      startedAt = utcNowIso(),
    }) {
      insertSession.run({
        session_id: sessionId,
        consent_id: consentId,
        application,
        started_at: startedAt,
      });
      return {
        session_id: sessionId,
        consent_id: consentId,
        application,
        started_at: startedAt,
        ended_at: null,
      };
    },

    getSession(sessionId) {
      const row = selectSession.get(sessionId);
      if (!row) return null;
      return {
        session_id: row.session_id,
        consent_id: row.consent_id,
        application: row.application,
        started_at: row.started_at,
        ended_at: row.ended_at,
      };
    },

    sessionHasActiveConsent(sessionId) {
      const row = selectActiveConsentForSession.get(sessionId);
      if (!row) return false;
      return Boolean(row.active);
    },

    insertEvent({
      eventId,
      sessionId,
      timestamp,
      application,
      eventType,
      contextCategory,
      metadata,
    }) {
      try {
        insertEvent.run({
          event_id: eventId,
          session_id: sessionId,
          timestamp,
          application,
          event_type: eventType,
          context_category: contextCategory,
          metadata_json: JSON.stringify(metadata),
          received_at: utcNowIso(),
        });
      } catch (err) {
        if (err && err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
          throw new DuplicateEventError(eventId);
        }
        if (err && String(err.message).includes("UNIQUE constraint failed")) {
          throw new DuplicateEventError(eventId);
        }
        throw err;
      }
    },
  };
}
