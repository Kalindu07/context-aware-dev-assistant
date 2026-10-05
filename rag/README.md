# RAG & Personalised Memory

Retrieval-augmented generation and personalised memory, kept separate from task inference and timing.

## Purpose

Ingest developer knowledge (docs, notes, prior feedback summaries), embed locally, retrieve relevant context for suggestion generation.

## Layout

| Path | Role |
|------|------|
| `ingestion/` | Document / memory ingestion |
| `retrieval/` | ChromaDB query interfaces |
| `embeddings/` | sentence-transformers helpers |
| `memory/` | Personalised memory abstractions |
| `prompts/` | Prompt templates for local LLM (Ollama later) |

## Stack (later)

- Vector store: ChromaDB
- Embeddings: sentence-transformers
- Generation: Ollama (local)

## Rules

- Do not implement fake RAG or dummy vector indexes here
- Keep this module independent of `/ml/task_inference` and `/ml/timing`

## Status

Directory scaffold only.
