import { useEffect, useMemo, useRef, useState } from "react";

import { type OnMount } from "@monaco-editor/react";

import EditorPanel from "./components/EditorPanel";
import HistoryPanel from "./components/HistoryPanel";
import ProjectIssuesPanel from "./components/ProjectIssuesPanel";
import ProjectSidebar from "./components/ProjectSidebar";
import ProjectSummaryPanel from "./components/ProjectSummaryPanel";
import ResultsPanel from "./components/ResultsPanel";
import SettingsPanel from "./components/SettingsPanel";

import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  STORAGE_KEY,
  analyzerPresets,
  defaultAnalyzerConfig,
  initialCode,
} from "./config";

import type {
  ActivePreset,
  AnalysisHistoryEntry,
  AnalysisMode,
  AnalysisReport,
  AnalyzerConfig,
  AnalyzerPreset,
  FileFilter,
  FileSort,
  HistoryComparison,
  IssueSeverityFilter,
  Language,
  ProjectFile,
  ProjectIssue,
  ProjectSummary,
  Severity,
  TrendMode,
  TrendPoint,
} from "./types";

import "./App.css";

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

  const [analysisHistory, setAnalysisHistory] = useState<
    AnalysisHistoryEntry[]
  >(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!savedHistory) {
      return [];
    }

    try {
      const parsedHistory = JSON.parse(savedHistory);

      if (!Array.isArray(parsedHistory)) {
        return [];
      }

      return parsedHistory.slice(
        0,
        MAX_HISTORY_ITEMS,
      ) as AnalysisHistoryEntry[];
    } catch {
      return [];
    }
  });

  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);

  const [trendMode, setTrendMode] = useState<TrendMode>("all");

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyzerConfig));
  }, [analyzerConfig]);

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(analysisHistory));
  }, [analysisHistory]);

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

  const historyComparison = useMemo<HistoryComparison | null>(() => {
    if (selectedHistoryIds.length !== 2) {
      return null;
    }

    const selectedEntries = selectedHistoryIds
      .map((id) => analysisHistory.find((entry) => entry.id === id))
      .filter((entry): entry is AnalysisHistoryEntry => entry !== undefined);

    if (selectedEntries.length !== 2) {
      return null;
    }

    const sortedEntries = [...selectedEntries].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const older = sortedEntries[0];

    const newer = sortedEntries[1];

    return {
      older,
      newer,

      score: newer.score - older.score,

      totalIssues: newer.totalIssues - older.totalIssues,

      high: newer.high - older.high,

      medium: newer.medium - older.medium,

      low: newer.low - older.low,
    };
  }, [selectedHistoryIds, analysisHistory]);

  const trendEntries = useMemo(() => {
    const filtered = analysisHistory.filter(
      (entry) => trendMode === "all" || entry.mode === trendMode,
    );

    return filtered.slice(0, MAX_HISTORY_ITEMS).reverse();
  }, [analysisHistory, trendMode]);

  const trendPoints = useMemo<TrendPoint[]>(() => {
    if (trendEntries.length === 0) {
      return [];
    }

    const leftPadding = 60;

    const rightPadding = 960;

    const topPadding = 30;

    const chartHeight = 160;

    return trendEntries.map((entry, index) => {
      const x =
        trendEntries.length === 1
          ? 510
          : leftPadding +
            (index / (trendEntries.length - 1)) * (rightPadding - leftPadding);

      const y = topPadding + ((100 - entry.score) / 100) * chartHeight;

      return {
        entry,
        x,
        y,
      };
    });
  }, [trendEntries]);

  const trendPolyline = useMemo(() => {
    return trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  }, [trendPoints]);

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

  const addHistoryEntry = (
    entry: Omit<AnalysisHistoryEntry, "id" | "createdAt">,
  ) => {
    const historyEntry: AnalysisHistoryEntry = {
      ...entry,

      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

      createdAt: new Date().toISOString(),
    };

    setAnalysisHistory((currentHistory) =>
      [historyEntry, ...currentHistory].slice(0, MAX_HISTORY_ITEMS),
    );
  };

  const clearHistory = () => {
    setAnalysisHistory([]);

    setSelectedHistoryIds([]);
  };

  const toggleHistorySelection = (id: string) => {
    setSelectedHistoryIds((currentSelection) => {
      if (currentSelection.includes(id)) {
        return currentSelection.filter((selectedId) => selectedId !== id);
      }

      if (currentSelection.length >= 2) {
        return [currentSelection[1], id];
      }

      return [...currentSelection, id];
    });
  };

  const clearHistorySelection = () => {
    setSelectedHistoryIds([]);
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

  const downloadTextFile = (
    content: string,

    fileNameToDownload: string,

    mimeType: string,
  ) => {
    const blob = new Blob([content], {
      type: mimeType,
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = fileNameToDownload;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const createSafeFileName = (value: string) => {
    return (
      value
        .toLowerCase()
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "analysis"
    );
  };

  const escapeCsvValue = (value: string | number | undefined) => {
    const stringValue = value === undefined ? "" : String(value);

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const getProjectName = (files: ProjectFile[]) => {
    const firstPath = files[0]?.path;

    if (!firstPath) {
      return "Project";
    }

    const normalizedPath = firstPath.replace(/\\/g, "/");

    const parts = normalizedPath.split("/");

    if (parts.length > 1) {
      return parts[0];
    }

    return "Project";
  };

  const exportReportJson = () => {
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
  };

  const exportReportCsv = () => {
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
  };

  const exportAnalyzerConfig = () => {
    const json = JSON.stringify(analyzerConfig, null, 2);

    downloadTextFile(json, "codescope-config.json", "application/json");
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

  const updateMarkers = (issues: AnalysisReport["issues"]) => {
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

  const goToIssue = (issue: AnalysisReport["issues"][number]) => {
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

  const createProjectSummary = (files: ProjectFile[]): ProjectSummary => {
    const reports = files
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
  };

  const analyzeCode = async () => {
    setLoading(true);

    setError("");

    try {
      const newReport = await requestAnalysis(code);

      setReport(newReport);

      updateMarkers(newReport.issues);

      addHistoryEntry({
        mode: "code",

        name: fileName,

        score: newReport.score,

        totalIssues: newReport.summary.totalIssues,

        high: newReport.summary.high,

        medium: newReport.summary.medium,

        low: newReport.summary.low,

        preset: activePreset,

        linesOfCode: newReport.metrics.linesOfCode,

        functions: newReport.metrics.functions,
      });
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

      const finalProjectSummary = createProjectSummary(analyzedFiles);

      addHistoryEntry({
        mode: "project",

        name: getProjectName(analyzedFiles),

        score: finalProjectSummary.score,

        totalIssues: finalProjectSummary.totalIssues,

        high: finalProjectSummary.high,

        medium: finalProjectSummary.medium,

        low: finalProjectSummary.low,

        preset: activePreset,

        files: finalProjectSummary.files,

        linesOfCode: finalProjectSummary.linesOfCode,

        functions: finalProjectSummary.functions,
      });

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

  const formatHistoryDate = (value: string) => {
    const date = new Date(value);

    return date.toLocaleString(undefined, {
      dateStyle: "medium",

      timeStyle: "short",
    });
  };

  const formatTrendDate = (value: string) => {
    const date = new Date(value);

    return date.toLocaleDateString(undefined, {
      month: "short",

      day: "numeric",
    });
  };

  const formatDelta = (value: number) => {
    if (value > 0) {
      return `+${value}`;
    }

    return `${value}`;
  };

  const getScoreDeltaClass = (value: number) => {
    if (value > 0) {
      return "improved";
    }

    if (value < 0) {
      return "worse";
    }

    return "unchanged";
  };

  const getIssueDeltaClass = (value: number) => {
    if (value < 0) {
      return "improved";
    }

    if (value > 0) {
      return "worse";
    }

    return "unchanged";
  };

  const canExportReport =
    mode === "project" ? projectSummary !== null : report !== null;

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
            className={historyOpen ? "active" : ""}
            type="button"
            onClick={() => setHistoryOpen((current) => !current)}
          >
            History
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

      {historyOpen && (
        <HistoryPanel
          analysisHistory={analysisHistory}
          selectedHistoryIds={selectedHistoryIds}
          trendMode={trendMode}
          trendEntries={trendEntries}
          trendPoints={trendPoints}
          trendPolyline={trendPolyline}
          historyComparison={historyComparison}
          onTrendModeChange={setTrendMode}
          onToggleHistorySelection={toggleHistorySelection}
          onClearHistorySelection={clearHistorySelection}
          onClearHistory={clearHistory}
          formatPresetName={formatPresetName}
          formatHistoryDate={formatHistoryDate}
          formatTrendDate={formatTrendDate}
          formatDelta={formatDelta}
          getScoreDeltaClass={getScoreDeltaClass}
          getIssueDeltaClass={getIssueDeltaClass}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          analyzerConfig={analyzerConfig}
          activePreset={activePreset}
          onApplyPreset={applyPreset}
          onConfigChange={handleConfigChange}
          onExportConfig={exportAnalyzerConfig}
          onImportConfig={openConfigPicker}
          onResetConfig={resetAnalyzerConfig}
        />
      )}

      {mode === "project" && projectSummary && (
        <ProjectSummaryPanel summary={projectSummary} />
      )}

      {mode === "project" && projectIssues.length > 0 && (
        <ProjectIssuesPanel
          projectIssues={projectIssues}
          visibleProjectIssues={visibleProjectIssues}
          issueSeverityFilter={issueSeverityFilter}
          issueRuleFilter={issueRuleFilter}
          availableIssueRules={availableIssueRules}
          onSeverityFilterChange={setIssueSeverityFilter}
          onRuleFilterChange={setIssueRuleFilter}
          onGoToProjectIssue={goToProjectIssue}
        />
      )}

      <section
        className={`workspace ${mode === "project" ? "project-mode" : ""}`}
      >
        {mode === "project" && (
          <ProjectSidebar
            projectFiles={projectFiles}
            visibleProjectFiles={visibleProjectFiles}
            selectedProjectFile={selectedProjectFile}
            fileFilter={fileFilter}
            fileSort={fileSort}
            onFileFilterChange={setFileFilter}
            onFileSortChange={setFileSort}
            onSelectProjectFile={selectProjectFile}
          />
        )}

        <EditorPanel
          mode={mode}
          code={code}
          fileName={fileName}
          language={language}
          loading={loading}
          error={error}
          projectFilesCount={projectFiles.length}
          onEditorMount={handleEditorMount}
          onCodeChange={handleCodeChange}
          onOpenFile={openFilePicker}
          onOpenProject={openFolderPicker}
          onAnalyzeCode={analyzeCode}
          onAnalyzeProject={analyzeProject}
        />

        <ResultsPanel
          mode={mode}
          report={report}
          canExportReport={canExportReport}
          onGoToIssue={goToIssue}
          onExportJson={exportReportJson}
          onExportCsv={exportReportCsv}
        />
      </section>
    </main>
  );
}

export default App;
