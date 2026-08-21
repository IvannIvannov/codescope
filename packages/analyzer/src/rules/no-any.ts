import { SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

export const noAnyRule: AnalysisRule = {
  name: "no-any",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    if (!config.noAny) {
      return issues;
    }

    const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);

    for (const anyKeyword of anyKeywords) {
      const position = sourceFile.getLineAndColumnAtPos(anyKeyword.getStart());

      issues.push({
        rule: this.name,
        message: "Avoid using the 'any' type.",
        suggestion:
          "Replace 'any' with a specific type. If the type is unknown, consider using 'unknown' and narrowing it before use.",
        line: position.line,
        column: position.column,
        snippet: anyKeyword.getText(),
        severity: "medium",
      });
    }

    return issues;
  },
};
