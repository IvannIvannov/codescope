import { Project, SyntaxKind } from "ts-morph";
import { rules } from "./rules/index.js";

import type {
  CodeIssue,
  AnalysisReport,
  AnalysisSummary,
  AnalysisMetrics,
} from "./types.js";

function calculateScore(issues: CodeIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "high") {
      score -= 10;
    }

    if (issue.severity === "medium") {
      score -= 5;
    }

    if (issue.severity === "low") {
      score -= 2;
    }
  }

  return Math.max(score, 0);
}

function createSummary(issues: CodeIssue[]): AnalysisSummary {
  return {
    totalIssues: issues.length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
  };
}

export function analyzeCode(code: string): AnalysisReport {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("file.ts", code);

  const issues = rules.flatMap((rule) => rule.analyze(sourceFile));

  const metrics: AnalysisMetrics = {
    linesOfCode: sourceFile.getEndLineNumber(),
    functions:
      sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).length +
      sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).length +
      sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).length,
  };

  return {
    score: calculateScore(issues),
    summary: createSummary(issues),
    metrics,
    issues,
  };
}

export { analyzeProject } from "./project-analyzer.js";

export type {
  CodeIssue,
  AnalysisRule,
  AnalysisReport,
  AnalysisSummary,
  AnalysisMetrics,
  ProjectMetrics,
  ProjectAnalysisReport,
} from "./types.js";
