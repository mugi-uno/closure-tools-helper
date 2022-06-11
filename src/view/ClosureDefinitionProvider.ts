import * as tsutils from "tsutils";
import * as ts from "typescript";
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
import { findModulePosition, getAST } from "./ASTUtils";
import { deps } from "./Deps";

export class ClosureDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    if (!deps.hasFile(document.fileName)) return null;

    const offset = document.offsetAt(position);
    const source = getAST(document.fileName, document.getText());
    const node = tsutils.getAstNodeAtPosition(source, offset);

    return this.findModuleDeclaration(node, document) || this.findGoogProvide(node, document) || null;
  }

  private findModuleDeclaration(
    node: ts.Node | undefined,
    document: TextDocument
  ): ProviderResult<Definition | DefinitionLink[]> | null {
    if (!node) return null;

    // find to parent
    if (node.kind === ts.SyntaxKind.Identifier) {
      return this.findModuleDeclaration(node.parent, document);
    }

    if (node.kind !== ts.SyntaxKind.PropertyAccessExpression) {
      return null;
    }

    // find from deps
    const moduleName = node.getText();
    const findResult = deps.findModule(moduleName, document);

    if (!findResult) return null;

    const position = findModulePosition([moduleName, findResult.findedModule], findResult.moduleFile);

    return new Location(Uri.file(findResult.moduleFile), position);
  }

  private findGoogProvide(
    node: ts.Node | undefined,
    document: TextDocument
  ): ProviderResult<Definition | DefinitionLink[]> | null {
    if (!node) return null;

    if (node.kind === ts.SyntaxKind.CallExpression) {
      const propertyAccess = tsutils.getChildOfKind(node, ts.SyntaxKind.PropertyAccessExpression);
      const syntaxList = tsutils.getChildOfKind(node, ts.SyntaxKind.SyntaxList);

      if (propertyAccess && syntaxList && propertyAccess.getText() === "goog.require") {
        const moduleName = syntaxList.getText().replace(/[\'\"\`]/g, "");
        const findResult = deps.findModule(moduleName, document);
        if (findResult) {
          const position = findModulePosition([moduleName, findResult.findedModule], findResult.moduleFile);
          return new Location(Uri.file(findResult.moduleFile), position);
        }
      }
    }

    return this.findGoogProvide(node.parent, document);
  }
}
