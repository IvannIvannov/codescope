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