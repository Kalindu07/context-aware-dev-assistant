import { createHmac, randomBytes } from "node:crypto";

/**
 * Path hashing strategy
 * ----------------------
 * - A per-installation secret is stored in ExtensionContext.secrets (never logged).
 * - Input path is normalised (lowercase drive letter on Windows, forward slashes).
 * - We compute HMAC-SHA256(secret, normalisedPath) and hex-encode it.
 * - Only the hex digest is sent as metadata.path_hash — never the raw path.
 *
 * This is privacy-preserving pseudonymisation, not encryption. Collisions are
 * theoretically possible; the goal is to avoid leaking absolute paths.
 */

export function generateInstallSecret(): string {
  return randomBytes(32).toString("hex");
}

export function normalisePathForHash(fsPath: string): string {
  let normalised = fsPath.replace(/\\/g, "/");
  // Lowercase Windows drive letter for stability across tools.
  if (/^[A-Za-z]:\//.test(normalised)) {
    normalised = normalised[0].toLowerCase() + normalised.slice(1);
  }
  return normalised;
}

export function hashPath(fsPath: string, installSecret: string): string {
  const normalised = normalisePathForHash(fsPath);
  return createHmac("sha256", installSecret).update(normalised, "utf8").digest("hex");
}

export function fileExtensionOf(fsPath: string): string | undefined {
  const normalised = fsPath.replace(/\\/g, "/");
  const base = normalised.split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    return undefined;
  }
  const ext = base.slice(dot).toLowerCase();
  // Guard: extensions should be short; never pass a full path fragment.
  if (ext.length > 16 || ext.includes("/") || ext.includes("\\")) {
    return undefined;
  }
  return ext;
}
