import type { AllowedMetadataKey, EventMetadata } from "../events/types";

export const ALLOWED_METADATA_KEYS: ReadonlySet<AllowedMetadataKey> = new Set([
  "language",
  "file_extension",
  "host_category",
  "path_hash",
  "host_hash",
]);

const FORBIDDEN_KEYS = new Set([
  "code",
  "source",
  "source_code",
  "content",
  "password",
  "token",
  "secret",
  "path",
  "filepath",
  "file_path",
  "url",
  "absolute_path",
]);

/**
 * Keep only allow-listed primitive string metadata.
 * Never include raw source, paths, or secrets.
 */
export function filterMetadata(input: Record<string, unknown>): EventMetadata {
  const out: EventMetadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }
    if (!ALLOWED_METADATA_KEYS.has(key as AllowedMetadataKey)) {
      continue;
    }
    if (typeof value !== "string") {
      continue;
    }
    if (value.length === 0 || value.length > 200) {
      continue;
    }
    out[key as AllowedMetadataKey] = value;
  }
  return out;
}

export function assertNoAbsolutePath(value: string): boolean {
  if (/^[A-Za-z]:[\\/]/.test(value)) {
    return false;
  }
  if (value.startsWith("/") && value.includes("/") && value.length > 1) {
    // Unix absolute paths — reject if looks like a filesystem path
    if (/^\/(?:Users|home|var|tmp|etc|usr)\b/.test(value)) {
      return false;
    }
  }
  return !value.includes("\\");
}
