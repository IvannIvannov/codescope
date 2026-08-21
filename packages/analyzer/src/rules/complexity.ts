import { Node, SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

function calculateComplexity(node: Node): number {
  let complexity = 1;

  node.forEachDescendant((descendant) => {
    const kind = descendant.getKind();

    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ForStatement ||
      kind === SyntaxKind.ForInStatement ||
      kind === SyntaxKind.ForOfStatement ||
      kind === SyntaxKind.WhileStatement ||
      kind === SyntaxKind.DoStatement ||
      kind === SyntaxKind.CaseClause ||
      kind === SyntaxKind.CatchClause ||
      kind === SyntaxKind.ConditionalExpression
    ) {
      complexity++;
    }

    if (kind === SyntaxKind.BinaryExpression) {
      const binaryExpression = descendant.asKind(SyntaxKind.BinaryExpression);

      if (!binaryExpression) {
        return;
      }

      const operator = binaryExpression.getOperatorToken().getKind();

      if (
        operator === SyntaxKind.AmpersandAmpersandToken ||
        operator === SyntaxKind.BarBarToken ||
        operator === SyntaxKind.QuestionQuestionToken
      ) {
        complexity++;
      }
    }
  });

  return complexity;
}

export const complexityRule: AnalysisRule = {
  name: "complexity",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    const functions = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),

      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ];

    for (const functionNode of functions) {
      const complexity = calculateComplexity(functionNode);

      if (complexity > config.maxComplexity) {
        issues.push({
          rule: this.name,

          message:
            `Function has a cyclomatic complexity of ${complexity}. ` +
            `Maximum recommended complexity is ${config.maxComplexity}.`,

          suggestion:
            "Reduce branching by extracting conditions and responsibilities into smaller functions.",

          line: functionNode.getStartLineNumber(),

          severity: "high",
        });
      }
    }

    return issues;
  },
};
