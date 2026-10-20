import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildTestApp } from "./helpers.js";

describe("GET /health", () => {
  const { app } = buildTestApp();
  after(() => app.closeDatabase());

  it("returns ok status and db ok", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.db, "ok");
    assert.equal(res.body.env, "development");
    assert.ok(res.body.app);
  });
});
