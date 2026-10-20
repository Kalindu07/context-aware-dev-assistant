import * as vscode from "vscode";
import type { Collector, EmitFn } from "./types";

/**
 * Task start/end only — no task names, commands, or args (may contain paths/secrets).
 */
export class TaskCollector implements Collector {
  private disposables: vscode.Disposable[] = [];
  private active = false;

  constructor(private readonly emit: EmitFn) {}

  start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.disposables.push(
      vscode.tasks.onDidStartTask(() => {
        if (!this.active) {
          return;
        }
        this.emit("task_start", {});
      }),
      vscode.tasks.onDidEndTask(() => {
        if (!this.active) {
          return;
        }
        this.emit("task_end", {});
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
