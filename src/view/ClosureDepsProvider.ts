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

  findDepsJS() {
    const root = this.workspaceRoot;
    if (root === undefined) {
      return;
    }

    // const depsFiles = glob.sync("**/deps.js", {
    //   cwd: root,
    //   ignore: "**/node_modules/**/*",
    // });

    // const depsJS = depsFiles.find((file) => {
    //   const text = fs.readFileSync(path.resolve(root, file));
    //   return text.toString().includes("goog.");
    // });
    const depsJS = "closure/goog/deps.js";

    if (depsJS) {
      const depsJsAbsolutePath = path.resolve(root, depsJS);
      this.deps = new Deps(depsJsAbsolutePath);
      console.log(`detected deps.js: ${depsJsAbsolutePath}`);
    }
  }
}
