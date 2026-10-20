import { newId } from "../utils/ids";
import { nowIso } from "../utils/time";
import { filterMetadata } from "../privacy/allowlist";
import type {
  CaptureEventType,
  ContextCategory,
  DeveloperEvent,
  EventMetadata,
} from "./types";

const EVENT_CATEGORY: Record<CaptureEventType, ContextCategory> = {
  file_open: "editor",
  file_save: "editor",
  document_edit: "editor",
  debug_start: "debug",
  debug_end: "debug",
  terminal_open: "terminal",
  terminal_close: "terminal",
  task_start: "testing",
  task_end: "testing",
};

export function buildDeveloperEvent(input: {
  sessionId: string;
  eventType: CaptureEventType;
  metadata?: Record<string, unknown>;
  eventId?: string;
  timestamp?: string;
}): DeveloperEvent {
  const metadata: EventMetadata = filterMetadata(input.metadata ?? {});
  return {
    event_id: input.eventId ?? newId(),
    session_id: input.sessionId,
    timestamp: input.timestamp ?? nowIso(),
    application: "vscode",
    event_type: input.eventType,
    context_category: EVENT_CATEGORY[input.eventType],
    metadata,
  };
}

/** Lightweight local checks before send (backend still validates). */
export function assertSafeEventPayload(event: DeveloperEvent): void {
  const serialized = JSON.stringify(event);
  if (serialized.includes("-----BEGIN")) {
    throw new Error("event payload failed safety check");
  }
  for (const value of Object.values(event.metadata)) {
    if (typeof value !== "string") {
      continue;
    }
    if (/^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/Users/") || value.startsWith("/home/")) {
      throw new Error("event metadata must not contain absolute paths");
    }
    if (/^https?:\/\//i.test(value)) {
      throw new Error("event metadata must not contain URLs");
    }
  }
}
