import type { AnalysisReport, ProjectFile, ProjectSummary } from "../types";

export function createProjectSummary(files: ProjectFile[]): ProjectSummary {
  const reports = files
    .map((file) => file.report)
    .filter((fileReport): fileReport is AnalysisReport => fileReport !== null);

  const totalIssues = reports.reduce(
    (total, currentReport) => total + currentReport.summary.totalIssues,
    0,
  );

  const high = reports.reduce(
    (total, currentReport) => total + currentReport.summary.high,
    0,
  );

  const medium = reports.reduce(
    (total, currentReport) => total + currentReport.summary.medium,
    0,
  );

  const low = reports.reduce(
    (total, currentReport) => total + currentReport.summary.low,
    0,
  );

  const linesOfCode = reports.reduce(
    (total, currentReport) => total + currentReport.metrics.linesOfCode,
    0,
  );

  const functions = reports.reduce(
    (total, currentReport) => total + currentReport.metrics.functions,
    0,
  );

  const totalWeight = reports.reduce(
    (total, currentReport) =>
      total + Math.max(currentReport.metrics.linesOfCode, 1),
    0,
  );

  const weightedScore =
    totalWeight === 0
      ? 100
      : reports.reduce(
          (total, currentReport) =>
            total +
            currentReport.score *
              Math.max(currentReport.metrics.linesOfCode, 1),
          0,
        ) / totalWeight;

  return {
    score: Math.round(weightedScore),

    totalIssues,
    high,
    medium,
    low,

    files: files.length,

    linesOfCode,
    functions,
  };
}
