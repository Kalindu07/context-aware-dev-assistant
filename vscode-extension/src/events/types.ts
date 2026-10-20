/**
 * Local TypeScript contract aligned with:
 *   shared/event-schema/developer-event.schema.json
 *   shared/event-schema/developer-event.ts
 *
 * Runtime validation also happens on the backend (Ajv + metadata allow-list).
 */

export type Application = "vscode" | "browser";

export type ContextCategory =
  | "editor"
  | "debug"
  | "terminal"
  | "vcs"
  | "navigation"
  | "search"
  | "documentation"
  | "testing"
  | "idle"
  | "other";

/** Backend allow-list (stricter than schema additionalProperties). */
export type AllowedMetadataKey =
  | "language"
  | "file_extension"
  | "host_category"
  | "path_hash"
  | "host_hash";

export type EventMetadata = Partial<Record<AllowedMetadataKey, string>>;

export interface DeveloperEvent {
  event_id: string;
  session_id: string;
  timestamp: string;
  application: Application;
  event_type: string;
  context_category: ContextCategory;
  metadata: EventMetadata;
}

export type CaptureEventType =
  | "file_open"
  | "file_save"
  | "document_edit"
  | "debug_start"
  | "debug_end"
  | "terminal_open"
  | "terminal_close"
  | "task_start"
  | "task_end";
