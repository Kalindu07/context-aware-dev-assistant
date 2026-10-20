import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BACKEND_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(BACKEND_ROOT, "..");
export const EVENT_SCHEMA_PATH = path.join(
  REPO_ROOT,
  "shared",
  "event-schema",
  "developer-event.schema.json",
);

dotenv.config({ path: path.join(BACKEND_ROOT, ".env") });

function asBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function asPath(value, defaultPath) {
  if (!value || !String(value).trim()) {
    return defaultPath;
  }
  const candidate = path.resolve(String(value));
  // Relative paths resolve from backend root for stable local runs.
  if (!path.isAbsolute(String(value))) {
    return path.resolve(BACKEND_ROOT, String(value));
  }
  return candidate;
}

/**
 * Load settings. Pass `env` to override process.env (used by tests).
 */
export function loadConfig(env = process.env) {
  const appEnv = env.APP_ENV || "development";
  const allowBootstrap = asBool(env.ALLOW_DEV_CONSENT_BOOTSTRAP, true);
  const isDevelopment = String(appEnv).toLowerCase() === "development";

  return {
    appName: env.APP_NAME || "context-aware-dev-assistant",
    appEnv,
    appHost: env.APP_HOST || "127.0.0.1",
    appPort: Number.parseInt(env.APP_PORT || "8000", 10),
    databasePath: asPath(
      env.DATABASE_PATH,
      path.join(BACKEND_ROOT, "data", "events.db"),
    ),
    storeRawSourceCode: asBool(env.STORE_RAW_SOURCE_CODE, false),
    storePasswordsOrTokens: asBool(env.STORE_PASSWORDS_OR_TOKENS, false),
    storeSensitiveBrowserData: asBool(env.STORE_SENSITIVE_BROWSER_DATA, false),
    allowDevConsentBootstrap: allowBootstrap,
    isDevelopment,
    get devConsentBootstrapEnabled() {
      return isDevelopment && allowBootstrap;
    },
    get privacyStorageAllowed() {
      return !(
        this.storeRawSourceCode ||
        this.storePasswordsOrTokens ||
        this.storeSensitiveBrowserData
      );
    },
  };
}

export const config = loadConfig();
