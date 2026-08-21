import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import "./App.css";

type Severity = "low" | "medium" | "high";

type Language =
  | "typescript"
  | "javascript"
  | "typescriptreact"
  | "javascriptreact";

type AnalysisMode = "code" | "project";
type FileFilter = "all" | "issues" | "clean";
type FileSort = "issues" | "name";
type IssueSeverityFilter = "all" | Severity;
type AnalyzerPreset = "strict" | "balanced" | "relaxed";
type ActivePreset = AnalyzerPreset | "custom";

interface AnalyzerConfig {
  noAny: boolean;
  noConsole: boolean;
  maxFunctionLength: number;
  maxParameters: number;
  maxComplexity: number;
  maxNestingDepth: number;
}

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

interface ProjectSummary {
  score: number;
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
  files: number;
  linesOfCode: number;
  functions: number;
}

interface ProjectIssue {
  issue: CodeIssue;
  file: ProjectFile;
  fileIndex: number;
}

const STORAGE_KEY = "codescope-analyzer-config";

const initialCode = `function test(value: any) {
  console.log(value);
}`;

const defaultAnalyzerConfig: AnalyzerConfig = {
  noAny: true,
  noConsole: true,
  maxFunctionLength: 50,
  maxParameters: 4,
  maxComplexity: 10,
  maxNestingDepth: 3,
};

const analyzerPresets: Record<AnalyzerPreset, AnalyzerConfig> = {
  strict: {
    noAny: true,
    noConsole: true,
    maxFunctionLength: 40,
    maxParameters: 3,
    maxComplexity: 8,
    maxNestingDepth: 2,
  },

  balanced: {
    noAny: true,
    noConsole: true,
    maxFunctionLength: 50,
    maxParameters: 4,
    maxComplexity: 10,
    maxNestingDepth: 3,
  },

  relaxed: {
    noAny: false,
    noConsole: false,
    maxFunctionLength: 80,
    maxParameters: 6,
    maxComplexity: 15,
    maxNestingDepth: 5,
  },
};

function App() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const configInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<AnalysisMode>("code");

  const [code, setCode] = useState(initialCode);
  const [fileName, setFileName] = useState("example.ts");
  const [language, setLanguage] = useState<Language>("typescript");

  const [report, setReport] = useState<AnalysisReport | null>(null);

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);

  const [selectedProjectFile, setSelectedProjectFile] = useState<number | null>(
    null,
  );

  const [fileFilter, setFileFilter] = useState<FileFilter>("all");
  const [fileSort, setFileSort] = useState<FileSort>("issues");

  const [issueSeverityFilter, setIssueSeverityFilter] =
    useState<IssueSeverityFilter>("all");

  const [issueRuleFilter, setIssueRuleFilter] = useState("all");

  const [analyzerConfig, setAnalyzerConfig] = useState<AnalyzerConfig>(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);

    if (!savedConfig) {
      return defaultAnalyzerConfig;
    }

    try {
      const parsedConfig = JSON.parse(savedConfig) as Partial<AnalyzerConfig>;

      return {
        ...defaultAnalyzerConfig,
        ...parsedConfig,
      };
    } catch {
      return defaultAnalyzerConfig;
    }
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyzerConfig));
  }, [analyzerConfig]);

  const activePreset = useMemo<ActivePreset>(() => {
    const entries = Object.entries(analyzerPresets) as [
      AnalyzerPreset,
      AnalyzerConfig,
    ][];

    for (const [name, preset] of entries) {
      const matches =
        preset.noAny === analyzerConfig.noAny &&
        preset.noConsole === analyzerConfig.noConsole &&
        preset.maxFunctionLength === analyzerConfig.maxFunctionLength &&
        preset.maxParameters === analyzerConfig.maxParameters &&
        preset.maxComplexity === analyzerConfig.maxComplexity &&
        preset.maxNestingDepth === analyzerConfig.maxNestingDepth;

      if (matches) {
        return name;
      }
    }

    return "custom";
  }, [analyzerConfig]);

  const projectSummary = useMemo<ProjectSummary | null>(() => {
    if (
      mode !== "project" ||
      projectFiles.length === 0 ||
      projectFiles.some((file) => !file.report)
    ) {
      return null;
    }

    const reports = projectFiles
      .map((file) => file.report)
      .filter(
        (fileReport): fileReport is AnalysisReport => fileReport !== null,
      );

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
      reports.reduce(
        (total, currentReport) =>
          total +
          currentReport.score * Math.max(currentReport.metrics.linesOfCode, 1),
        0,
      ) / totalWeight;

    return {
      score: Math.round(weightedScore),
      totalIssues,
      high,
      medium,
      low,
      files: projectFiles.length,
      linesOfCode,
      functions,
    };
  }, [mode, projectFiles]);

  const visibleProjectFiles = useMemo(() => {
    const filesWithIndex = projectFiles.map((file, originalIndex) => ({
      file,
      originalIndex,
    }));

    const filtered = filesWithIndex.filter(({ file }) => {
      if (fileFilter === "all") {
        return true;
      }

      if (!file.report) {
        return false;
      }

      if (fileFilter === "issues") {
        return file.report.summary.totalIssues > 0;
      }

      return file.report.summary.totalIssues === 0;
    });

    return [...filtered].sort((a, b) => {
      if (fileSort === "name") {
        return a.file.name.localeCompare(b.file.name);
      }

      const aIssues = a.file.report?.summary.totalIssues ?? 0;

      const bIssues = b.file.report?.summary.totalIssues ?? 0;

      if (bIssues !== aIssues) {
        return bIssues - aIssues;
      }

      return a.file.name.localeCompare(b.file.name);
    });
  }, [projectFiles, fileFilter, fileSort]);

  const projectIssues = useMemo<ProjectIssue[]>(() => {
    const issues: ProjectIssue[] = [];

    projectFiles.forEach((file, fileIndex) => {
      if (!file.report) {
        return;
      }

      file.report.issues.forEach((issue) => {
        issues.push({
          issue,
          file,
          fileIndex,
        });
      });
    });

    const severityWeight: Record<Severity, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return issues.sort((a, b) => {
      const severityDifference =
        severityWeight[b.issue.severity] - severityWeight[a.issue.severity];

      if (severityDifference !== 0) {
        return severityDifference;
      }

      const fileComparison = a.file.name.localeCompare(b.file.name);

      if (fileComparison !== 0) {
        return fileComparison;
      }

      return a.issue.line - b.issue.line;
    });
  }, [projectFiles]);

  const availableIssueRules = useMemo(() => {
    return Array.from(
      new Set(projectIssues.map((projectIssue) => projectIssue.issue.rule)),
    ).sort((a, b) => a.localeCompare(b));
  }, [projectIssues]);

  const visibleProjectIssues = useMemo(() => {
    return projectIssues.filter((projectIssue) => {
      const severityMatches =
        issueSeverityFilter === "all" ||
        projectIssue.issue.severity === issueSeverityFilter;

      const ruleMatches =
        issueRuleFilter === "all" ||
        projectIssue.issue.rule === issueRuleFilter;

      return severityMatches && ruleMatches;
    });
  }, [projectIssues, issueSeverityFilter, issueRuleFilter]);

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

  const clearProjectReports = () => {
    setProjectFiles((currentFiles) =>
      currentFiles.map((file) => ({
        ...file,
        report: null,
      })),
    );

    setReport(null);
    setError("");
    clearMarkers();
  };

  const invalidateAnalysis = () => {
    if (mode === "project") {
      clearProjectReports();
    } else {
      clearAnalysis();
    }
  };

  const handleConfigChange = <K extends keyof AnalyzerConfig>(
    key: K,
    value: AnalyzerConfig[K],
  ) => {
    setAnalyzerConfig((currentConfig) => ({
      ...currentConfig,
      [key]: value,
    }));

    invalidateAnalysis();
  };

  const resetAnalyzerConfig = () => {
    setAnalyzerConfig({
      ...defaultAnalyzerConfig,
    });

    invalidateAnalysis();
  };

  const applyPreset = (preset: AnalyzerPreset) => {
    setAnalyzerConfig({
      ...analyzerPresets[preset],
    });

    invalidateAnalysis();
  };

  const exportAnalyzerConfig = () => {
    const json = JSON.stringify(analyzerConfig, null, 2);

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "codescope-config.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const openConfigPicker = () => {
    configInputRef.current?.click();
  };

  const isValidAnalyzerConfig = (
    value: unknown,
  ): value is Partial<AnalyzerConfig> => {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const config = value as Record<string, unknown>;

    const booleanKeys = ["noAny", "noConsole"];

    const numberKeys = [
      "maxFunctionLength",
      "maxParameters",
      "maxComplexity",
      "maxNestingDepth",
    ];

    for (const key of booleanKeys) {
      if (key in config && typeof config[key] !== "boolean") {
        return false;
      }
    }

    for (const key of numberKeys) {
      if (
        key in config &&
        (typeof config[key] !== "number" ||
          !Number.isFinite(config[key]) ||
          Number(config[key]) <= 0)
      ) {
        return false;
      }
    }

    return true;
  };

  const handleConfigImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();

      const parsed: unknown = JSON.parse(text);

      if (!isValidAnalyzerConfig(parsed)) {
        throw new Error("Invalid configuration.");
      }

      const importedConfig: AnalyzerConfig = {
        ...defaultAnalyzerConfig,
        ...parsed,
      };

      setAnalyzerConfig(importedConfig);

      invalidateAnalysis();

      setError("");
    } catch {
      setError(
        "Could not import config. Please select a valid CodeScope JSON config file.",
      );
    }

    event.target.value = "";
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

      setFileFilter("all");
      setFileSort("issues");

      setIssueSeverityFilter("all");
      setIssueRuleFilter("all");

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

  const goToProjectIssue = (projectIssue: ProjectIssue) => {
    const { issue, file, fileIndex } = projectIssue;

    setSelectedProjectFile(fileIndex);

    setFileName(file.name);
    setLanguage(file.language);
    setCode(file.code);
    setReport(file.report);

    clearMarkers();

    if (file.report) {
      setTimeout(() => {
        updateMarkers(file.report?.issues ?? []);

        goToIssue(issue);
      }, 0);
    }
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
        config: analyzerConfig,
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

  const formatPresetName = (preset: ActivePreset) => {
    return preset.charAt(0).toUpperCase() + preset.slice(1);
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

          <button
            className={settingsOpen ? "active" : ""}
            type="button"
            onClick={() => setSettingsOpen((current) => !current)}
          >
            Settings
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

      <input
        ref={configInputRef}
        className="file-input"
        type="file"
        accept=".json,application/json"
        onChange={handleConfigImport}
      />

      {settingsOpen && (
        <section className="settings-panel">
          <div className="settings-header">
            <div>
              <h2>Analyzer settings</h2>

              <p>Customize the rules and thresholds used during analysis.</p>

              <div className="active-preset">
                <span>Active preset:</span>

                <strong>{formatPresetName(activePreset)}</strong>
              </div>

              <div className="preset-buttons">
                <button
                  type="button"
                  className={activePreset === "strict" ? "active" : ""}
                  onClick={() => applyPreset("strict")}
                >
                  Strict
                </button>

                <button
                  type="button"
                  className={activePreset === "balanced" ? "active" : ""}
                  onClick={() => applyPreset("balanced")}
                >
                  Balanced
                </button>

                <button
                  type="button"
                  className={activePreset === "relaxed" ? "active" : ""}
                  onClick={() => applyPreset("relaxed")}
                >
                  Relaxed
                </button>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="settings-secondary-button"
                type="button"
                onClick={exportAnalyzerConfig}
              >
                Export config
              </button>

              <button
                className="settings-secondary-button"
                type="button"
                onClick={openConfigPicker}
              >
                Import config
              </button>

              <button
                className="reset-settings-button"
                type="button"
                onClick={resetAnalyzerConfig}
              >
                Reset defaults
              </button>
            </div>
          </div>

          <div className="settings-grid">
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={analyzerConfig.noAny}
                onChange={(event) =>
                  handleConfigChange("noAny", event.target.checked)
                }
              />

              <div>
                <strong>No any</strong>

                <span>Flag usage of the TypeScript any type.</span>
              </div>
            </label>

            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={analyzerConfig.noConsole}
                onChange={(event) =>
                  handleConfigChange("noConsole", event.target.checked)
                }
              />

              <div>
                <strong>No console</strong>

                <span>Flag console statements in production code.</span>
              </div>
            </label>

            <label className="setting-number">
              <span>Max function length</span>

              <input
                type="number"
                min="1"
                value={analyzerConfig.maxFunctionLength}
                onChange={(event) =>
                  handleConfigChange(
                    "maxFunctionLength",
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />

              <small>Balanced default: 50 lines</small>
            </label>

            <label className="setting-number">
              <span>Max parameters</span>

              <input
                type="number"
                min="1"
                value={analyzerConfig.maxParameters}
                onChange={(event) =>
                  handleConfigChange(
                    "maxParameters",
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />

              <small>Balanced default: 4 parameters</small>
            </label>

            <label className="setting-number">
              <span>Max complexity</span>

              <input
                type="number"
                min="1"
                value={analyzerConfig.maxComplexity}
                onChange={(event) =>
                  handleConfigChange(
                    "maxComplexity",
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />

              <small>Balanced default: 10</small>
            </label>

            <label className="setting-number">
              <span>Max nesting depth</span>

              <input
                type="number"
                min="1"
                value={analyzerConfig.maxNestingDepth}
                onChange={(event) =>
                  handleConfigChange(
                    "maxNestingDepth",
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
              />

              <small>Balanced default: 3 levels</small>
            </label>
          </div>
        </section>
      )}

      {mode === "project" && projectSummary && (
        <section className="project-summary">
          <div className="project-score">
            <span>Project health</span>

            <strong>{projectSummary.score}</strong>

            <span>/ 100</span>
          </div>

          <div className="project-summary-metrics">
            <div>
              <strong>{projectSummary.files}</strong>

              <span>Files</span>
            </div>

            <div>
              <strong>{projectSummary.totalIssues}</strong>

              <span>Issues</span>
            </div>

            <div>
              <strong>{projectSummary.linesOfCode}</strong>

              <span>Lines</span>
            </div>

            <div>
              <strong>{projectSummary.functions}</strong>

              <span>Functions</span>
            </div>
          </div>

          <div className="project-severity">
            <span>High: {projectSummary.high}</span>

            <span>Medium: {projectSummary.medium}</span>

            <span>Low: {projectSummary.low}</span>
          </div>
        </section>
      )}

      {mode === "project" && projectIssues.length > 0 && (
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
                    onClick={() => setIssueSeverityFilter(severity)}
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
                onChange={(event) => setIssueRuleFilter(event.target.value)}
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
                  onClick={() => goToProjectIssue(projectIssue)}
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
      )}

      <section
        className={`workspace ${mode === "project" ? "project-mode" : ""}`}
      >
        {mode === "project" && (
          <aside className="project-sidebar">
            <div className="project-sidebar-header">
              <div>
                <h3>Project files</h3>

                <span className="visible-files-count">
                  {visibleProjectFiles.length} / {projectFiles.length}
                </span>
              </div>
            </div>

            <div className="file-filters">
              <button
                type="button"
                className={fileFilter === "all" ? "active" : ""}
                onClick={() => setFileFilter("all")}
              >
                All
              </button>

              <button
                type="button"
                className={fileFilter === "issues" ? "active" : ""}
                onClick={() => setFileFilter("issues")}
              >
                Issues
              </button>

              <button
                type="button"
                className={fileFilter === "clean" ? "active" : ""}
                onClick={() => setFileFilter("clean")}
              >
                Clean
              </button>
            </div>

            <label className="sort-control">
              <span>Sort by</span>

              <select
                value={fileSort}
                onChange={(event) =>
                  setFileSort(event.target.value as FileSort)
                }
              >
                <option value="issues">Most issues</option>

                <option value="name">Name</option>
              </select>
            </label>

            <div className="project-file-list">
              {visibleProjectFiles.length === 0 ? (
                <div className="no-files">No files match this filter.</div>
              ) : (
                visibleProjectFiles.map(({ file, originalIndex }) => (
                  <button
                    key={`${file.path}-${originalIndex}`}
                    type="button"
                    className={
                      selectedProjectFile === originalIndex
                        ? "project-file active"
                        : "project-file"
                    }
                    onClick={() => selectProjectFile(originalIndex)}
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
                ))
              )}
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
