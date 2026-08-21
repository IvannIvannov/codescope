import { SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

export const noConsoleRule: AnalysisRule = {
  name: "no-console",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    if (!config.noConsole) {
      return issues;
    }

    const propertyAccessExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.PropertyAccessExpression,
    );

    for (const expression of propertyAccessExpressions) {
      const expressionText = expression.getExpression().getText();

      if (expressionText !== "console") {
        continue;
      }

      const position = sourceFile.getLineAndColumnAtPos(expression.getStart());

      issues.push({
        rule: this.name,
        message: "Avoid leaving console statements in production code.",
        suggestion:
          "Remove the console statement or replace it with a dedicated logging solution.",
        line: position.line,
        column: position.column,
        snippet: expression.getText(),
        severity: "low",
      });
    }

    return issues;
  },
};
