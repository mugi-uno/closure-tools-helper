import * as vscode from "vscode";
import * as glob from "glob";
import * as fs from "fs";
import * as path from "path";

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

    const depsFiles = glob.sync("src/**/deps.js", {
      cwd: root,
      ignore: "**/node_modules/**/*",
    });

    const depsJS = depsFiles.find((file) => {
      const text = fs.readFileSync(path.resolve(root, file));
      return text.toString().includes("goog.");
    });

    if (depsJS) {
      const depsJsAbsolutePath = path.resolve(root, depsJS);
      this.deps = new Deps(depsJsAbsolutePath);
      console.log(`detected deps.js: ${depsJsAbsolutePath}`);
    }
  }
}

type DepsMap = {
  fileMap: {
    [key: string]: {
      provides: string[];
      requires: string[];
    };
  };
  moduleMap: {
    [key: string]: {
      file: string;
      requiredBy: string[];
    };
  };
};

class Deps {
  public readonly depsMap: DepsMap;
  public readonly depsDir: string;

  constructor(public readonly depsJsPath: string) {
    this.depsDir = path.dirname(depsJsPath);
    this.depsMap = this.parseDepsJS();

    console.log(this.depsMap);
  }

  private parseDepsJS(): DepsMap {
    const text = fs.readFileSync(this.depsJsPath);
    const lines = text.toString().split("\n");

    const depsMap: DepsMap = lines.reduce(
      (prev, line) => {
        let parsed;

        try {
          parsed = JSON.parse(
            line
              .replace("goog.addDependency", "")
              .replace("(", "[")
              .replace(");", "]")
              .replace(/\'/g, '"')
          );
        } catch (e) {
          return prev;
        }

        const [relativeFile, provides, requires]: [string, string[], string[]] =
          parsed;
        const file = path.resolve(path.dirname(this.depsDir), relativeFile);

        prev.fileMap[file] = {
          provides,
          requires,
        };

        provides.forEach((providedModule) => {
          prev.moduleMap[providedModule] = { file, requiredBy: [] };
        });

        prev.moduleMap;

        return prev;
      },
      {
        fileMap: {},
        moduleMap: {},
      } as DepsMap
    );

    // create requiredBy
    Object.keys(depsMap.fileMap).forEach((file) => {
      const requires = depsMap.fileMap[file].requires;
      requires.forEach((requireModule) => {
        const moduleValue = depsMap.moduleMap[requireModule];
        if (!moduleValue) {
          return;
        }
        moduleValue.requiredBy = [...moduleValue.requiredBy, file];
      });
    });

    return depsMap;
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = description;
  }
}
