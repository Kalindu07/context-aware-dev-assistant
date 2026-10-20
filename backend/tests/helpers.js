import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

export function makeTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cada-backend-"));
  return path.join(dir, "test-events.db");
}

export function buildTestApp({
  appEnv = "development",
  allowBootstrap = true,
  databasePath = makeTempDbPath(),
} = {}) {
  const config = loadConfig({
    APP_NAME: "context-aware-dev-assistant",
    APP_ENV: appEnv,
    APP_HOST: "127.0.0.1",
    APP_PORT: "8000",
    DATABASE_PATH: databasePath,
    ALLOW_DEV_CONSENT_BOOTSTRAP: allowBootstrap ? "true" : "false",
    STORE_RAW_SOURCE_CODE: "false",
    STORE_PASSWORDS_OR_TOKENS: "false",
    STORE_SENSITIVE_BROWSER_DATA: "false",
  });
  const app = createApp({ config, databasePath });
  return { app, config, databasePath };
}

export async function bootstrapSession(app, application = "vscode") {
  const response = await request(app).post("/sessions").send({
    application,
    bootstrap_consent: true,
    participant_pseudo_id: "test-participant",
    scope: "ide+browser",
  });
  if (response.status !== 201) {
    throw new Error(`bootstrap failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

export function sampleEvent(sessionId, eventId = "evt-1") {
  return {
    event_id: eventId || randomUUID(),
    session_id: sessionId,
    timestamp: "2026-10-18T12:00:00Z",
    application: "vscode",
    event_type: "file_open",
    context_category: "editor",
    metadata: {
      language: "python",
      file_extension: ".py",
    },
  };
}
