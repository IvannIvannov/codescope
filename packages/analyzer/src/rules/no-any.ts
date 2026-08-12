import { SyntaxKind } from "ts-morph";
import type { AnalysisRule, CodeIssue } from "../types.js";

export const noAnyRule: AnalysisRule = {
  name: "no-any",

  analyze(sourceFile) {
    const issues: CodeIssue[] = [];

    const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);

    for (const anyKeyword of anyKeywords) {
      issues.push({
        rule: this.name,
        message: "Avoid using the 'any' type.",
        line: anyKeyword.getStartLineNumber(),
        severity: "medium",
      });
    }

    return issues;
  },
};
