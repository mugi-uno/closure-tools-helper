import { ClosureDefinitionProvider } from "./view/ClosureDefinitionProvider";
import { ClosureInheritsViewProvider } from "./view/ClosureInheritsViewProvider";
import * as vscode from "vscode";
import { deps } from "./view/Deps";

export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  deps.initialize(
    rootPath,
    vscode.workspace.getConfiguration("closuretoolshelper").get("closurePath"),
    vscode.workspace.getConfiguration("closuretoolshelper").get<string[] | undefined>("depsPaths")
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("closureToolsHelperInheritsView", new ClosureInheritsViewProvider(rootPath))
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

  vscode.window.onDidChangeTextEditorSelection((event) => {
    const editor = vscode.window.activeTextEditor;

    console.log(event.selections[0].active);
    console.log(event.selections[0].end);
  });

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
