import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { bootstrapSession, buildTestApp, sampleEvent } from "./helpers.js";

describe("privacy validation", () => {
  const { app } = buildTestApp();
  after(() => app.closeDatabase());

  it("rejects disallowed metadata keys", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-meta-key");
    event.metadata = { language: "python", url: "https://example.com/docs" };
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
    assert.match(res.body.detail, /allow-list|prohibited/i);
  });

  it("rejects secret-like metadata values", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-secret");
    event.metadata = { language: "password=supersecret123" };
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
    assert.match(res.body.detail, /secret-like/i);
  });

  it("rejects multi-line code-like metadata", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-code");
    event.metadata = {
      language: "def foo():\n    return 1\n\nprint(foo())\n",
    };
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
    assert.match(res.body.detail, /multi-line/i);
  });

  it("rejects full URLs in metadata", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-url");
    event.metadata = {
      host_category: "https://stackoverflow.com/questions/1",
    };
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 422);
    assert.match(res.body.detail, /URL/i);
  });

  it("allows safe metadata values", async () => {
    const session = await bootstrapSession(app);
    const event = sampleEvent(session.session_id, "evt-safe");
    event.metadata = {
      language: "typescript",
      file_extension: ".ts",
      host_category: "docs",
      path_hash: "a".repeat(64),
      host_hash: "b".repeat(64),
    };
    const res = await request(app).post("/events").send(event);
    assert.equal(res.status, 201);
  });
});
