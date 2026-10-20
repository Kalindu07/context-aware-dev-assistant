import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BackendApiError,
  createBackendClient,
} from "../../src/api/backendClient";
import { buildDeveloperEvent } from "../../src/events/builder";

describe("backend client", () => {
  it("posts consent, session, and events with expected contracts", async () => {
    const calls: Array<{ url: string; body?: unknown }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, body });
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ok", db: "ok" }), {
          status: 200,
        });
      }
      if (url.endsWith("/consent")) {
        return new Response(
          JSON.stringify({
            consent_id: "c1",
            participant_pseudo_id: body.participant_pseudo_id,
            scope: body.scope,
            granted_at: "2026-10-20T12:00:00Z",
            active: true,
          }),
          { status: 201 },
        );
      }
      if (url.endsWith("/sessions")) {
        assert.equal(body.bootstrap_consent, undefined);
        assert.equal(body.consent_id, "c1");
        assert.equal(body.application, "vscode");
        return new Response(
          JSON.stringify({
            session_id: "s1",
            consent_id: "c1",
            application: "vscode",
            started_at: "2026-10-20T12:00:00Z",
            bootstrap_used: false,
          }),
          { status: 201 },
        );
      }
      if (url.endsWith("/events")) {
        return new Response(
          JSON.stringify({ event_id: body.event_id, stored: true }),
          { status: 201 },
        );
      }
      return new Response("missing", { status: 404 });
    };

    const client = createBackendClient({
      baseUrl: "http://127.0.0.1:8000",
      timeoutMs: 2000,
      fetchImpl,
    });

    await client.health();
    const consent = await client.createConsent({
      participant_pseudo_id: "p-1",
      scope: "ide",
    });
    const session = await client.createSession({
      application: "vscode",
      consent_id: consent.consent_id,
    });
    const event = buildDeveloperEvent({
      sessionId: session.session_id,
      eventType: "file_open",
      metadata: { language: "python", file_extension: ".py", path_hash: "h" },
    });
    const stored = await client.postEvent(event);
    assert.equal(stored.stored, true);
    assert.equal(calls.length, 4);
  });

  it("surfaces non-2xx as BackendApiError without crashing", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ detail: "nope" }), { status: 503 });
    const client = createBackendClient({
      baseUrl: "http://127.0.0.1:8000",
      timeoutMs: 1000,
      fetchImpl,
    });
    await assert.rejects(
      () => client.health(),
      (err: unknown) =>
        err instanceof BackendApiError && err.status === 503,
    );
  });

  it("does not use bootstrap unless createSessionWithDevBootstrap is called", async () => {
    let sawBootstrap = false;
    const fetchImpl: typeof fetch = async (_input, init) => {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.bootstrap_consent === true) {
        sawBootstrap = true;
      }
      return new Response(
        JSON.stringify({
          session_id: "s",
          consent_id: "c",
          application: "vscode",
          started_at: "2026-10-20T12:00:00Z",
          bootstrap_used: Boolean(body.bootstrap_consent),
        }),
        { status: 201 },
      );
    };
    const client = createBackendClient({
      baseUrl: "http://127.0.0.1:8000",
      timeoutMs: 1000,
      fetchImpl,
    });
    await client.createSession({ application: "vscode", consent_id: "c" });
    assert.equal(sawBootstrap, false);
  });
});
