import type { SourceFile } from "ts-morph";

export interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  severity: "low" | "medium" | "high";
}

export interface AnalysisRule {
  name: string;
  analyze(sourceFile: SourceFile): CodeIssue[];
}

export interface AnalysisSummary {
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
}

export interface AnalysisMetrics {
  linesOfCode: number;
  functions: number;
}

export interface AnalysisReport {
  score: number;
  summary: AnalysisSummary;
  metrics: AnalysisMetrics;
  issues: CodeIssue[];
}