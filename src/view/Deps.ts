import * as fs from "fs";
import * as path from "path";
import { TextDocument } from "vscode";

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

export class Deps {
  private depsMap?: DepsMap;
  private depsDir?: string;

  constructor() {}

  public get initialized() {
    return !!this.depsDir && !!this.depsMap;
  }

  public initialize(workspaceRoot: string | undefined) {
    this.findDepsJS(workspaceRoot);
  }

  private findDepsJS(workspaceRoot: string | undefined) {
    const root = workspaceRoot;
    if (workspaceRoot === undefined) {
      return;
    }

    // const depsFiles = glob.sync("**/deps.js", {
    //   cwd: workspaceRoot,
    //   ignore: "**/node_modules/**/*",
    // });

    // const depsJS = depsFiles.find((file) => {
    //   const text = fs.readFileSync(path.resolve(workspaceRoot, file));
    //   return text.toString().includes("goog.");
    // });
    const depsJS = "closure/goog/deps.js";

    if (depsJS) {
      const depsJsAbsolutePath = path.resolve(workspaceRoot, depsJS);

      this.depsDir = path.dirname(depsJsAbsolutePath);
      this.depsMap = this.parseDepsJS(depsJsAbsolutePath);

      console.log(this.depsMap);
      console.log(`detected deps.js: ${depsJsAbsolutePath}`);
    }
  }

  private parseDepsJS(depsJsPath: string): DepsMap {
    const text = fs.readFileSync(depsJsPath);
    const lines = text.toString().split("\n");

    const depsMap: DepsMap = lines.reduce(
      (prev, line) => {
        let parsed;

        try {
          parsed = JSON.parse(
            line.replace("goog.addDependency", "").replace("(", "[").replace(");", "]").replace(/\'/g, '"')
          );
        } catch (e) {
          return prev;
        }

        const [relativeFile, provides, requires]: [string, string[], string[]] = parsed;
        const file = path.resolve(this.depsDir!, relativeFile);

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

  public hasFile(absoluteFilePath: string) {
    return !!this.depsMap?.fileMap[absoluteFilePath];
  }

  public findModule(moduleName: string, document: TextDocument): { moduleFile: string; findedModule: string } | null {
    const fileInfo = this.depsMap?.fileMap[document.fileName];
    if (!fileInfo) return null;

    const matchedRequireModule = fileInfo.requires.find((req) => req === moduleName);

    if (matchedRequireModule) {
      const moduleInfo = this.depsMap?.moduleMap[matchedRequireModule];

      if (moduleInfo?.file)
        return {
          moduleFile: moduleInfo.file,
          findedModule: moduleName,
        };
    }

    // search parent module
    const lastDotPos = moduleName.lastIndexOf(".");
    if (lastDotPos === -1) return null;

    return this.findModule(moduleName.substring(0, lastDotPos), document);
  }
}

export const deps = new Deps();
