import { Node, SyntaxKind } from "ts-morph";

import type { AnalysisRule, CodeIssue } from "../types.js";

const NESTING_KINDS = new Set([
  SyntaxKind.IfStatement,
  SyntaxKind.ForStatement,
  SyntaxKind.ForInStatement,
  SyntaxKind.ForOfStatement,
  SyntaxKind.WhileStatement,
  SyntaxKind.DoStatement,
  SyntaxKind.SwitchStatement,
  SyntaxKind.TryStatement,
]);

function isNestingNode(node: Node): boolean {
  return NESTING_KINDS.has(node.getKind());
}

function getNestingDepth(node: Node): number {
  let depth = 0;

  let parent = node.getParent();

  while (parent) {
    if (isNestingNode(parent)) {
      depth++;
    }

    parent = parent.getParent();
  }

  return depth + 1;
}

export const deepNestingRule: AnalysisRule = {
  name: "deep-nesting",

  analyze(sourceFile, config) {
    const issues: CodeIssue[] = [];

    sourceFile.forEachDescendant((node) => {
      if (!isNestingNode(node)) {
        return;
      }

      const depth = getNestingDepth(node);

      if (depth > config.maxNestingDepth) {
        issues.push({
          rule: this.name,

          message:
            `Code is nested ${depth} levels deep. ` +
            `Maximum recommended nesting depth is ${config.maxNestingDepth}.`,

          suggestion:
            "Reduce nesting by using early returns, guard clauses, or extracting nested logic into separate functions.",

          line: node.getStartLineNumber(),

          severity: "medium",
        });
      }
    });

    return issues;
  },
};
