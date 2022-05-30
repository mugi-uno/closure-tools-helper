import { ClosureDepsProvider } from "./view/ClosureDepsProvider";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const closureDepsProvider = new ClosureDepsProvider(rootPath);
  vscode.window.registerTreeDataProvider(
    "closureDepsView",
    closureDepsProvider
  );

  closureDepsProvider.findDepsJS();

  // let disposable = vscode.commands.registerCommand(
  //   "closure-tools-helper.helloWorld",
  //   () => {
  //     vscode.window.showInformationMessage(
  //       "Hello World from closure-tools-helper!"
  //     );
  //   }
  // );

  // context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
