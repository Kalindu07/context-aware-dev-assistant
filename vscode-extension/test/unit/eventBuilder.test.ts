import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSafeEventPayload,
  buildDeveloperEvent,
} from "../../src/events/builder";

describe("event builder", () => {
  it("builds schema-shaped vscode events with allow-listed metadata only", () => {
    const event = buildDeveloperEvent({
      sessionId: "session-1",
      eventType: "file_open",
      eventId: "evt-1",
      timestamp: "2026-10-20T12:00:00.000Z",
      metadata: {
        language: "typescript",
        file_extension: ".ts",
        path_hash: "abc123",
        code: "should be stripped",
        path: "C:\\\\Users\\\\me\\\\file.ts",
        absolute_path: "/Users/me/file.ts",
      },
    });

    assert.deepEqual(event, {
      event_id: "evt-1",
      session_id: "session-1",
      timestamp: "2026-10-20T12:00:00.000Z",
      application: "vscode",
      event_type: "file_open",
      context_category: "editor",
      metadata: {
        language: "typescript",
        file_extension: ".ts",
        path_hash: "abc123",
      },
    });
    assert.equal("code" in event.metadata, false);
    assert.equal("path" in event.metadata, false);
  });

  it("rejects absolute paths in metadata via safety check", () => {
    const event = buildDeveloperEvent({
      sessionId: "session-1",
      eventType: "file_save",
      metadata: { language: "C:\\Users\\me\\a.py" },
    });
    assert.throws(() => assertSafeEventPayload(event), /absolute paths/i);
  });

  it("maps debug/terminal/task categories correctly", () => {
    assert.equal(
      buildDeveloperEvent({ sessionId: "s", eventType: "debug_start" })
        .context_category,
      "debug",
    );
    assert.equal(
      buildDeveloperEvent({ sessionId: "s", eventType: "terminal_open" })
        .context_category,
      "terminal",
    );
    assert.equal(
      buildDeveloperEvent({ sessionId: "s", eventType: "task_end" })
        .context_category,
      "testing",
    );
  });
});
