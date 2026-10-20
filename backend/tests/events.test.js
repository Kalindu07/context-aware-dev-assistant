import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { bootstrapSession, buildTestApp, sampleEvent } from "./helpers.js";

describe("POST /events", () => {
  const { app } = buildTestApp();
  after(() => app.closeDatabase());

  it("stores a valid event", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-ok-1");
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { event_id: "evt-ok-1", stored: true });
  });

  it("rejects unknown top-level fields", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-extra");
    event.extra_field = "nope";
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
  });

  it("rejects missing required fields", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-missing");
    delete event.event_type;
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
  });

  it("rejects invalid application enum", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-app");
    event.application = "notepad";
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
  });

  it("rejects invalid context_category enum", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-cat");
    event.context_category = "gaming";
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
  });

  it("rejects unknown session", async () => {
    const event = sampleEvent("missing-session", "evt-no-session");
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 403);
    assert.match(res.body.detail, /unknown/i);
  });

  it("rejects inactive consent", async () => {
    const session = await bootstrapSession(app);
    assert.equal(app.locals.repo.revokeConsent(session.consent_id), true);
    const event = sampleEvent(session.session_id, "evt-inactive");
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 403);
    assert.match(res.body.detail, /active consent/i);
  });

  it("rejects duplicate event_id", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-dup");
    assert.equal((await request(app).post("/events").send(event)).status, 201);
    const again = await request(app).post("/events").send(event);
    assert.equal(again.status, 409);
    assert.match(again.body.detail, /already exists/i);
  });
});
