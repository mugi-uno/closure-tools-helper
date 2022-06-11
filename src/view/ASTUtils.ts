import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { Position } from "vscode";

export const getAST = (fileName: string, source: string) => {
  return ts.createSourceFile(path.basename(fileName), source, ts.ScriptTarget.ESNext, true);
};

export const findModulePosition = (moduleNames: string[], fileName: string): Position => {
  const code = fs.readFileSync(fileName).toString();
  const source = ts.createSourceFile(path.basename(fileName), code, ts.ScriptTarget.ES2022, true);

  for (const moduleName of moduleNames) {
    const moduleNode = findModuleNodeFromAST(moduleName, source);

    if (moduleNode) {
      const position = source.getLineAndCharacterOfPosition(moduleNode.getStart());
      return new Position(position.line, position.character);
    }
  }

  return new Position(0, 0);
};

export const findModuleNodeFromAST = (moduleName: string, node: ts.Node): ts.Node | null => {
  if (node.kind === ts.SyntaxKind.Identifier) return null;

  if (node.kind === ts.SyntaxKind.BinaryExpression) {
    const binaryExpression = node as ts.BinaryExpression;
    if (binaryExpression.left.getText() === moduleName) {
      return binaryExpression;
    }
  }

  const children = node.getChildren();
  for (const child of children) {
    const result = findModuleNodeFromAST(moduleName, child);
    if (result) return result;
  }

  return null;
};
