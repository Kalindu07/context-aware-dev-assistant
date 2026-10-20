# Backend / Orchestrator

Local-first **Node.js + Express** service that receives sanitised developer events, stores them in SQLite, and enforces consent + privacy checks.

Sprint 1 implements the data plane only. Keep offline ML in `/ml` and RAG in `/rag`.

## Layout

| Path | Role |
|------|------|
| `src/routes/` | HTTP endpoints (`/health`, `/consent`, `/sessions`, `/events`) |
| `src/db/` | SQLite schema, connection, repository |
| `src/validation/` | Ajv validation against the shared JSON Schema |
| `src/privacy/` | Defence-in-depth metadata allow-list / secret heuristics |
| `src/config.js` | Environment settings (`127.0.0.1` by default) |
| `src/app.js` | Express app factory (used by tests) |
| `src/index.js` | Process entrypoint |
| `tests/` | Node.js built-in test runner + supertest |

## Privacy

- Accept only events matching `/shared/event-schema/developer-event.schema.json`
- Reject unknown top-level fields and non-allow-listed metadata keys
- Reject payloads that look like raw source, secrets, full URLs, or absolute paths
- Heuristic checks are **incomplete** — primary redaction remains in the extensions
- Bind to localhost by default (see `.env.example`)
- Never log rejected payload contents

## Setup

Requires **Node.js 20+**.

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
npm install
```

Ensure `APP_HOST=127.0.0.1` and enable bootstrap only for local development.

## Run

```bash
cd backend
npm start
# or: npm run dev   (auto-restart via node --watch)
```

API base: http://127.0.0.1:8000

## Test

```bash
cd backend
npm test
```

Tests use an isolated temporary SQLite file; they do not touch `./data/events.db`.

## Local-development consent bootstrap

**Enabled only when** `APP_ENV=development` **and** `ALLOW_DEV_CONSENT_BOOTSTRAP=true`.

```bash
curl -s -X POST http://127.0.0.1:8000/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"application\":\"vscode\",\"bootstrap_consent\":true,\"participant_pseudo_id\":\"dev-user\",\"scope\":\"ide+browser\"}"
```

Then ingest an event (replace `SESSION_ID`):

```bash
curl -s -X POST http://127.0.0.1:8000/events ^
  -H "Content-Type: application/json" ^
  -d "{\"event_id\":\"evt-demo-1\",\"session_id\":\"SESSION_ID\",\"timestamp\":\"2026-10-18T12:00:00Z\",\"application\":\"vscode\",\"event_type\":\"file_open\",\"context_category\":\"editor\",\"metadata\":{\"language\":\"python\",\"file_extension\":\".py\"}}"
```

### Non-bootstrap flow (preferred for realism)

```bash
curl -s -X POST http://127.0.0.1:8000/consent -H "Content-Type: application/json" -d "{\"participant_pseudo_id\":\"dev-user\",\"scope\":\"ide+browser\"}"

curl -s -X POST http://127.0.0.1:8000/sessions -H "Content-Type: application/json" -d "{\"application\":\"vscode\",\"consent_id\":\"CONSENT_ID\"}"
```

Set `APP_ENV=production` and/or `ALLOW_DEV_CONSENT_BOOTSTRAP=false` to disable the shortcut.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + DB ping |
| `POST` | `/consent` | Create opt-in consent record |
| `POST` | `/sessions` | Create session (optional dev bootstrap) |
| `POST` | `/events` | Validate + privacy-check + store event |

## Status

Sprint 1 (Node.js): health, consent/session bootstrap, event ingest, SQLite persistence, privacy guards, automated tests.
