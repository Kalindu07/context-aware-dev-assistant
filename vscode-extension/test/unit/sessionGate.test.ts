import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldCompleteSend, shouldSendEvents } from "../../src/capture/sessionGate";

describe("sessionGate", () => {
  it("blocks transmission when capture is disabled or session init failed", () => {
    assert.equal(
      shouldSendEvents({ transmitting: false, sessionId: undefined }),
      false,
    );
    assert.equal(
      shouldSendEvents({ transmitting: false, sessionId: "s1" }),
      false,
    );
    assert.equal(
      shouldSendEvents({ transmitting: true, sessionId: undefined }),
      false,
    );
  });

  it("allows transmission only with active transmitting session", () => {
    assert.equal(
      shouldSendEvents({ transmitting: true, sessionId: "s1" }),
      true,
    );
  });

  it("cancels in-flight sends when emit generation changes (disable)", () => {
    assert.equal(
      shouldCompleteSend({
        transmitting: true,
        sessionId: "s1",
        startedGeneration: 0,
        currentGeneration: 0,
      }),
      true,
    );
    assert.equal(
      shouldCompleteSend({
        transmitting: false,
        sessionId: undefined,
        startedGeneration: 0,
        currentGeneration: 1,
      }),
      false,
    );
    assert.equal(
      shouldCompleteSend({
        transmitting: true,
        sessionId: "s1",
        startedGeneration: 0,
        currentGeneration: 1,
      }),
      false,
    );
  });
});
