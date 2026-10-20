# VS Code Extension (Sprint 2)

Privacy-preserving, **opt-in** IDE context capture for the Context-Aware Dev Assistant.

Events are filtered locally, then sent to the Sprint 1 Node.js backend (`http://127.0.0.1:8000` by default). Capture stays **off** until you explicitly enable it.

## Requirements

| Tool | Version |
|------|---------|
| Node.js | **20+** (LTS recommended) |
| npm | 10+ (bundled with Node 20) |
| VS Code | **1.85+** |
| Local backend | Sprint 1 Express API running |

## Layout

| Path | Role |
|------|------|
| `src/collectors/` | VS Code listeners (editor, debug, terminal, tasks) |
| `src/events/` | Shared-schema event construction |
| `src/privacy/` | Path hashing + metadata allow-list |
| `src/api/` | Backend HTTP client |
| `src/capture/` | Opt-in enable/disable orchestration |
| `src/storage/` | Pseudonymous ids + install secret |
| `src/ui/` | Status-bar indicator |
| `test/unit/` | Node.js unit tests (no VS Code host required) |

## Privacy & consent behaviour

- Capture is **disabled by default**. Nothing is sent until you run **CADA: Enable Context Capture**.
- **CADA: Disable Context Capture** (or the status-bar toggle) stops collectors and sending **immediately**.
- Status bar shows `CADA: capturing` when enabled, `CADA: off` otherwise.
- Participant id is a random UUID (not username/email/machine name).
- File paths are **HMAC-SHA256** hashed with a per-installation secret stored in `ExtensionContext.secrets`. Only `path_hash` is sent.
- Metadata allow-list matches the backend: `language`, `file_extension`, `host_category`, `path_hash`, `host_hash`.
- Never captures raw source, clipboard, terminal output/commands, task names, or absolute paths.
- Failed consent/session setup **does not** enable transmission.
- Backend failures while capturing are swallowed so editing is not blocked; payloads are not logged.

### Path hashing strategy

1. Generate a 32-byte random install secret (hex) once; store in VS Code SecretStorage.
2. Normalise path (`\` → `/`, lowercase Windows drive letter).
3. Compute `HMAC-SHA256(secret, normalisedPath)` → hex digest.
4. Send digest only as `metadata.path_hash`.

## Backend setup

```bash
cd backend
copy .env.example .env   # Windows
npm install
npm start                # http://127.0.0.1:8000
```

Extension settings (Defaults):

| Setting | Default |
|---------|---------|
| `contextAwareDevAssistant.backendBaseUrl` | `http://127.0.0.1:8000` |
| `contextAwareDevAssistant.requestTimeoutMs` | `5000` |
| `contextAwareDevAssistant.useDevConsentBootstrap` | `false` |

Normal flow (recommended): `POST /consent` → `POST /sessions` → `POST /events`.

`useDevConsentBootstrap` is **development only**. Leave it `false` unless the backend has `ALLOW_DEV_CONSENT_BOOTSTRAP=true` and you intentionally want the shortcut.

## Development / install in VS Code

```bash
cd vscode-extension
npm install
npm run compile
```

Then in VS Code:

1. Open this repo folder.
2. Run **Developer: Install Extension from Location…** and select `vscode-extension/`, **or** press F5 from a dedicated Extension Development Host launch (optional `.vscode/launch.json` not required for unit tests).
3. Start the local backend.
4. Command Palette → **CADA: Enable Context Capture**.

## Supported events

| Event type | Trigger | Metadata |
|------------|---------|----------|
| `file_open` | Text document opened (`file:` scheme) | language, file_extension, path_hash |
| `file_save` | Text document saved | language, file_extension, path_hash |
| `document_edit` | Text changed (throttled; **no text**) | language, file_extension, path_hash |
| `debug_start` / `debug_end` | Debug session lifecycle | _(none)_ |
| `terminal_open` / `terminal_close` | Terminal lifecycle (no contents) | _(none)_ |
| `task_start` / `task_end` | Task lifecycle (no names/commands) | _(none)_ |

All events use `application: "vscode"` and fields required by `shared/event-schema/developer-event.schema.json`.

## Tests

Unit tests use Node’s built-in test runner via `tsx` (no VS Code Extension Host):

```bash
cd vscode-extension
npm install
npm test
```

Covered:

- Capture defaults (opt-in / bootstrap off)
- Path hash does not embed raw paths
- Event payload matches shared contract + allow-list
- Absolute paths rejected by safety check
- API non-2xx / contract calls
- Session gate blocks send when consent/session init failed

## Known limitations

- Reload of the window clears the previous capture session binding; you must enable capture again (intentional consent clarity).
- Document edit events are throttled (default 5s per file) and do not reconstruct edit content.
- Terminal/task collectors intentionally omit names and commands (possible secret/path leakage).
- No offline event queue yet — if the backend is down after enable, individual posts fail quietly.
- Heuristic privacy checks on the backend remain defence-in-depth; the extension is the primary filter.
- Full `@vscode/test-electron` integration tests are not included (keep Sprint 2 maintainable).

## Status

Sprint 2: VS Code privacy-aware collector + local backend integration.
