import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import "./App.css";

type Severity = "low" | "medium" | "high";

type Language =
  | "typescript"
  | "javascript"
  | "typescriptreact"
  | "javascriptreact";

type AnalysisMode = "code" | "project";

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

interface ProjectFile {
  name: string;
  path: string;
  code: string;
  language: Language;
  report: AnalysisReport | null;
}

const initialCode = `function test(value: any) {
  console.log(value);
}`;

function App() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<AnalysisMode>("code");

  const [code, setCode] = useState(initialCode);
  const [fileName, setFileName] = useState("example.ts");
  const [language, setLanguage] = useState<Language>("typescript");

  const [report, setReport] = useState<AnalysisReport | null>(null);

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [selectedProjectFile, setSelectedProjectFile] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const clearMarkers = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      return;
    }

    monaco.editor.setModelMarkers(model, "codescope", []);
  };

  const clearAnalysis = () => {
    setReport(null);
    setError("");
    clearMarkers();
  };

  const updateMarkers = (issues: CodeIssue[]) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      return;
    }

    const markers = issues.map((issue) => {
      const severity =
        issue.severity === "high"
          ? monaco.MarkerSeverity.Error
          : issue.severity === "medium"
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info;

      const line = issue.line;
      const column = issue.column ?? 1;

      return {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: issue.snippet ? column + issue.snippet.length : column + 1,
        message: issue.suggestion
          ? `${issue.message}\n\nSuggestion: ${issue.suggestion}`
          : issue.message,
        severity,
        source: "CodeScope",
        code: issue.rule,
      };
    });

    monaco.editor.setModelMarkers(model, "codescope", markers);
  };

  const getLanguageFromFile = (name: string): Language => {
    const lowerName = name.toLowerCase();

    if (lowerName.endsWith(".tsx")) {
      return "typescriptreact";
    }

    if (lowerName.endsWith(".jsx")) {
      return "javascriptreact";
    }

    if (lowerName.endsWith(".js")) {
      return "javascript";
    }

    return "typescript";
  };

  const isSupportedFile = (name: string) => {
    const lowerName = name.toLowerCase();

    return (
      lowerName.endsWith(".ts") ||
      lowerName.endsWith(".tsx") ||
      lowerName.endsWith(".js") ||
      lowerName.endsWith(".jsx")
    );
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value ?? "";

    setCode(newCode);

    if (mode === "project" && selectedProjectFile !== null) {
      setProjectFiles((currentFiles) =>
        currentFiles.map((file, index) =>
          index === selectedProjectFile
            ? {
                ...file,
                code: newCode,
                report: null,
              }
            : file,
        ),
      );
    }

    clearAnalysis();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isSupportedFile(file.name)) {
      setError(
        "Unsupported file type. Please select a .ts, .tsx, .js or .jsx file.",
      );

      event.target.value = "";
      return;
    }

    try {
      const content = await file.text();

      setMode("code");
      setFileName(file.name);
      setLanguage(getLanguageFromFile(file.name));
      setCode(content);

      clearAnalysis();

      editorRef.current?.setPosition({
        lineNumber: 1,
        column: 1,
      });

      editorRef.current?.revealLine(1);
    } catch {
      setError("Could not read the selected file.");
    }

    event.target.value = "";
  };

  const handleFolderUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    const supportedFiles = selectedFiles.filter((file) =>
      isSupportedFile(file.name),
    );

    if (supportedFiles.length === 0) {
      setError("No supported .ts, .tsx, .js or .jsx files were found.");

      event.target.value = "";
      return;
    }

    try {
      const files: ProjectFile[] = await Promise.all(
        supportedFiles.map(async (file) => ({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          code: await file.text(),
          language: getLanguageFromFile(file.name),
          report: null,
        })),
      );

      setMode("project");
      setProjectFiles(files);
      setSelectedProjectFile(0);

      setFileName(files[0].name);
      setLanguage(files[0].language);
      setCode(files[0].code);

      clearAnalysis();
    } catch {
      setError("Could not read the selected project.");
    }

    event.target.value = "";
  };

  const selectProjectFile = (index: number) => {
    const file = projectFiles[index];

    if (!file) {
      return;
    }

    setSelectedProjectFile(index);
    setFileName(file.name);
    setLanguage(file.language);
    setCode(file.code);
    setReport(file.report);

    clearMarkers();

    if (file.report) {
      setTimeout(() => {
        updateMarkers(file.report?.issues ?? []);
      }, 0);
    }

    editorRef.current?.setPosition({
      lineNumber: 1,
      column: 1,
    });

    editorRef.current?.revealLine(1);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const openFolderPicker = () => {
    folderInputRef.current?.click();
  };

  const goToIssue = (issue: CodeIssue) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const lineNumber = issue.line;
    const column = issue.column ?? 1;

    editor.revealLineInCenter(lineNumber);

    editor.setPosition({
      lineNumber,
      column,
    });

    if (issue.snippet) {
      editor.setSelection({
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: column + issue.snippet.length,
      });
    }

    editor.focus();
  };

  const requestAnalysis = async (
    sourceCode: string,
  ): Promise<AnalysisReport> => {
    const response = await fetch("http://localhost:3000/analyze/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: sourceCode,
      }),
    });

    if (!response.ok) {
      throw new Error("Analysis failed.");
    }

    const data = await response.json();

    return data.report;
  };

  const analyzeCode = async () => {
    setLoading(true);
    setError("");

    try {
      const newReport = await requestAnalysis(code);

      setReport(newReport);
      updateMarkers(newReport.issues);
    } catch {
      setError("Could not connect to the CodeScope API.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeProject = async () => {
    if (projectFiles.length === 0) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const analyzedFiles = await Promise.all(
        projectFiles.map(async (file) => ({
          ...file,
          report: await requestAnalysis(file.code),
        })),
      );

      setProjectFiles(analyzedFiles);

      if (selectedProjectFile !== null) {
        const selectedFile = analyzedFiles[selectedProjectFile];

        if (selectedFile?.report) {
          setReport(selectedFile.report);
          updateMarkers(selectedFile.report.issues);
        }
      }
    } catch {
      setError("Could not analyze the selected project.");
    } finally {
      setLoading(false);
    }
  };

  const switchToCodeMode = () => {
    setMode("code");
    setSelectedProjectFile(null);
    clearAnalysis();
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>CodeScope</h1>
          <p>Analyze your code quality in seconds.</p>
        </div>

        <div className="mode-switcher">
          <button
            className={mode === "code" ? "active" : ""}
            type="button"
            onClick={switchToCodeMode}
          >
            Code
          </button>

          <button
            className={mode === "project" ? "active" : ""}
            type="button"
            onClick={openFolderPicker}
          >
            Project
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept=".ts,.tsx,.js,.jsx"
        onChange={handleFileUpload}
      />

      <input
        ref={folderInputRef}
        className="file-input"
        type="file"
        multiple
        onChange={handleFolderUpload}
        {...({
          webkitdirectory: "",
          directory: "",
        } as React.InputHTMLAttributes<HTMLInputElement>)}
      />

      <section
        className={`workspace ${mode === "project" ? "project-mode" : ""}`}
      >
        {mode === "project" && (
          <aside className="project-sidebar">
            <div className="project-sidebar-header">
              <h3>Project files</h3>
              <span>{projectFiles.length}</span>
            </div>

            <div className="project-file-list">
              {projectFiles.map((file, index) => (
                <button
                  key={`${file.path}-${index}`}
                  type="button"
                  className={
                    selectedProjectFile === index
                      ? "project-file active"
                      : "project-file"
                  }
                  onClick={() => selectProjectFile(index)}
                >
                  <div>
                    <strong>{file.name}</strong>
                    <small>{file.path}</small>
                  </div>

                  {file.report && (
                    <span
                      className={
                        file.report.summary.totalIssues === 0
                          ? "file-status clean"
                          : "file-status issues-found"
                      }
                    >
                      {file.report.summary.totalIssues}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="editor-panel">
          <div className="panel-header">
            <div>
              <h2>Code</h2>
              <span className="file-name">{fileName}</span>
            </div>

            <div className="editor-actions">
              <span>{language}</span>

              {mode === "code" && (
                <button
                  className="upload-button"
                  type="button"
                  onClick={openFilePicker}
                >
                  Open file
                </button>
              )}

              {mode === "project" && (
                <button
                  className="upload-button"
                  type="button"
                  onClick={openFolderPicker}
                >
                  Open project
                </button>
              )}
            </div>
          </div>

          <div className="code-editor">
            <Editor
              height="500px"
              language={language}
              theme="vs-dark"
              value={code}
              onMount={handleEditorMount}
              onChange={handleCodeChange}
              options={{
                minimap: {
                  enabled: false,
                },
                fontSize: 15,
                lineHeight: 24,
                fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: {
                  top: 16,
                  bottom: 16,
                },
                wordWrap: "on",
              }}
            />
          </div>

          <button
            className="analyze-button"
            onClick={mode === "project" ? analyzeProject : analyzeCode}
            disabled={
              loading ||
              (mode === "code" ? !code.trim() : projectFiles.length === 0)
            }
          >
            {loading
              ? "Analyzing..."
              : mode === "project"
                ? `Analyze project (${projectFiles.length} files)`
                : "Analyze code"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

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
                    onClick={() => goToIssue(issue)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        goToIssue(issue);
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
      </section>
    </main>
  );
}

export default App;
