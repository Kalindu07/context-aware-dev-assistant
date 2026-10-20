# context-aware-dev-assistant

A Personalized, Privacy-Preserving Cross-Application Proactive AI Assistant for Software Development

Local-first Final Year Project monorepo. Sprint 1 provides a Node.js + Express local event ingest API with SQLite. AI models, RAG, LLM generation, and extension collectors are not implemented yet.

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
| Backend / Orchestrator | Node.js + Express |
| Database | SQLite (`better-sqlite3`) |
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
| `backend/` | Local Express orchestrator + SQLite event store |
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

Backend (Sprint 1):

```bash
cd backend
copy .env.example .env
npm install
npm start
npm test
```

Other packages remain scaffold-only until their implementation phase:

- `vscode-extension/package.json`
- `browser-extension/package.json`
- `suggestion-ui/package.json`
- `docker-compose.yml` (placeholders only)

## Licence / academic use

Final Year Project codebase — local-first and privacy-preserving by design.
