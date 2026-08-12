import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";

import { rules } from "./rules/index.js";

import type {
  CodeIssue,
  AnalysisSummary,
  ProjectAnalysisReport,
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

export function analyzeProject(projectPath: string): ProjectAnalysisReport {
  const project = new Project();

  project.addSourceFilesAtPaths([
    path.join(projectPath, "**/*.ts"),
    path.join(projectPath, "**/*.tsx"),
    path.join(projectPath, "**/*.js"),
    path.join(projectPath, "**/*.jsx"),
    `!${path.join(projectPath, "**/node_modules/**")}`,
    `!${path.join(projectPath, "**/dist/**")}`,
    `!${path.join(projectPath, "**/test.ts")}`,
  ]);

  const sourceFiles = project.getSourceFiles();

  const issues: CodeIssue[] = [];

  let linesOfCode = 0;
  let functions = 0;

  for (const sourceFile of sourceFiles) {
    linesOfCode += sourceFile.getEndLineNumber();

    functions +=
      sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).length +
      sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).length +
      sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).length;

    const fileIssues = rules.flatMap((rule) => rule.analyze(sourceFile));

    for (const issue of fileIssues) {
      issues.push({
        ...issue,
        file: sourceFile.getFilePath(),
      });
    }
  }

  return {
    score: calculateScore(issues),

    summary: createSummary(issues),

    metrics: {
      files: sourceFiles.length,
      linesOfCode,
      functions,
    },

    issues,
  };
}
