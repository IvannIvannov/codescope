import { Project, SyntaxKind } from "ts-morph";

export interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  severity: "low" | "medium" | "high";
}

export function analyzeCode(code: string): CodeIssue[] {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("file.ts", code);

  const issues: CodeIssue[] = [];

  const anyKeywords = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);

  for (const anyKeyword of anyKeywords) {
    issues.push({
      rule: "no-any",
      message: "Avoid using the 'any' type.",
      line: anyKeyword.getStartLineNumber(),
      severity: "medium",
    });
  }

  return issues;
}
