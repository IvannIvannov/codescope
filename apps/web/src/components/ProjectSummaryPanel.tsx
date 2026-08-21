import type { ProjectSummary } from "../types";

interface ProjectSummaryPanelProps {
  summary: ProjectSummary;
}

function ProjectSummaryPanel({ summary }: ProjectSummaryPanelProps) {
  return (
    <section className="project-summary">
      <div className="project-score">
        <span>Project health</span>

        <strong>{summary.score}</strong>

        <span>/ 100</span>
      </div>

      <div className="project-summary-metrics">
        <div>
          <strong>{summary.files}</strong>

          <span>Files</span>
        </div>

        <div>
          <strong>{summary.totalIssues}</strong>

          <span>Issues</span>
        </div>

        <div>
          <strong>{summary.linesOfCode}</strong>

          <span>Lines</span>
        </div>

        <div>
          <strong>{summary.functions}</strong>

          <span>Functions</span>
        </div>
      </div>

      <div className="project-severity">
        <span>High: {summary.high}</span>

        <span>Medium: {summary.medium}</span>

        <span>Low: {summary.low}</span>
      </div>
    </section>
  );
}

export default ProjectSummaryPanel;
