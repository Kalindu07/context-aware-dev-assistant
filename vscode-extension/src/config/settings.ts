import * as vscode from "vscode";

const SECTION = "contextAwareDevAssistant";

export interface ExtensionSettings {
  backendBaseUrl: string;
  requestTimeoutMs: number;
  /** DEV ONLY — never enable unless explicitly opted in. */
  useDevConsentBootstrap: boolean;
  editEventThrottleMs: number;
}

export function readSettings(): ExtensionSettings {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    backendBaseUrl: cfg.get<string>("backendBaseUrl", "http://127.0.0.1:8000"),
    requestTimeoutMs: cfg.get<number>("requestTimeoutMs", 5000),
    useDevConsentBootstrap: cfg.get<boolean>("useDevConsentBootstrap", false),
    editEventThrottleMs: cfg.get<number>("editEventThrottleMs", 5000),
  };
}
