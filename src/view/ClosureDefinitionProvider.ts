import {
  CancellationToken,
  Definition,
  DefinitionLink,
  DefinitionProvider,
  Position,
  ProviderResult,
  TextDocument,
} from "vscode";
import * as ts from "typescript";
import * as tsutils from "tsutils";
import * as path from "path";

export class ClosureDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | DefinitionLink[]> {
    const offset = document.offsetAt(position);

    const source = ts.createSourceFile(
      path.basename(document.fileName),
      document.getText(),
      ts.ScriptTarget.ES2022
    );

    const node = tsutils.getTokenAtPosition(source, offset);

    console.log(node);

    return null;
  }
}
