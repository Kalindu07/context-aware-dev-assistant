# Architecture notes

High-level data flow (local-first, privacy-preserving):

```
Developer
  → VS Code Extension + Browser Extension
  → Privacy-aware Context Capture
  → Local Event Store (SQLite)
  → Context Processing / Feature Extraction
  → IDE Task Model + Browser Task Model
  → Late Fusion Task-State Model
  → Suggestion Decision Layer (Timing + Suggestion Type)
  → Personalised Memory + RAG
  → Suggestion Generator
  → Explainable Suggestion UI
  → Developer Feedback
  → Evaluation
```

Design principles:
- Capture-site privacy filtering (extensions)
- Shared event schema across applications
- Runtime orchestrator: Node.js + Express + SQLite (`/backend`)
- ML experiments isolated in `/ml` (Python)
- RAG isolated in `/rag` (Python)
- Evaluation studies isolated in `/evaluation`
