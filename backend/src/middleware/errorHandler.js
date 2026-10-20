import { PrivacyViolation } from "../privacy/guards.js";
import { EventSchemaValidationError } from "../validation/eventSchema.js";
import { DuplicateEventError } from "../db/repository.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ detail: "not found" });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof PrivacyViolation || err instanceof EventSchemaValidationError) {
    return res.status(422).json({ detail: err.message });
  }
  if (err instanceof DuplicateEventError) {
    return res.status(409).json({ detail: "event_id already exists" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ detail: "invalid JSON body" });
  }
  // express.json limit exceeded (body-parser PayloadTooLargeError)
  if (
    err?.type === "entity.too.large" ||
    err?.status === 413 ||
    err?.name === "PayloadTooLargeError"
  ) {
    return res.status(413).json({ detail: "request entity too large" });
  }
  // Never attach request bodies or secrets to logs.
  console.error("unhandled_error", err?.name || "Error", err?.message || "unknown");
  return res.status(500).json({ detail: "internal server error" });
}
