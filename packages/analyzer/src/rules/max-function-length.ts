import { SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

export const maxFunctionLengthRule: AnalysisRule = {
  name: "max-function-length",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    const functions = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    for (const functionNode of functions) {
      const startLine = functionNode.getStartLineNumber();

      const endLine = functionNode.getEndLineNumber();

      const length = endLine - startLine + 1;

      if (length > config.maxFunctionLength) {
        issues.push({
          rule: this.name,

          message:
            `Function is ${length} lines long. ` +
            `Maximum recommended length is ${config.maxFunctionLength} lines.`,

          suggestion:
            "Split the function into smaller functions, each responsible for a single task.",

          line: startLine,
          severity: "medium",
        });
      }
    }

    return issues;
  },
};
