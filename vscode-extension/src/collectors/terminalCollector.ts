import * as vscode from "vscode";
import type { Collector, EmitFn } from "./types";

/**
 * Captures only terminal open/close lifecycle.
 * Never captures terminal name contents that might include paths/secrets,
 * shell commands, or output.
 */
export class TerminalCollector implements Collector {
  private disposables: vscode.Disposable[] = [];
  private active = false;

  constructor(private readonly emit: EmitFn) {}

  start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.disposables.push(
      vscode.window.onDidOpenTerminal(() => {
        if (!this.active) {
          return;
        }
        this.emit("terminal_open", {});
      }),
      vscode.window.onDidCloseTerminal(() => {
        if (!this.active) {
          return;
        }
        this.emit("terminal_close", {});
      }),
    );
  }

  stop(): void {
    this.active = false;
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  dispose(): void {
    this.stop();
  }
}
