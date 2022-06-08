import { ClosureDefinitionProvider } from "./view/ClosureDefinitionProvider";
import { ClosureDepsProvider } from "./view/ClosureDepsProvider";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const closureDepsProvider = new ClosureDepsProvider(rootPath);

  closureDepsProvider.findDepsJS();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "closureDepsView",
      closureDepsProvider
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      [
        { scheme: "file", language: "javascript" },
        { scheme: "file", language: "typescript" },
      ],
      new ClosureDefinitionProvider()
    )
  );

  // let disposable = vscode.commands.registerCommand(
  //   "closure-tools-helper.helloWorld",
  //   () => {
  //     vscode.window.showInformationMessage(
  //       "Hello World from closure-tools-helper!"
  //     );
  //   }
  // );
}

// this method is called when your extension is deactivated
export function deactivate() {}
