import { SyntaxKind } from "ts-morph";
import type { AnalysisRule, CodeIssue } from "../types.js";

const MAX_FUNCTION_LINES = 50;

export const maxFunctionLengthRule: AnalysisRule = {
  name: "max-function-length",

  analyze(sourceFile) {
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

      if (length > MAX_FUNCTION_LINES) {
        issues.push({
          rule: this.name,
          message: `Function is ${length} lines long. Maximum recommended length is ${MAX_FUNCTION_LINES} lines.`,
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
