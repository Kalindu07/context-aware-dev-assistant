import { Router } from "express";
import { randomUUID } from "node:crypto";

export function createSessionsRouter() {
  const router = Router();

  router.post("/consent", (req, res) => {
    const repo = req.app.locals.repo;
    const body = req.body || {};

    const participantPseudoId = body.participant_pseudo_id;
    const scope = body.scope || "ide+browser";
    const consentId = body.consent_id || randomUUID();

    if (!participantPseudoId || typeof participantPseudoId !== "string") {
      return res
        .status(400)
        .json({ detail: "participant_pseudo_id is required" });
    }
    if (typeof scope !== "string" || scope.length < 1) {
      return res.status(400).json({ detail: "scope must be a non-empty string" });
    }
    if (repo.getConsent(consentId)) {
      return res.status(409).json({ detail: "consent_id already exists" });
    }

    const record = repo.createConsent({
      consentId,
      participantPseudoId,
      scope,
    });
    console.info("consent_created", record.consent_id, record.scope);
    return res.status(201).json({
      consent_id: record.consent_id,
      participant_pseudo_id: record.participant_pseudo_id,
      scope: record.scope,
      granted_at: record.granted_at,
      active: record.active,
    });
  });

  router.post("/sessions", (req, res) => {
    const repo = req.app.locals.repo;
    const config = req.app.locals.config;
    const body = req.body || {};

    const application = body.application;
    if (!["vscode", "browser", "mixed"].includes(application)) {
      return res.status(400).json({
        detail: "application must be one of: vscode, browser, mixed",
      });
    }

    let consentId = body.consent_id || null;
    let bootstrapUsed = false;

    if (body.bootstrap_consent === true) {
      if (!config.devConsentBootstrapEnabled) {
        return res.status(403).json({
          detail:
            "consent bootstrap is disabled (requires APP_ENV=development and ALLOW_DEV_CONSENT_BOOTSTRAP=true)",
        });
      }
      if (
        !body.participant_pseudo_id ||
        typeof body.participant_pseudo_id !== "string"
      ) {
        return res.status(400).json({
          detail: "participant_pseudo_id is required when bootstrap_consent=true",
        });
      }
      consentId = randomUUID();
      repo.createConsent({
        consentId,
        participantPseudoId: body.participant_pseudo_id,
        scope: body.scope || "ide+browser",
      });
      bootstrapUsed = true;
      console.info("dev_consent_bootstrap", consentId);
    } else {
      if (!consentId || typeof consentId !== "string") {
        return res.status(400).json({
          detail: "consent_id is required unless bootstrap_consent=true",
        });
      }
      const consent = repo.getConsent(consentId);
      if (!consent) {
        return res.status(404).json({ detail: "consent_id not found" });
      }
      if (!consent.active) {
        return res.status(403).json({
          detail: "consent is inactive; create a new consent record",
        });
      }
    }

    const sessionId = body.session_id || randomUUID();
    if (repo.getSession(sessionId)) {
      return res.status(409).json({ detail: "session_id already exists" });
    }

    const record = repo.createSession({
      sessionId,
      consentId,
      application,
    });
    console.info(
      "session_created",
      record.session_id,
      record.consent_id,
      `bootstrap=${bootstrapUsed}`,
    );
    return res.status(201).json({
      session_id: record.session_id,
      consent_id: record.consent_id,
      application: record.application,
      started_at: record.started_at,
      bootstrap_used: bootstrapUsed,
    });
  });

  return router;
}
