import type { DeveloperEvent } from "../events/types";

export interface ConsentResponse {
  consent_id: string;
  participant_pseudo_id: string;
  scope: string;
  granted_at: string;
  active: boolean;
}

export interface SessionResponse {
  session_id: string;
  consent_id: string;
  application: string;
  started_at: string;
  bootstrap_used: boolean;
}

export interface EventAccepted {
  event_id: string;
  stored: boolean;
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

export interface BackendClientOptions {
  baseUrl: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

async function requestJson<T>(
  options: BackendClientOptions,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetchImpl(joinUrl(options.baseUrl, path), {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      // Do not include response body (may echo validation details); status only.
      throw new BackendApiError(`backend HTTP ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof BackendApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new BackendApiError("backend request timed out");
    }
    throw new BackendApiError("backend unavailable");
  } finally {
    clearTimeout(timer);
  }
}

export function createBackendClient(options: BackendClientOptions) {
  return {
    async health(): Promise<{ status: string; db?: string }> {
      return requestJson(options, "/health", { method: "GET" });
    },

    async createConsent(input: {
      participant_pseudo_id: string;
      scope?: string;
      consent_id?: string;
    }): Promise<ConsentResponse> {
      return requestJson(options, "/consent", {
        method: "POST",
        body: JSON.stringify({
          participant_pseudo_id: input.participant_pseudo_id,
          scope: input.scope ?? "ide",
          ...(input.consent_id ? { consent_id: input.consent_id } : {}),
        }),
      });
    },

    async createSession(input: {
      application: "vscode" | "browser" | "mixed";
      consent_id: string;
      session_id?: string;
    }): Promise<SessionResponse> {
      return requestJson(options, "/sessions", {
        method: "POST",
        body: JSON.stringify({
          application: input.application,
          consent_id: input.consent_id,
          ...(input.session_id ? { session_id: input.session_id } : {}),
        }),
      });
    },

    /**
     * Development-only path. Callers must gate on an explicit setting.
     * Matches backend: bootstrap_consent + participant_pseudo_id.
     */
    async createSessionWithDevBootstrap(input: {
      application: "vscode" | "browser" | "mixed";
      participant_pseudo_id: string;
      scope?: string;
      session_id?: string;
    }): Promise<SessionResponse> {
      return requestJson(options, "/sessions", {
        method: "POST",
        body: JSON.stringify({
          application: input.application,
          bootstrap_consent: true,
          participant_pseudo_id: input.participant_pseudo_id,
          scope: input.scope ?? "ide",
          ...(input.session_id ? { session_id: input.session_id } : {}),
        }),
      });
    },

    async postEvent(event: DeveloperEvent): Promise<EventAccepted> {
      return requestJson(options, "/events", {
        method: "POST",
        body: JSON.stringify(event),
      });
    },
  };
}

export type BackendClient = ReturnType<typeof createBackendClient>;
