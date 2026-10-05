# TypeScript mirror of the shared DeveloperEvent schema.
# Canonical definition: shared/event-schema/developer-event.schema.json
# Implementations should validate against the JSON Schema; this file is a typed reference only.

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

export interface DeveloperEventMetadata {
  language?: string;
  file_extension?: string;
  host_category?: string;
  [key: string]: unknown;
}

export interface DeveloperEvent {
  event_id: string;
  session_id: string;
  timestamp: string; // ISO-8601
  application: Application;
  event_type: string;
  context_category: ContextCategory;
  /** Sanitised only — never raw source, secrets, or sensitive browser data. */
  metadata: DeveloperEventMetadata;
}
