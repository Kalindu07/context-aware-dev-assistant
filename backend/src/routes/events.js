import { Router } from "express";
import {
  assertPrivacyStorageConfigAllowed,
  PrivacyViolation,
  validateMetadataPrivacy,
} from "../privacy/guards.js";
import {
  EventSchemaValidationError,
  validateDeveloperEvent,
} from "../validation/eventSchema.js";
import { DuplicateEventError } from "../db/repository.js";

const TOP_LEVEL_KEYS = new Set([
  "event_id",
  "session_id",
  "timestamp",
  "application",
  "event_type",
  "context_category",
  "metadata",
]);

export function createEventsRouter() {
  const router = Router();

  router.post("/events", (req, res) => {
    const repo = req.app.locals.repo;
    const config = req.app.locals.config;
    const body = req.body;

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ detail: "request body must be a JSON object" });
    }

    // Reject unknown top-level fields before schema validation.
    const unknownTop = Object.keys(body).filter((k) => !TOP_LEVEL_KEYS.has(k));
    if (unknownTop.length > 0) {
      console.info(
        "event_rejected",
        "reason=unknown_top_level",
        `session_id=${body.session_id || "n/a"}`,
      );
      return res.status(422).json({
        detail: `unknown top-level fields: ${unknownTop.sort().join(", ")}`,
      });
    }

    try {
      validateDeveloperEvent(body);
    } catch (err) {
      if (err instanceof EventSchemaValidationError) {
        console.info(
          "event_rejected",
          "reason=schema",
          `session_id=${body.session_id || "n/a"}`,
        );
        return res.status(422).json({ detail: err.message });
      }
      throw err;
    }

    try {
      assertPrivacyStorageConfigAllowed(config);
      validateMetadataPrivacy(body.metadata);
    } catch (err) {
      if (err instanceof PrivacyViolation) {
        console.info(
          "event_rejected",
          "reason=privacy",
          `session_id=${body.session_id || "n/a"}`,
          `event_id=${body.event_id || "n/a"}`,
        );
        return res.status(422).json({ detail: err.message });
      }
      throw err;
    }

    const session = repo.getSession(body.session_id);
    if (!session) {
      console.info(
        "event_rejected",
        "reason=unknown_session",
        `session_id=${body.session_id}`,
      );
      return res.status(403).json({
        detail:
          "session_id is unknown; create a session with active consent first",
      });
    }
    if (!repo.sessionHasActiveConsent(body.session_id)) {
      console.info(
        "event_rejected",
        "reason=inactive_consent",
        `session_id=${body.session_id}`,
      );
      return res.status(403).json({
        detail: "session does not have active consent",
      });
    }

    try {
      repo.insertEvent({
        eventId: body.event_id,
        sessionId: body.session_id,
        timestamp: body.timestamp,
        application: body.application,
        eventType: body.event_type,
        contextCategory: body.context_category,
        metadata: body.metadata,
      });
    } catch (err) {
      if (err instanceof DuplicateEventError) {
        console.info(
          "event_rejected",
          "reason=duplicate",
          `event_id=${body.event_id}`,
        );
        return res.status(409).json({ detail: "event_id already exists" });
      }
      throw err;
    }

    console.info(
      "event_stored",
      body.event_id,
      body.session_id,
      body.application,
    );
    return res.status(201).json({ event_id: body.event_id, stored: true });
  });

  return router;
}
