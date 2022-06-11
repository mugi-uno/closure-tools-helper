import * as path from "path";
import * as vscode from "vscode";
import { Dependency } from "./Dependency";
import { Deps } from "./Deps";

export class ClosureDepsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  deps: Deps | null = null;

  constructor(private workspaceRoot: string | undefined) {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem) {
    return Promise.resolve([
      new Dependency("foo", "bar", vscode.TreeItemCollapsibleState.None),
      new Dependency("foo", "bar", vscode.TreeItemCollapsibleState.None),
      new Dependency("foo", "bar", vscode.TreeItemCollapsibleState.None),
    ]);
  }
}
