import * as vscode from "vscode";
import {
  BackendApiError,
  createBackendClient,
  type BackendClient,
} from "../api/backendClient";
import { EditorCollector } from "../collectors/editorCollector";
import { DebugCollector } from "../collectors/debugCollector";
import { TerminalCollector } from "../collectors/terminalCollector";
import { TaskCollector } from "../collectors/taskCollector";
import type { Collector } from "../collectors/types";
import { readSettings } from "../config/settings";
import {
  assertSafeEventPayload,
  buildDeveloperEvent,
} from "../events/builder";
import type { CaptureEventType } from "../events/types";
import { IdentityStore } from "../storage/identityStore";
import { CaptureStatusBar } from "../ui/statusBar";
import { newId } from "../utils/ids";
import { shouldCompleteSend, shouldSendEvents } from "./sessionGate";

/**
 * Owns opt-in capture lifecycle, consent/session binding, and safe emit.
 * Capture remains off until enableCapture() succeeds.
 */
export class CaptureController {
  private readonly store: IdentityStore;
  private readonly statusBar: CaptureStatusBar;
  private collectors: Collector[] = [];
  private installSecret: string | undefined;
  private sessionId: string | undefined;
  private transmitting = false;
  private client: BackendClient | undefined;
  /** Bumped on disable/dispose to cancel in-flight async emits. */
  private emitGeneration = 0;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.store = new IdentityStore(context);
    this.statusBar = new CaptureStatusBar();
    context.subscriptions.push(this.statusBar);
  }

  isEnabled(): boolean {
    return this.transmitting && this.store.isCaptureEnabled();
  }

  async initializeFromState(): Promise<void> {
    this.statusBar.setEnabled(false);
    // Never auto-start collection on activate — user must enable explicitly
    // even if a previous session left captureEnabled=true in globalState.
    // Restore UI hint only; require re-enable to bind a fresh session safely.
    if (this.store.isCaptureEnabled()) {
      // Leave flag true but not transmitting until user confirms via enable,
      // OR auto-resume? Spec: "disabled by default until the user enables it"
      // and "Stopping capture must immediately stop". On reload, safer to
      // require explicit enable again for consent clarity.
      await this.store.setCaptureEnabled(false);
      await this.store.clearSessionBinding();
    }
  }

  async toggleCapture(): Promise<void> {
    if (this.isEnabled()) {
      await this.disableCapture();
    } else {
      await this.enableCapture();
    }
  }

  async enableCapture(): Promise<void> {
    const settings = readSettings();
    this.client = createBackendClient({
      baseUrl: settings.backendBaseUrl,
      timeoutMs: settings.requestTimeoutMs,
    });

    try {
      const health = await this.client.health();
      if (health.status !== "ok" && health.status !== "degraded") {
        throw new BackendApiError("backend health check failed");
      }

      this.installSecret = await this.store.getOrCreateInstallSecret();
      const participantPseudoId =
        await this.store.getOrCreateParticipantPseudoId();

      let consentId: string;
      let sessionId: string;

      if (settings.useDevConsentBootstrap) {
        // Explicit development-only setting — labelled in package.json.
        const session = await this.client.createSessionWithDevBootstrap({
          application: "vscode",
          participant_pseudo_id: participantPseudoId,
          scope: "ide",
          session_id: newId(),
        });
        consentId = session.consent_id;
        sessionId = session.session_id;
      } else {
        const consent = await this.client.createConsent({
          participant_pseudo_id: participantPseudoId,
          scope: "ide",
        });
        consentId = consent.consent_id;
        const session = await this.client.createSession({
          application: "vscode",
          consent_id: consentId,
          session_id: newId(),
        });
        sessionId = session.session_id;
      }

      await this.store.setConsentId(consentId);
      await this.store.setSessionId(sessionId);
      await this.store.setCaptureEnabled(true);

      this.sessionId = sessionId;
      this.transmitting = true;
      this.startCollectors(settings.editEventThrottleMs);
      this.statusBar.setEnabled(true);

      void vscode.window.showInformationMessage(
        "Context-Aware Dev Assistant: capture enabled (privacy-filtered events only).",
      );
    } catch (err) {
      this.transmitting = false;
      this.sessionId = undefined;
      this.stopCollectors();
      await this.store.setCaptureEnabled(false);
      await this.store.clearSessionBinding();
      this.statusBar.setEnabled(false);
      // Do not include request/response bodies in the message.
      const detail =
        err instanceof BackendApiError
          ? err.message
          : "could not initialise capture";
      void vscode.window.showErrorMessage(
        `Context-Aware Dev Assistant: capture not enabled (${detail}). Is the local backend running?`,
      );
    }
  }

  async disableCapture(): Promise<void> {
    // Stop collection and sending immediately (including in-flight emits).
    this.emitGeneration += 1;
    this.transmitting = false;
    this.sessionId = undefined;
    this.client = undefined;
    this.stopCollectors();
    await this.store.setCaptureEnabled(false);
    await this.store.clearSessionBinding();
    this.statusBar.setEnabled(false);
    void vscode.window.showInformationMessage(
      "Context-Aware Dev Assistant: capture disabled.",
    );
  }

  private startCollectors(editThrottleMs: number): void {
    this.stopCollectors();
    const emit = (eventType: CaptureEventType, metadata?: Record<string, unknown>) => {
      void this.safeEmit(eventType, metadata);
    };
    this.collectors = [
      new EditorCollector(emit, () => this.installSecret, editThrottleMs),
      new DebugCollector(emit),
      new TerminalCollector(emit),
      new TaskCollector(emit),
    ];
    for (const c of this.collectors) {
      c.start();
    }
  }

  private stopCollectors(): void {
    for (const c of this.collectors) {
      c.dispose();
    }
    this.collectors = [];
  }

  private async safeEmit(
    eventType: CaptureEventType,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const startedGeneration = this.emitGeneration;
    const sessionId = this.sessionId;
    const client = this.client;
    if (
      !shouldSendEvents({
        transmitting: this.transmitting,
        sessionId,
      }) ||
      !client ||
      !sessionId
    ) {
      return;
    }
    try {
      const event = buildDeveloperEvent({
        sessionId,
        eventType,
        metadata,
      });
      assertSafeEventPayload(event);
      // Re-check after building payload and before network I/O so disable()
      // during an in-flight emit does not complete the POST.
      if (
        !shouldCompleteSend({
          transmitting: this.transmitting,
          sessionId: this.sessionId,
          startedGeneration,
          currentGeneration: this.emitGeneration,
        }) ||
        this.client !== client
      ) {
        return;
      }
      await client.postEvent(event);
    } catch {
      // Swallow API failures — never crash the editor host.
      // Do not log event payloads or secrets.
    }
  }

  dispose(): void {
    this.emitGeneration += 1;
    this.transmitting = false;
    this.sessionId = undefined;
    this.client = undefined;
    this.stopCollectors();
  }
}
