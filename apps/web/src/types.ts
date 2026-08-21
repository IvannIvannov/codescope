export type Severity = "low" | "medium" | "high";

export type Language =
  | "typescript"
  | "javascript"
  | "typescriptreact"
  | "javascriptreact";

export type AnalysisMode = "code" | "project";

export type TrendMode = "all" | AnalysisMode;

export type FileFilter = "all" | "issues" | "clean";

export type FileSort = "issues" | "name";

export type IssueSeverityFilter = "all" | Severity;

export type AnalyzerPreset = "strict" | "balanced" | "relaxed";

export type ActivePreset = AnalyzerPreset | "custom";

export interface AnalyzerConfig {
  noAny: boolean;
  noConsole: boolean;
  maxFunctionLength: number;
  maxParameters: number;
  maxComplexity: number;
  maxNestingDepth: number;
}

export interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  column?: number;
  snippet?: string;
  severity: Severity;
  suggestion?: string;
}

export interface AnalysisReport {
  score: number;

  summary: {
    totalIssues: number;
    high: number;
    medium: number;
    low: number;
  };

  metrics: {
    linesOfCode: number;
    functions: number;
  };

  issues: CodeIssue[];
}

export interface ProjectFile {
  name: string;
  path: string;
  code: string;
  language: Language;
  report: AnalysisReport | null;
}

export interface ProjectSummary {
  score: number;
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
  files: number;
  linesOfCode: number;
  functions: number;
}

export interface ProjectIssue {
  issue: CodeIssue;
  file: ProjectFile;
  fileIndex: number;
}

export interface AnalysisHistoryEntry {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  name: string;
  score: number;
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
  preset: ActivePreset;
  files?: number;
  linesOfCode: number;
  functions: number;
}

export interface HistoryComparison {
  older: AnalysisHistoryEntry;
  newer: AnalysisHistoryEntry;
  score: number;
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
}

export interface TrendPoint {
  entry: AnalysisHistoryEntry;
  x: number;
  y: number;
}
