import {
  CancellationToken,
  Definition,
  DefinitionLink,
  DefinitionProvider,
  Location,
  Position,
  ProviderResult,
  TextDocument,
  Uri,
} from "vscode";
import * as ts from "typescript";
import * as tsutils from "tsutils";
import * as path from "path";
import { deps } from "./Deps";

export class ClosureDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    if (!deps.hasFile(document.fileName)) return null;

    const offset = document.offsetAt(position);

    const source = ts.createSourceFile(
      path.basename(document.fileName),
      document.getText(),
      ts.ScriptTarget.ES2022,
      true
    );

    const node = tsutils.getAstNodeAtPosition(source, offset);

    if (node && node.kind === ts.SyntaxKind.Identifier) {
      return this.findMatchedPropertyAccessExpression(node, document);
    }

    return null;
  }

  private findMatchedPropertyAccessExpression(
    node: ts.Node,
    document: TextDocument
  ): ProviderResult<Definition | DefinitionLink[]> | null {
    // find to parent
    if (node.kind === ts.SyntaxKind.Identifier) {
      return this.findMatchedPropertyAccessExpression(node.parent, document);
    }

    if (node.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return null;
    }

    // find from deps
    const moduleName = node.getText();
    const findResult = deps.findModule(moduleName, document);

    if (!findResult) return null;

    const position = deps.findModulePosition([moduleName, findResult.findedModule], findResult.moduleFile);

    return new Location(Uri.file(findResult.moduleFile), position);
  }
}
