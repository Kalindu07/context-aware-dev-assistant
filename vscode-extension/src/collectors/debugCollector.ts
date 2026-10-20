import * as vscode from "vscode";
import type { Collector, EmitFn } from "./types";

export class DebugCollector implements Collector {
  private disposables: vscode.Disposable[] = [];
  private active = false;

  constructor(private readonly emit: EmitFn) {}

  start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.disposables.push(
      vscode.debug.onDidStartDebugSession(() => {
        if (!this.active) {
          return;
        }
        // No session name / cwd / program path — only the fact of start/end.
        this.emit("debug_start", {});
      }),
      vscode.debug.onDidTerminateDebugSession(() => {
        if (!this.active) {
          return;
        }
        this.emit("debug_end", {});
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
