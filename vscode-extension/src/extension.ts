import * as vscode from "vscode";
import { CaptureController } from "./capture/captureController";

let controller: CaptureController | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  controller = new CaptureController(context);
  await controller.initializeFromState();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "contextAwareDevAssistant.enableCapture",
      async () => {
        await controller?.enableCapture();
      },
    ),
    vscode.commands.registerCommand(
      "contextAwareDevAssistant.disableCapture",
      async () => {
        await controller?.disableCapture();
      },
    ),
    vscode.commands.registerCommand(
      "contextAwareDevAssistant.toggleCapture",
      async () => {
        await controller?.toggleCapture();
      },
    ),
    {
      dispose: () => {
        controller?.dispose();
        controller = undefined;
      },
    },
  );
}

export function deactivate(): void {
  controller?.dispose();
  controller = undefined;
}
