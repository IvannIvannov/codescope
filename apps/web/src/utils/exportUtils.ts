import type {
  ActivePreset,
  AnalysisMode,
  AnalysisReport,
  AnalyzerConfig,
  Language,
  ProjectFile,
  ProjectSummary,
} from "../types";

import { downloadTextFile } from "./downloadUtils";

import {
  createSafeFileName,
  escapeCsvValue,
  getProjectName,
} from "./fileUtils";

interface ExportReportOptions {
  mode: AnalysisMode;

  fileName: string;
  language: Language;

  report: AnalysisReport | null;

  projectFiles: ProjectFile[];
  projectSummary: ProjectSummary | null;

  activePreset: ActivePreset;
  analyzerConfig: AnalyzerConfig;
}

export function exportReportJson({
  mode,
  fileName,
  language,
  report,
  projectFiles,
  projectSummary,
  activePreset,
  analyzerConfig,
}: ExportReportOptions) {
  const exportedAt = new Date().toISOString();

  if (mode === "code") {
    if (!report) {
      return;
    }

    const payload = {
      application: "CodeScope",

      version: 1,

      exportedAt,

      analysis: {
        mode: "code",

        file: fileName,

        language,

        preset: activePreset,

        config: analyzerConfig,

        report,
      },
    };

    const safeName = createSafeFileName(fileName);

    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `codescope-${safeName}-report.json`,
      "application/json",
    );

    return;
  }

  if (!projectSummary) {
    return;
  }

  const projectName = getProjectName(projectFiles);

  const payload = {
    application: "CodeScope",

    version: 1,

    exportedAt,

    analysis: {
      mode: "project",

      project: projectName,

      preset: activePreset,

      config: analyzerConfig,

      summary: projectSummary,

      files: projectFiles.map((file) => ({
        name: file.name,

        path: file.path,

        language: file.language,

        report: file.report,
      })),
    },
  };

  const safeName = createSafeFileName(projectName);

  downloadTextFile(
    JSON.stringify(payload, null, 2),
    `codescope-${safeName}-project-report.json`,
    "application/json",
  );
}

export function exportReportCsv({
  mode,
  fileName,
  report,
  projectFiles,
  projectSummary,
  activePreset,
}: ExportReportOptions) {
  const headers = [
    "Mode",
    "File",
    "Rule",
    "Severity",
    "Message",
    "Line",
    "Column",
    "Snippet",
    "Suggestion",
    "Score",
    "Preset",
  ];

  const rows: string[][] = [];

  if (mode === "code") {
    if (!report) {
      return;
    }

    if (report.issues.length === 0) {
      rows.push([
        "code",
        fileName,
        "",
        "",
        "No issues detected.",
        "",
        "",
        "",
        "",
        String(report.score),
        activePreset,
      ]);
    } else {
      for (const issue of report.issues) {
        rows.push([
          "code",
          fileName,
          issue.rule,
          issue.severity,
          issue.message,
          String(issue.line),
          issue.column ? String(issue.column) : "",
          issue.snippet ?? "",
          issue.suggestion ?? "",
          String(report.score),
          activePreset,
        ]);
      }
    }

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const safeName = createSafeFileName(fileName);

    downloadTextFile(
      csv,
      `codescope-${safeName}-report.csv`,
      "text/csv;charset=utf-8",
    );

    return;
  }

  if (!projectSummary) {
    return;
  }

  for (const file of projectFiles) {
    if (!file.report) {
      continue;
    }

    if (file.report.issues.length === 0) {
      rows.push([
        "project",
        file.path,
        "",
        "",
        "No issues detected.",
        "",
        "",
        "",
        "",
        String(file.report.score),
        activePreset,
      ]);

      continue;
    }

    for (const issue of file.report.issues) {
      rows.push([
        "project",
        file.path,
        issue.rule,
        issue.severity,
        issue.message,
        String(issue.line),
        issue.column ? String(issue.column) : "",
        issue.snippet ?? "",
        issue.suggestion ?? "",
        String(file.report.score),
        activePreset,
      ]);
    }
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const projectName = getProjectName(projectFiles);

  const safeName = createSafeFileName(projectName);

  downloadTextFile(
    csv,
    `codescope-${safeName}-project-report.csv`,
    "text/csv;charset=utf-8",
  );
}
