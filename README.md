# context-aware-dev-assistant

A Personalized, Privacy-Preserving Cross-Application Proactive AI Assistant for Software Development

Local-first Final Year Project monorepo. This repository currently contains **folder structure and configuration scaffolds only** — no AI models, RAG, LLM, or business logic implementations yet.

## Architecture

```
Developer
    ↓
VS Code Extension + Browser Extension
    ↓
Privacy-aware Context Capture
    ↓
Local Event Store (SQLite)
    ↓
Context Processing / Feature Extraction
    ↓
Separate IDE Task Model + Browser Task Model
    ↓
Late Fusion Task-State Model
    ↓
Suggestion Decision Layer
    ├── Timing Decision (boundary-based heuristic initially)
    └── Suggestion Type
    ↓
Personalised Memory + RAG
    ↓
Suggestion Generator
    ↓
Explainable Suggestion UI
    ↓
Developer Feedback
    ↓
Evaluation
```

## Technology stack

| Layer | Stack |
|-------|--------|
| VS Code Extension | TypeScript + VS Code Extension API |
| Browser Extension | TypeScript + Chrome Extension Manifest V3 |
| Backend / Orchestrator | Python + FastAPI |
| Database | SQLite |
| Machine Learning | Python + scikit-learn (later) |
| RAG / vector store | ChromaDB (later) |
| Embeddings | sentence-transformers (later) |
| Local LLM | Ollama (later) |
| Suggestion UI | React (later) |

## Repository layout

| Directory | Purpose |
|-----------|---------|
| `vscode-extension/` | IDE context capture + privacy filtering |
| `browser-extension/` | Browser context capture + privacy filtering |
| `backend/` | Local FastAPI orchestrator + SQLite event store |
| `ml/` | Offline task inference, timing heuristic, experiments |
| `rag/` | Personalised memory + retrieval (separate from ML) |
| `suggestion-ui/` | Explainable suggestion front-end (React later) |
| `shared/` | Shared event schema and constants |
| `evaluation/` | Studies, metrics, reports (separate from code) |
| `docs/` | Architecture, research, privacy, evaluation docs |
| `scripts/` | Utility scripts |

## Design constraints

1. Modular architecture — do not mix VS Code and browser code.
2. Shared event schema in `shared/event-schema/` for both extensions.
3. Privacy filtering at the capture layer (`*/src/privacy/`).
4. ML experiments stay in `/ml`; runtime orchestration in `/backend`.
5. RAG stays in `/rag`, separate from task inference and timing.
6. Evaluation stays in `/evaluation`.
7. Timing starts as a **boundary-based heuristic** (no learned classifier yet).
8. Task inference supports IDE-only, browser-only, and late-fusion paths.
9. Suggestion categories: debugging, testing, documentation/knowledge.
10. Never store raw source code, passwords, tokens, or unnecessary sensitive browser data.

## Getting started (later)

Do **not** install dependencies until the corresponding implementation phase. Config stubs:

- `backend/requirements.txt` + `backend/.env.example`
- `vscode-extension/package.json`
- `browser-extension/package.json`
- `suggestion-ui/package.json`
- `docker-compose.yml` (placeholders only)

## Licence / academic use

Final Year Project codebase — local-first and privacy-preserving by design.
