# Sprint 1 requirements — backend foundation (Node.js)

Status: implemented (local-first Express + SQLite event store).

## Goals

1. Express backend bound to `127.0.0.1` by default.
2. SQLite persistence for consent records, sessions, and developer events (`better-sqlite3`).
3. Endpoints: `GET /health`, `POST /consent`, `POST /sessions`, `POST /events`.
4. Validate events against `shared/event-schema/developer-event.schema.json` (Ajv + ajv-formats).
5. Defence-in-depth privacy checks with an explicit metadata allow-list.
6. Require active consent (via session linkage) before storing events.
7. Automated tests with Node.js `node:test` + `supertest`.
8. Documented local-development consent/session bootstrap.

## Must-have requirements (Sprint 1)

| ID | Requirement | Verification |
|----|-------------|--------------|
| FR-M1 (partial) | Accept schema-conformant IDE/browser events into a local store | `POST /events` + tests |
| NFR-P1 (partial) | No raw code/secrets stored; privacy flags enforced | privacy tests + guards |
| NFR-R1 (partial) | Tests run against a temporary DB with deterministic setup | test helpers |
| Sprint-1-A | Health check reports app + DB status | `GET /health` |
| Sprint-1-B | Sessions require active consent | `POST /sessions` + 403 cases |
| Sprint-1-C | Duplicate `event_id` rejected safely | HTTP 409 |

## Consent model

Consent is **not** embedded as required fields on every event. Linkage:

```
consent_records (active) ← sessions.consent_id ← events.session_id
```

Events without a known session, or whose session consent is inactive, are rejected with HTTP 403. They are never silently discarded.

## Local-development bootstrap

When `APP_ENV=development` **and** `ALLOW_DEV_CONSENT_BOOTSTRAP=true`:

```http
POST /sessions
{
  "application": "vscode",
  "bootstrap_consent": true,
  "participant_pseudo_id": "dev-user",
  "scope": "ide+browser"
}
```

This creates a consent record and session together. The shortcut is disabled in production configuration.

Preferred non-shortcut flow (always available):

1. `POST /consent`
2. `POST /sessions` with `consent_id`
3. `POST /events` with that `session_id`

## Privacy rules (backend)

- Reject unknown top-level event fields.
- Metadata allow-list only: `language`, `file_extension`, `host_category`, `path_hash`, `host_hash`.
- Reject full URLs, absolute paths, secret-like patterns, and multi-line code-like values.
- Heuristic secret detection is **conservative and incomplete** — it does not guarantee full protection.
- Rejected payload contents are never logged.

## Stack decision

| Concern | Choice |
|---------|--------|
| Runtime backend | Node.js + Express (ES modules) |
| Database | SQLite via `better-sqlite3` |
| Schema validation | Ajv + `ajv-formats` against shared JSON Schema |
| Tests | `node:test` + `supertest` |
| Offline ML / RAG | Remain Python under `/ml` and `/rag` |

## Out of scope for Sprint 1

- VS Code / browser collectors
- ML task inference / timing models
- RAG / Ollama
- Suggestion UI
- Cloud services
