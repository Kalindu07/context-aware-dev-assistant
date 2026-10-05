/**
 * Shared suggestion category identifiers (TypeScript mirror).
 * Keep in sync with shared/constants/suggestion_categories.py
 */
export const SUGGESTION_CATEGORIES = [
  "debugging",
  "testing",
  "documentation_knowledge",
] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export const APPLICATIONS = ["vscode", "browser"] as const;

export type Application = (typeof APPLICATIONS)[number];
