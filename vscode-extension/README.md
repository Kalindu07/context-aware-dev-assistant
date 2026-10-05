# VS Code Extension

Privacy-preserving IDE context capture for the Context-Aware Dev Assistant.

## Purpose

Collect developer activity signals inside VS Code, apply privacy filtering **before** events leave the extension, and emit events that conform to the shared schema in `/shared/event-schema`.

## Layout

| Path | Role |
|------|------|
| `src/collectors/` | VS Code API listeners (editor, debug, terminal, etc.) |
| `src/events/` | Event construction mapped to the shared schema |
| `src/privacy/` | Redaction / allow-list filtering at the capture layer |
| `src/storage/` | Optional local buffering before sending to the backend |
| `src/utils/` | Extension-only helpers |
| `test/` | Extension tests |

## Rules

- Do **not** mix browser-specific code here.
- Do **not** store raw source code, passwords, or tokens.
- Keep privacy logic close to collectors.

## Status

Scaffold only — collectors and activation logic not implemented yet.
