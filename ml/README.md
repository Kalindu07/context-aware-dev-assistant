# Machine Learning

Offline experiments for task inference, feature engineering, timing heuristics, and model evaluation.

## Purpose

Separate from the production backend. Train and evaluate here; export artefacts for runtime loading later.

## Layout

| Path | Role |
|------|------|
| `data/raw/` | Sanitised event exports |
| `data/processed/` | Features / labels |
| `data/annotations/` | Human annotations |
| `features/` | Offline feature extraction |
| `task_inference/ide/` | IDE-only baseline |
| `task_inference/browser/` | Browser-only model |
| `task_inference/fusion/` | IDE + Browser late fusion |
| `timing/` | Boundary-based timing heuristic (no learned classifier yet) |
| `evaluation/` | Offline ML metrics / scripts |
| `notebooks/` | Exploratory analysis |
| `models/` | Exported weights / pickles (gitignored binaries) |

## Planned models

1. **IDE-only baseline** — task state from IDE features
2. **Browser-only model** — task state from browser features
3. **Late-fusion model** — combine IDE + browser outputs

## Timing

Initial timing decisions use a **boundary-based heuristic** (`timing/boundary_heuristic.py`). A learned timing classifier is intentionally out of scope for now.

## Status

Placeholders only — no trained models or fake weights.
