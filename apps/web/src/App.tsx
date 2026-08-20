import { useState } from "react";
import "./App.css";

type Severity = "low" | "medium" | "high";

interface CodeIssue {
  rule: string;
  message: string;
  line: number;
  column?: number;
  snippet?: string;
  severity: Severity;
  suggestion?: string;
}

interface AnalysisReport {
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

const initialCode = `function test(value: any) {
  console.log(value);
}`;

function App() {
  const [code, setCode] = useState(initialCode);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/analyze/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed.");
      }

      const data = await response.json();

      setReport(data.report);
    } catch {
      setError("Could not connect to the CodeScope API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>CodeScope</h1>
          <p>Analyze your code quality in seconds.</p>
        </div>
      </header>

      <section className="workspace">
        <div className="editor-panel">
          <div className="panel-header">
            <h2>Code</h2>
            <span>TypeScript</span>
          </div>

          <textarea
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
          />

          <button onClick={analyze} disabled={loading || !code.trim()}>
            {loading ? "Analyzing..." : "Analyze code"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="results-panel">
          {!report ? (
            <div className="empty-state">
              <h2>Ready to analyze</h2>
              <p>Paste your code and run CodeScope to see the analysis.</p>
            </div>
          ) : (
            <>
              <div className="score">
                <span>Code health</span>
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

              <div className="issues">
                {report.issues.map((issue, index) => (
                  <article
                    className={`issue ${issue.severity}`}
                    key={`${issue.rule}-${issue.line}-${index}`}
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
      </section>
    </main>
  );
}

export default App;
