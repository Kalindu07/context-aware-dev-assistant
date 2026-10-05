# Browser Extension

Privacy-preserving browser context capture (Chrome Extension Manifest V3).

## Purpose

Collect development-related browsing signals (docs, VCS UIs, Q&A sites, etc.), apply privacy filtering **before** events leave the extension, and emit the same shared event format used by the VS Code extension.

## Layout

| Path | Role |
|------|------|
| `src/collectors/` | Tab / navigation / page-category collectors |
| `src/events/` | Event construction mapped to the shared schema |
| `src/privacy/` | Redaction at the capture layer |
| `src/storage/` | Optional local buffering |
| `src/utils/` | Extension-only helpers |
| `manifest.json` | Chrome MV3 manifest |

## Rules

- Do **not** mix VS Code-specific code here.
- Do **not** capture passwords, tokens, cookies, form field values, or full page HTML.
- Prefer coarse host categories over raw URLs with query secrets.

## Status

Scaffold only — service worker and collectors not implemented yet.
