Create a monorepo starter for a research prototype: a personalized, cross-application 
proactive developer assistant that combines IDE + browser context capture, a rule-based 
interruption-timing model, and a local retrieval-augmented suggestion engine.

Structure the repo as:

/vscode-extension
  - A minimal VS Code extension (TypeScript) that listens to file open/save/edit and 
    debug/run events, and writes locally timestamped, pseudonymised events (hashed file 
    paths, event type, timestamp) to a local JSONL event log. Include a config flag for 
    opt-in/opt-out capture and a status bar indicator showing capture state.

/browser-extension
  - A minimal Chrome/Firefox WebExtension (Manifest V3) that captures tab category/domain 
    (not full URLs or page content) and writes events in the same schema as the VS Code 
    extension, to a local file via native messaging or a local HTTP endpoint.

/core-service
  - A Python service (FastAPI) with three modules:
    1. ingestion/ - reads events from both extensions, validates against a shared JSON 
       schema (event_id, pid, session_id, ts, app, event_type, hashed_resource_id, category), 
       deduplicates, and writes to a local SQLite store.
    2. timing/ - implements three pluggable interruption-timing policies behind a common 
       interface: always-show, boundary-heuristic (e.g. post-commit/post-save), and a 
       simple adaptive rule using recent event cadence. Include a config to switch policy 
       at runtime for A/B evaluation.
    3. memory/ - a local vector store (e.g. Chroma or FAISS) that indexes past 
       suggestion/context items with a schema of {id, type, source_app, ts, 
       hashed_resource_id, task_label, summary, embedding, outcome}, and a retrieval 
       function that returns top-k relevant items for a given current context, used to 
       ground suggestions via template-based (not generative) rationale text.

/evaluation
  - A script/notebook scaffold for computing: task-inference accuracy/F1 against a small 
    labelled validation set, precision/recall/AUROC for accept-vs-dismiss timing outcomes, 
    and suggestion relevance summary stats. Include a config/seed-logging utility so every 
    run is reproducible (dataset version, split, seed, hyperparameters, metrics saved to 
    a run log).

/docs
  - A README per package explaining setup, the event schema, and how to run the ingestion 
    -> timing -> memory pipeline end to end on sample synthetic events (include a small 
    synthetic event generator for local testing only, clearly marked as not for evaluation 
    use).

Constraints:
- No cloud API calls or external LLM inference — everything local-first, on-device.
- No raw page content or file content ever leaves the local store.
- Keep each extension and the core service independently runnable and testable.
- Use TypeScript for extensions, Python 3.11+ with type hints for the core service.
- Add basic unit tests for the event schema validation, timing policy selection, and 
  memory retrieval ranking.

This is an academic final-year project prototype, not production software — prioritise 
clarity and modularity (so components can be disabled individually for ablation studies) 
over performance optimisation.
