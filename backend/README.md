# Backend / Orchestrator

Local-first FastAPI service that receives sanitised events, stores them in SQLite, runs context processing, and coordinates suggestion decisions.

## Purpose

Runtime orchestration only. Keep offline ML experiments in `/ml` and RAG pipelines in `/rag`.

## Layout

| Path | Role |
|------|------|
| `app/api/` | HTTP endpoints |
| `app/context/` | Runtime feature extraction / context processing |
| `app/database/` | SQLite local event store |
| `app/models/` | Loaders for exported inference artefacts |
| `app/services/` | Decision layer, timing heuristic hook, suggestion orchestration |
| `app/schemas/` | Pydantic schemas |
| `app/privacy/` | Defence-in-depth validation of incoming events |
| `app/utils/` | Shared helpers |
| `tests/` | Backend tests |

## Privacy

- Accept only events matching `/shared/event-schema`
- Reject payloads that look like raw source, secrets, or sensitive browser data
- Bind to localhost by default (see `.env.example`)

## Status

Package layout and config only — no business logic yet.
