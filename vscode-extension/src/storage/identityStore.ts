import type * as vscode from "vscode";
import { newId } from "../utils/ids";
import { generateInstallSecret } from "../privacy/pathHash";

const KEY_PARTICIPANT = "participantPseudoId";
const KEY_INSTALL_SECRET = "pathHashSecret";
const KEY_CONSENT_ID = "consentId";
const KEY_SESSION_ID = "sessionId";
const KEY_CAPTURE_ENABLED = "captureEnabled";

/**
 * Pseudonymous identity + install secret.
 * Never stores usernames, emails, or machine names.
 */
export class IdentityStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  isCaptureEnabled(): boolean {
    return this.context.globalState.get<boolean>(KEY_CAPTURE_ENABLED, false);
  }

  async setCaptureEnabled(enabled: boolean): Promise<void> {
    await this.context.globalState.update(KEY_CAPTURE_ENABLED, enabled);
  }

  async getOrCreateParticipantPseudoId(): Promise<string> {
    const existing = this.context.globalState.get<string>(KEY_PARTICIPANT);
    if (existing) {
      return existing;
    }
    const id = newId();
    await this.context.globalState.update(KEY_PARTICIPANT, id);
    return id;
  }

  async getOrCreateInstallSecret(): Promise<string> {
    const existing = await this.context.secrets.get(KEY_INSTALL_SECRET);
    if (existing) {
      return existing;
    }
    const secret = generateInstallSecret();
    await this.context.secrets.store(KEY_INSTALL_SECRET, secret);
    return secret;
  }

  getConsentId(): string | undefined {
    return this.context.globalState.get<string>(KEY_CONSENT_ID);
  }

  async setConsentId(consentId: string | undefined): Promise<void> {
    await this.context.globalState.update(KEY_CONSENT_ID, consentId);
  }

  getSessionId(): string | undefined {
    return this.context.globalState.get<string>(KEY_SESSION_ID);
  }

  async setSessionId(sessionId: string | undefined): Promise<void> {
    await this.context.globalState.update(KEY_SESSION_ID, sessionId);
  }

  async clearSessionBinding(): Promise<void> {
    await this.setConsentId(undefined);
    await this.setSessionId(undefined);
  }
}
