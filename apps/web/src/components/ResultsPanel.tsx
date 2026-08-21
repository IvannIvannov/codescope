import type { AnalysisMode, AnalysisReport } from "../types";

interface ResultsPanelProps {
  mode: AnalysisMode;
  report: AnalysisReport | null;
  canExportReport: boolean;

  onGoToIssue: (issue: AnalysisReport["issues"][number]) => void;

  onExportJson: () => void;
  onExportCsv: () => void;
}

function ResultsPanel({
  mode,
  report,
  canExportReport,
  onGoToIssue,
  onExportJson,
  onExportCsv,
}: ResultsPanelProps) {
  return (
    <div className="results-panel">
      {!report ? (
        <div className="empty-state">
          <h2>Ready to analyze</h2>

          <p>
            {mode === "project"
              ? "Analyze the project to see issues for each file."
              : "Write, paste or open a file and run CodeScope to see the analysis."}
          </p>
        </div>
      ) : (
        <>
          <div className="score">
            <span>
              {mode === "project" ? "Selected file health" : "Code health"}
            </span>

            <strong>{report.score}</strong>

            <span>/ 100</span>
          </div>

          <div className="metrics">
            <div>
              <strong>{report.summary.totalIssues}</strong>

              <span>Issues</span>
            </div>

            <div>
              <strong>{report.metrics.linesOfCode}</strong>

              <span>Lines</span>
            </div>

            <div>
              <strong>{report.metrics.functions}</strong>

              <span>Functions</span>
            </div>
          </div>

          <div className="severity-summary">
            <span>High: {report.summary.high}</span>

            <span>Medium: {report.summary.medium}</span>

            <span>Low: {report.summary.low}</span>
          </div>

          {canExportReport && (
            <div className="report-export-actions">
              <div>
                <strong>Export report</strong>

                <span>Download the current analysis results.</span>
              </div>

              <div className="report-export-buttons">
                <button type="button" onClick={onExportJson}>
                  Export JSON
                </button>

                <button type="button" onClick={onExportCsv}>
                  Export CSV
                </button>
              </div>
            </div>
          )}

          <div className="issues">
            {report.issues.map((issue, index) => (
              <article
                className={`issue ${issue.severity}`}
                key={`${issue.rule}-${issue.line}-${index}`}
                onClick={() => onGoToIssue(issue)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onGoToIssue(issue);
                  }
                }}
              >
                <div className="issue-heading">
                  <strong>{issue.rule}</strong>

                  <span>{issue.severity}</span>
                </div>

                <p>{issue.message}</p>

                {issue.snippet && (
                  <code className="issue-snippet">{issue.snippet}</code>
                )}

                {issue.suggestion && (
                  <div className="suggestion">
                    <strong>Suggestion</strong>

                    <p>{issue.suggestion}</p>
                  </div>
                )}

                <small>
                  Line {issue.line}
                  {issue.column ? `, Column ${issue.column}` : ""}
                </small>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ResultsPanel;
