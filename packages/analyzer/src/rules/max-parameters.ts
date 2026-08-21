import { SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

export const maxParametersRule: AnalysisRule = {
  name: "max-parameters",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    const functions = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    for (const functionNode of functions) {
      const parameterCount = functionNode.getParameters().length;

      if (parameterCount > config.maxParameters) {
        issues.push({
          rule: this.name,

          message:
            `Function has ${parameterCount} parameters. ` +
            `Maximum recommended number is ${config.maxParameters}.`,

          suggestion:
            "Consider grouping related parameters into an object or configuration interface.",

          line: functionNode.getStartLineNumber(),

          severity: "medium",
        });
      }
    }

    return issues;
  },
};
