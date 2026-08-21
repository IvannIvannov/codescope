import type { IssueSeverityFilter, ProjectIssue } from "../types";

interface ProjectIssuesPanelProps {
  projectIssues: ProjectIssue[];
  visibleProjectIssues: ProjectIssue[];

  issueSeverityFilter: IssueSeverityFilter;

  issueRuleFilter: string;

  availableIssueRules: string[];

  onSeverityFilterChange: (severity: IssueSeverityFilter) => void;

  onRuleFilterChange: (rule: string) => void;

  onGoToProjectIssue: (issue: ProjectIssue) => void;
}

function ProjectIssuesPanel({
  projectIssues,
  visibleProjectIssues,
  issueSeverityFilter,
  issueRuleFilter,
  availableIssueRules,
  onSeverityFilterChange,
  onRuleFilterChange,
  onGoToProjectIssue,
}: ProjectIssuesPanelProps) {
  return (
    <section className="project-issues">
      <div className="project-issues-header">
        <div>
          <h2>Project issues</h2>

          <p>Filter and explore all detected issues.</p>
        </div>

        <span>
          {visibleProjectIssues.length} / {projectIssues.length}
        </span>
      </div>

      <div className="project-issue-controls">
        <div className="issue-severity-filters">
          {(["all", "high", "medium", "low"] as IssueSeverityFilter[]).map(
            (severity) => (
              <button
                key={severity}
                type="button"
                className={issueSeverityFilter === severity ? "active" : ""}
                onClick={() => onSeverityFilterChange(severity)}
              >
                {severity === "all"
                  ? "All"
                  : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ),
          )}
        </div>

        <label className="issue-rule-filter">
          <span>Rule</span>

          <select
            value={issueRuleFilter}
            onChange={(event) => onRuleFilterChange(event.target.value)}
          >
            <option value="all">All rules</option>

            {availableIssueRules.map((rule) => (
              <option key={rule} value={rule}>
                {rule}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleProjectIssues.length === 0 ? (
        <div className="no-project-issues">
          No issues match the selected filters.
        </div>
      ) : (
        <div className="project-issues-list">
          {visibleProjectIssues.map((projectIssue, index) => (
            <button
              type="button"
              className={`project-issue-item ${projectIssue.issue.severity}`}
              key={`${projectIssue.file.path}-${projectIssue.issue.rule}-${projectIssue.issue.line}-${index}`}
              onClick={() => onGoToProjectIssue(projectIssue)}
            >
              <div className="project-issue-top">
                <strong>{projectIssue.issue.rule}</strong>

                <span
                  className={`project-issue-severity ${projectIssue.issue.severity}`}
                >
                  {projectIssue.issue.severity}
                </span>
              </div>

              <p>{projectIssue.issue.message}</p>

              <div className="project-issue-location">
                <span>{projectIssue.file.name}</span>

                <small>
                  Line {projectIssue.issue.line}
                  {projectIssue.issue.column
                    ? `, Column ${projectIssue.issue.column}`
                    : ""}
                </small>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectIssuesPanel;
