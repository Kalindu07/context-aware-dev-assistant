import * as vscode from "vscode";
import { fileExtensionOf, hashPath } from "../privacy/pathHash";
import type { Collector, EmitFn } from "./types";

export class EditorCollector implements Collector {
  private disposables: vscode.Disposable[] = [];
  private readonly editLastSent = new Map<string, number>();
  private active = false;

  constructor(
    private readonly emit: EmitFn,
    private readonly getInstallSecret: () => string | undefined,
    private readonly editThrottleMs: number,
  ) {}

  start(): void {
    if (this.active) {
      return;
    }
    this.active = true;

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        if (!this.active || doc.uri.scheme !== "file") {
          return;
        }
        this.emitFileEvent("file_open", doc);
      }),
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!this.active || doc.uri.scheme !== "file") {
          return;
        }
        this.emitFileEvent("file_save", doc);
      }),
      vscode.workspace.onDidChangeTextDocument((change) => {
        if (!this.active || change.document.uri.scheme !== "file") {
          return;
        }
        // Record that an edit occurred — never include text content.
        if (change.contentChanges.length === 0) {
          return;
        }
        const key = change.document.uri.toString();
        const now = Date.now();
        const last = this.editLastSent.get(key) ?? 0;
        if (now - last < this.editThrottleMs) {
          return;
        }
        this.editLastSent.set(key, now);
        this.emitFileEvent("document_edit", change.document);
      }),
    );
  }

  stop(): void {
    this.active = false;
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
    this.editLastSent.clear();
  }

  dispose(): void {
    this.stop();
  }

  private emitFileEvent(
    eventType: "file_open" | "file_save" | "document_edit",
    doc: vscode.TextDocument,
  ): void {
    const secret = this.getInstallSecret();
    if (!secret) {
      return;
    }
    const fsPath = doc.uri.fsPath;
    const metadata: Record<string, unknown> = {
      language: doc.languageId,
      path_hash: hashPath(fsPath, secret),
    };
    const ext = fileExtensionOf(fsPath);
    if (ext) {
      metadata.file_extension = ext;
    }
    this.emit(eventType, metadata);
  }
}
