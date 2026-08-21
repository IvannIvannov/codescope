import Editor, { type OnMount } from "@monaco-editor/react";

import type { AnalysisMode, Language } from "../types";

interface EditorPanelProps {
  mode: AnalysisMode;
  code: string;
  fileName: string;
  language: Language;

  loading: boolean;
  error: string;

  projectFilesCount: number;

  onEditorMount: OnMount;

  onCodeChange: (value: string | undefined) => void;

  onOpenFile: () => void;
  onOpenProject: () => void;

  onAnalyzeCode: () => void;
  onAnalyzeProject: () => void;
}

function EditorPanel({
  mode,
  code,
  fileName,
  language,
  loading,
  error,
  projectFilesCount,
  onEditorMount,
  onCodeChange,
  onOpenFile,
  onOpenProject,
  onAnalyzeCode,
  onAnalyzeProject,
}: EditorPanelProps) {
  const analyzeDisabled =
    loading || (mode === "code" ? !code.trim() : projectFilesCount === 0);

  return (
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
              onClick={onOpenFile}
            >
              Open file
            </button>
          )}

          {mode === "project" && (
            <button
              className="upload-button"
              type="button"
              onClick={onOpenProject}
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
          onMount={onEditorMount}
          onChange={onCodeChange}
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
        type="button"
        onClick={mode === "project" ? onAnalyzeProject : onAnalyzeCode}
        disabled={analyzeDisabled}
      >
        {loading
          ? "Analyzing..."
          : mode === "project"
            ? `Analyze project (${projectFilesCount} files)`
            : "Analyze code"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default EditorPanel;
