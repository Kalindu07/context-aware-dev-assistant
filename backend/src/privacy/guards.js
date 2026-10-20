/**
 * Defence-in-depth privacy checks for inbound events.
 *
 * These heuristics are conservative and incomplete. They do not guarantee
 * detection of all secrets or sensitive content. Primary redaction belongs
 * in the capture-layer extensions. Rejected payload contents must never be logged.
 */

export const ALLOWED_METADATA_KEYS = new Set([
  "language",
  "file_extension",
  "host_category",
  "path_hash",
  "host_hash",
]);

const FORBIDDEN_METADATA_KEYS = new Set([
  "code",
  "source",
  "source_code",
  "content",
  "password",
  "passwd",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "cookies",
  "form_value",
  "form_values",
  "page_html",
  "html",
  "raw_url",
  "url",
  "uri",
  "href",
  "path",
  "filepath",
  "file_path",
  "absolute_path",
]);

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z\-_]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /\b(password|passwd|secret|api[_-]?key)\s*[:=]\s*\S+/i,
];

const URL_PATTERN = /\bhttps?:\/\/[^\s]+/i;
const WINDOWS_PATH_PATTERN = /[A-Za-z]:\\[^\s]+/;
const UNIX_ABS_PATH_PATTERN = /(?<![\w])\/[\w.\-]+(?:\/[\w.\-]+)+/;
const MULTILINE_CODEISH = /.*\n.*\n.*\n/s;

const MAX_METADATA_VALUE_LENGTH = 200;
const MAX_METADATA_TOTAL_CHARS = 800;

export class PrivacyViolation extends Error {
  constructor(message) {
    super(message);
    this.name = "PrivacyViolation";
  }
}

export function validateMetadataPrivacy(metadata) {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new PrivacyViolation("metadata must be an object");
  }

  const keys = Object.keys(metadata);
  const unknown = keys.filter((key) => !ALLOWED_METADATA_KEYS.has(key)).sort();
  if (unknown.length > 0) {
    throw new PrivacyViolation(
      `metadata contains keys outside the allow-list: ${unknown.join(", ")}`,
    );
  }

  const forbidden = keys.filter((key) => FORBIDDEN_METADATA_KEYS.has(key)).sort();
  if (forbidden.length > 0) {
    throw new PrivacyViolation(
      `metadata contains prohibited keys: ${forbidden.join(", ")}`,
    );
  }

  let totalChars = 0;
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (!["string", "number", "boolean"].includes(typeof value)) {
      throw new PrivacyViolation(
        `metadata.${key} must be a primitive string/number/boolean`,
      );
    }
    const text = String(value);
    totalChars += text.length;
    if (text.length > MAX_METADATA_VALUE_LENGTH) {
      throw new PrivacyViolation(
        `metadata.${key} exceeds maximum allowed length`,
      );
    }
    if (MULTILINE_CODEISH.test(text)) {
      throw new PrivacyViolation(
        `metadata.${key} looks like multi-line source content`,
      );
    }
    if (URL_PATTERN.test(text)) {
      throw new PrivacyViolation(`metadata.${key} must not contain full URLs`);
    }
    if (WINDOWS_PATH_PATTERN.test(text) || UNIX_ABS_PATH_PATTERN.test(text)) {
      throw new PrivacyViolation(
        `metadata.${key} must not contain absolute filesystem paths`,
      );
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) {
        throw new PrivacyViolation(
          `metadata.${key} matches a prohibited secret-like pattern`,
        );
      }
    }
  }

  if (totalChars > MAX_METADATA_TOTAL_CHARS) {
    throw new PrivacyViolation("metadata payload is too large");
  }
}

export function assertPrivacyStorageConfigAllowed(config) {
  if (
    config.storeRawSourceCode ||
    config.storePasswordsOrTokens ||
    config.storeSensitiveBrowserData
  ) {
    throw new PrivacyViolation(
      "server privacy configuration forbids storing events while " +
        "STORE_RAW_SOURCE_CODE / STORE_PASSWORDS_OR_TOKENS / " +
        "STORE_SENSITIVE_BROWSER_DATA is enabled",
    );
  }
}
