import { Project } from "ts-morph";
import { rules } from "./rules/index.js";
import type { CodeIssue } from "./types.js";

export function analyzeCode(code: string): CodeIssue[] {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("file.ts", code);

  return rules.flatMap((rule) => rule.analyze(sourceFile));
}

export type { CodeIssue, AnalysisRule } from "./types.js";
