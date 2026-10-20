import * as vscode from "vscode";

export class CaptureStatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.item.command = "contextAwareDevAssistant.toggleCapture";
    this.setEnabled(false);
    this.item.show();
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.item.text = "$(eye) CADA: capturing";
      this.item.tooltip =
        "Context-Aware Dev Assistant: capture enabled (click to toggle)";
      this.item.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else {
      this.item.text = "$(eye-closed) CADA: off";
      this.item.tooltip =
        "Context-Aware Dev Assistant: capture disabled (click to toggle)";
      this.item.backgroundColor = undefined;
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}
