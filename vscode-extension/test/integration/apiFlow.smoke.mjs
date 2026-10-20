/**
 * API-level integration smoke (NOT a VS Code Extension Host test).
 * Simulates the extension's consent → session → event flow against a live
 * local backend, then inspects SQLite rows for sensitive leakage.
 *
 * Usage (from repo root, with backend deps installed):
 *   node vscode-extension/test/integration/apiFlow.smoke.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BACKEND_ROOT = path.join(REPO_ROOT, "backend");
const require = createRequire(path.join(BACKEND_ROOT, "package.json"));
const Database = require("better-sqlite3");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cada-s2-smoke-"));
const dbPath = path.join(tmpDir, "smoke.db");
const port = 8765;
const baseUrl = `http://127.0.0.1:${port}`;

function hashPath(fsPath, secret) {
  const normalised = fsPath.replace(/\\/g, "/").replace(/^([A-Za-z]):\//, (_, d) => `${d.toLowerCase()}:/`);
  return createHmac("sha256", secret).update(normalised, "utf8").digest("hex");
}

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("backend health timeout");
}

async function main() {
  const child = spawn(
    process.execPath,
    ["src/index.js"],
    {
      cwd: BACKEND_ROOT,
      env: {
        ...process.env,
        APP_ENV: "development",
        APP_HOST: "127.0.0.1",
        APP_PORT: String(port),
        DATABASE_PATH: dbPath,
        ALLOW_DEV_CONSENT_BOOTSTRAP: "false",
        STORE_RAW_SOURCE_CODE: "false",
        STORE_PASSWORDS_OR_TOKENS: "false",
        STORE_SENSITIVE_BROWSER_DATA: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let serverLog = "";
  child.stdout.on("data", (d) => {
    serverLog += d.toString();
  });
  child.stderr.on("data", (d) => {
    serverLog += d.toString();
  });

  try {
    await waitForHealth();

    // --- Enable path (extension-equivalent, no bootstrap) ---
    const participant = randomUUID();
    const consentRes = await fetch(`${baseUrl}/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_pseudo_id: participant,
        scope: "ide",
      }),
    });
    if (!consentRes.ok) throw new Error(`consent failed ${consentRes.status}`);
    const consent = await consentRes.json();

    const sessionId = randomUUID();
    const sessionRes = await fetch(`${baseUrl}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application: "vscode",
        consent_id: consent.consent_id,
        session_id: sessionId,
      }),
    });
    if (!sessionRes.ok) throw new Error(`session failed ${sessionRes.status}`);

    const secret = randomBytes(32).toString("hex");
    const rawPath = "C:\\Users\\Ada\\secret-project\\main.py";
    const pathHash = hashPath(rawPath, secret);
    const eventId = randomUUID();

    const eventBody = {
      event_id: eventId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      application: "vscode",
      event_type: "file_open",
      context_category: "editor",
      metadata: {
        language: "python",
        file_extension: ".py",
        path_hash: pathHash,
      },
    };

    const eventRes = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventBody),
    });
    if (!eventRes.ok) {
      throw new Error(`event failed ${eventRes.status}`);
    }

    // --- "Disable" simulation: do not send further; verify count stays 1 ---
    const afterDisableProbe = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...eventBody,
        event_id: randomUUID(),
        event_type: "document_edit",
      }),
    });
    // Still would succeed if we posted — this only proves API accepts.
    // True disable is host-side; we instead verify DB contents of first event
    // and that a raw-path payload would be rejected.
    if (!afterDisableProbe.ok) {
      throw new Error("unexpected reject of second valid event");
    }

    const rejectPath = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: randomUUID(),
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        application: "vscode",
        event_type: "file_save",
        context_category: "editor",
        metadata: {
          language: "python",
          path_hash: rawPath, // deliberately wrong / unsafe
        },
      }),
    });
    // path_hash value looking like absolute path should fail privacy heuristics
    // (Windows path pattern). Expect 422.
    if (rejectPath.status !== 422) {
      throw new Error(
        `expected privacy reject for absolute path in metadata, got ${rejectPath.status}`,
      );
    }

    // Inspect DB
    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare("SELECT * FROM events").all();
    db.close();

    const joined = JSON.stringify(rows);
    if (joined.includes("secret-project") || joined.includes("C:\\\\Users") || joined.includes("C:/Users")) {
      throw new Error("SENSITIVE: raw path leaked into DB");
    }
    if (joined.includes("def ") || joined.includes("password=")) {
      throw new Error("SENSITIVE: source/secret-like content in DB");
    }
    const first = rows.find((r) => r.event_id === eventId);
    if (!first) throw new Error("stored event missing");
    const meta = JSON.parse(first.metadata_json);
    if (meta.path_hash !== pathHash) throw new Error("path_hash mismatch");
    if (meta.path_hash === rawPath) throw new Error("path_hash equals raw path");
    if (Object.keys(meta).some((k) => !["language", "file_extension", "path_hash", "host_category", "host_hash"].includes(k))) {
      throw new Error("unexpected metadata keys in DB");
    }

    // Server logs must not contain the raw path from our event body
    if (serverLog.includes("secret-project") || serverLog.includes(rawPath)) {
      throw new Error("SENSITIVE: raw path appeared in server logs");
    }

    console.log("SMOKE_OK", {
      events: rows.length,
      event_id: eventId,
      path_hash_prefix: pathHash.slice(0, 12),
      application: first.application,
    });
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error("SMOKE_FAIL", err.message);
  process.exit(1);
});
