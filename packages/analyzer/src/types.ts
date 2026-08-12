import type { SourceFile } from "ts-morph";

export interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  severity: "low" | "medium" | "high";
  file?: string;
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

export interface ProjectMetrics {
  files: number;
  linesOfCode: number;
  functions: number;
}

export interface ProjectAnalysisReport {
  score: number;
  summary: AnalysisSummary;
  metrics: ProjectMetrics;
  issues: CodeIssue[];
}
