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
  private closurePath?: string;

  constructor() {}

  public get initialized() {
    return !!this.depsMap;
  }

  public initialize(root: string | undefined, closurePath: string | undefined, depsPaths: string[] | undefined) {
    this.findDepsJS(root, closurePath, depsPaths);
  }

  private findDepsJS(root: string | undefined, closurePath: string | undefined, depsPaths: string[] | undefined) {
    if (!root || !closurePath || !depsPaths || !depsPaths.length) return;

    this.closurePath = path.resolve(root, closurePath);

    depsPaths.forEach((deps) => {
      const depsJsAbsolutePath = path.isAbsolute(deps) ? deps : path.resolve(root, deps);

      if (!fs.existsSync(depsJsAbsolutePath)) return;

      const depsMap = this.parseDepsJS(depsJsAbsolutePath, closurePath);

      this.depsMap = {
        fileMap: {
          ...(this.depsMap?.fileMap || {}),
          ...depsMap.fileMap,
        },
        moduleMap: {
          ...(this.depsMap?.moduleMap || {}),
          ...depsMap.moduleMap,
        },
      };
    });
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
        const file = path.resolve(this.closurePath!, relativeFile);

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
