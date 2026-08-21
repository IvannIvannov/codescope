import type {
  AnalysisHistoryEntry,
  HistoryComparison,
  TrendMode,
  TrendPoint,
} from "../types";

interface HistoryPanelProps {
  analysisHistory: AnalysisHistoryEntry[];
  selectedHistoryIds: string[];

  trendMode: TrendMode;
  trendEntries: AnalysisHistoryEntry[];
  trendPoints: TrendPoint[];
  trendPolyline: string;

  historyComparison: HistoryComparison | null;

  onTrendModeChange: (mode: TrendMode) => void;

  onToggleHistorySelection: (id: string) => void;

  onClearHistorySelection: () => void;
  onClearHistory: () => void;

  formatPresetName: (preset: AnalysisHistoryEntry["preset"]) => string;

  formatHistoryDate: (value: string) => string;

  formatTrendDate: (value: string) => string;

  formatDelta: (value: number) => string;

  getScoreDeltaClass: (value: number) => string;

  getIssueDeltaClass: (value: number) => string;
}

function HistoryPanel({
  analysisHistory,
  selectedHistoryIds,
  trendMode,
  trendEntries,
  trendPoints,
  trendPolyline,
  historyComparison,
  onTrendModeChange,
  onToggleHistorySelection,
  onClearHistorySelection,
  onClearHistory,
  formatPresetName,
  formatHistoryDate,
  formatTrendDate,
  formatDelta,
  getScoreDeltaClass,
  getIssueDeltaClass,
}: HistoryPanelProps) {
  return (
    <section className="history-panel">
      <div className="history-header">
        <div>
          <h2>Analysis history</h2>

          <p>Track and compare code quality over time.</p>
        </div>

        <div className="history-header-actions">
          {selectedHistoryIds.length > 0 && (
            <button
              className="history-secondary-button"
              type="button"
              onClick={onClearHistorySelection}
            >
              Clear selection
            </button>
          )}

          {analysisHistory.length > 0 && (
            <button
              className="clear-history-button"
              type="button"
              onClick={onClearHistory}
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      {analysisHistory.length === 0 ? (
        <div className="history-empty">
          <strong>No analyses yet</strong>

          <span>Run a code or project analysis and it will appear here.</span>
        </div>
      ) : (
        <>
          <section className="trend-panel">
            <div className="trend-header">
              <div>
                <span className="trend-eyebrow">Score trend</span>

                <h3>Quality over time</h3>

                <p>Latest {trendEntries.length} analyses</p>
              </div>

              <div className="trend-filters">
                {(["all", "code", "project"] as TrendMode[]).map(
                  (trendFilter) => (
                    <button
                      key={trendFilter}
                      type="button"
                      className={trendMode === trendFilter ? "active" : ""}
                      onClick={() => onTrendModeChange(trendFilter)}
                    >
                      {trendFilter === "all"
                        ? "All"
                        : trendFilter.charAt(0).toUpperCase() +
                          trendFilter.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {trendPoints.length === 0 ? (
              <div className="trend-empty">No analyses match this filter.</div>
            ) : (
              <div className="trend-chart-wrapper">
                <svg
                  className="trend-chart"
                  viewBox="0 0 1020 240"
                  role="img"
                  aria-label="CodeScope score trend"
                >
                  {[100, 75, 50, 25, 0].map((score) => {
                    const y = 30 + ((100 - score) / 100) * 160;

                    return (
                      <g key={score}>
                        <line
                          className="trend-grid-line"
                          x1="60"
                          x2="960"
                          y1={y}
                          y2={y}
                        />

                        <text className="trend-axis-label" x="20" y={y + 4}>
                          {score}
                        </text>
                      </g>
                    );
                  })}

                  {trendPoints.length > 1 && (
                    <polyline
                      className="trend-line"
                      points={trendPolyline}
                      fill="none"
                    />
                  )}

                  {trendPoints.map((point, index) => (
                    <g className="trend-point-group" key={point.entry.id}>
                      <circle
                        className={`trend-point ${point.entry.mode}`}
                        cx={point.x}
                        cy={point.y}
                        r="7"
                      >
                        <title>
                          {`${point.entry.name}
Score: ${point.entry.score}/100
Issues: ${point.entry.totalIssues}
Preset: ${formatPresetName(point.entry.preset)}
${formatHistoryDate(point.entry.createdAt)}`}
                        </title>
                      </circle>

                      <text
                        className="trend-score-label"
                        x={point.x}
                        y={point.y - 15}
                        textAnchor="middle"
                      >
                        {point.entry.score}
                      </text>

                      <text
                        className="trend-date-label"
                        x={point.x}
                        y="218"
                        textAnchor="middle"
                      >
                        {index === 0 ||
                        index === trendPoints.length - 1 ||
                        trendPoints.length <= 5
                          ? formatTrendDate(point.entry.createdAt)
                          : ""}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </section>

          <div className="history-selection-info">
            <span>{selectedHistoryIds.length} / 2 selected</span>

            <small>Choose two analyses to see the difference.</small>
          </div>

          {historyComparison && (
            <section className="history-comparison">
              <div className="comparison-header">
                <div>
                  <span className="comparison-label">Comparison</span>

                  <h3>
                    {historyComparison.older.name} →{" "}
                    {historyComparison.newer.name}
                  </h3>
                </div>

                <div className="comparison-period">
                  <span>
                    {formatHistoryDate(historyComparison.older.createdAt)}
                  </span>

                  <span>→</span>

                  <span>
                    {formatHistoryDate(historyComparison.newer.createdAt)}
                  </span>
                </div>
              </div>

              <div className="comparison-grid">
                <div className="comparison-card">
                  <span>Score</span>

                  <strong
                    className={getScoreDeltaClass(historyComparison.score)}
                  >
                    {formatDelta(historyComparison.score)}
                  </strong>

                  <small>
                    {historyComparison.older.score} →{" "}
                    {historyComparison.newer.score}
                  </small>
                </div>

                <div className="comparison-card">
                  <span>Issues</span>

                  <strong
                    className={getIssueDeltaClass(
                      historyComparison.totalIssues,
                    )}
                  >
                    {formatDelta(historyComparison.totalIssues)}
                  </strong>

                  <small>
                    {historyComparison.older.totalIssues} →{" "}
                    {historyComparison.newer.totalIssues}
                  </small>
                </div>

                <div className="comparison-card">
                  <span>High</span>

                  <strong
                    className={getIssueDeltaClass(historyComparison.high)}
                  >
                    {formatDelta(historyComparison.high)}
                  </strong>

                  <small>
                    {historyComparison.older.high} →{" "}
                    {historyComparison.newer.high}
                  </small>
                </div>

                <div className="comparison-card">
                  <span>Medium</span>

                  <strong
                    className={getIssueDeltaClass(historyComparison.medium)}
                  >
                    {formatDelta(historyComparison.medium)}
                  </strong>

                  <small>
                    {historyComparison.older.medium} →{" "}
                    {historyComparison.newer.medium}
                  </small>
                </div>

                <div className="comparison-card">
                  <span>Low</span>

                  <strong className={getIssueDeltaClass(historyComparison.low)}>
                    {formatDelta(historyComparison.low)}
                  </strong>

                  <small>
                    {historyComparison.older.low} →{" "}
                    {historyComparison.newer.low}
                  </small>
                </div>
              </div>
            </section>
          )}

          <div className="history-list">
            {analysisHistory.map((historyItem) => {
              const isSelected = selectedHistoryIds.includes(historyItem.id);

              return (
                <article
                  className={
                    isSelected ? "history-item selected" : "history-item"
                  }
                  key={historyItem.id}
                >
                  <div className="history-item-top">
                    <div className="history-item-title">
                      <button
                        className={
                          isSelected
                            ? "history-compare-button selected"
                            : "history-compare-button"
                        }
                        type="button"
                        onClick={() => onToggleHistorySelection(historyItem.id)}
                      >
                        {isSelected ? "Selected" : "Compare"}
                      </button>

                      <span className={`history-mode ${historyItem.mode}`}>
                        {historyItem.mode === "project" ? "Project" : "Code"}
                      </span>

                      <strong>{historyItem.name}</strong>
                    </div>

                    <div className="history-score">
                      <strong>{historyItem.score}</strong>

                      <span>/100</span>
                    </div>
                  </div>

                  <div className="history-meta">
                    <span>{historyItem.totalIssues} issues</span>

                    <span>High: {historyItem.high}</span>

                    <span>Medium: {historyItem.medium}</span>

                    <span>Low: {historyItem.low}</span>

                    {historyItem.files !== undefined && (
                      <span>{historyItem.files} files</span>
                    )}

                    <span>{historyItem.linesOfCode} lines</span>

                    <span>{historyItem.functions} functions</span>
                  </div>

                  <div className="history-item-footer">
                    <span>
                      Preset:{" "}
                      <strong>{formatPresetName(historyItem.preset)}</strong>
                    </span>

                    <time dateTime={historyItem.createdAt}>
                      {formatHistoryDate(historyItem.createdAt)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default HistoryPanel;
