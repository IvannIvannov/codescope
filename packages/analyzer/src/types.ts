import type { SourceFile } from "ts-morph";

export type Severity = "low" | "medium" | "high";

export interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  column?: number;
  snippet?: string;
  severity: Severity;
  file?: string;
  suggestion?: string;
}

export interface AnalyzerConfig {
  noAny: boolean;
  noConsole: boolean;
  maxFunctionLength: number;
  maxParameters: number;
  maxComplexity: number;
  maxNestingDepth: number;
}

export interface AnalysisRule {
  name: string;

  analyze(sourceFile: SourceFile, config: AnalyzerConfig): CodeIssue[];
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
