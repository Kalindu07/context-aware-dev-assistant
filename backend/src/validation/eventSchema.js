import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { EVENT_SCHEMA_PATH } from "../config.js";

export class EventSchemaValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EventSchemaValidationError";
  }
}

let cachedValidate;

function getValidator() {
  if (cachedValidate) {
    return cachedValidate;
  }
  if (!fs.existsSync(EVENT_SCHEMA_PATH)) {
    throw new Error(`Canonical event schema not found: ${EVENT_SCHEMA_PATH}`);
  }
  const schema = JSON.parse(fs.readFileSync(EVENT_SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({
    allErrors: false,
    strict: false,
  });
  addFormats(ajv);
  cachedValidate = ajv.compile(schema);
  return cachedValidate;
}

/**
 * Validate against shared/event-schema/developer-event.schema.json.
 * Error messages must not dump the full payload.
 */
export function validateDeveloperEvent(payload) {
  const validate = getValidator();
  const ok = validate(payload);
  if (ok) {
    return;
  }
  const err = validate.errors?.[0];
  const path = err?.instancePath || err?.schemaPath || "<root>";
  const keyword = err?.keyword || "invalid";
  throw new EventSchemaValidationError(
    `event failed canonical schema validation at '${path}': ${keyword}`,
  );
}
