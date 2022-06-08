import * as path from "path";
import * as fs from "fs";

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
        const file = path.resolve(this.depsDir, relativeFile);

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
