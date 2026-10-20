import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildTestApp } from "./helpers.js";

describe("consent and sessions", () => {
  const { app } = buildTestApp();
  after(() => app.closeDatabase());

  it("creates consent and session without bootstrap", async () => {
    const consent = await request(app).post("/consent").send({
      participant_pseudo_id: "user-abc",
      scope: "ide+browser",
    });
    assert.equal(consent.status, 201);
    assert.equal(consent.body.active, true);

    const session = await request(app).post("/sessions").send({
      application: "vscode",
      consent_id: consent.body.consent_id,
    });
    assert.equal(session.status, 201);
    assert.equal(session.body.consent_id, consent.body.consent_id);
    assert.equal(session.body.bootstrap_used, false);
  });

  it("supports development consent bootstrap", async () => {
    const res = await request(app).post("/sessions").send({
      application: "browser",
      bootstrap_consent: true,
      participant_pseudo_id: "dev-user",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.bootstrap_used, true);
    assert.ok(res.body.consent_id);
    assert.ok(res.body.session_id);
  });

  it("rejects sessions for inactive consent", async () => {
    const consent = await request(app).post("/consent").send({
      participant_pseudo_id: "user-xyz",
      scope: "ide",
    });
    assert.equal(consent.status, 201);
    assert.equal(app.locals.repo.revokeConsent(consent.body.consent_id), true);

    const session = await request(app).post("/sessions").send({
      application: "vscode",
      consent_id: consent.body.consent_id,
    });
    assert.equal(session.status, 403);
    assert.match(session.body.detail, /inactive/i);
  });
});

describe("production bootstrap restriction", () => {
  const { app } = buildTestApp({
    appEnv: "production",
    allowBootstrap: false,
  });
  after(() => app.closeDatabase());

  it("disables bootstrap outside development", async () => {
    const res = await request(app).post("/sessions").send({
      application: "vscode",
      bootstrap_consent: true,
      participant_pseudo_id: "dev-user",
    });
    assert.equal(res.status, 403);
    assert.match(res.body.detail, /bootstrap is disabled/i);
  });
});
