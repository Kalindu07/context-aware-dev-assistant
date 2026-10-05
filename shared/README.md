# Shared

Cross-cutting contracts used by both extensions and the backend.

## Purpose

Keep a single source of truth for event shape and shared constants so VS Code and browser capture produce the same format.

## Layout

| Path | Role |
|------|------|
| `event-schema/` | Canonical developer event JSON Schema |
| `schemas/` | Additional shared schema documents |
| `constants/` | Suggestion categories and application ids |

## Event fields (required)

- `event_id`
- `session_id`
- `timestamp`
- `application`
- `event_type`
- `context_category`
- `metadata` (sanitised only)

See `event-schema/developer-event.schema.json`.
