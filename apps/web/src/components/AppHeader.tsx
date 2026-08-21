import type { AnalysisMode } from "../types";

interface AppHeaderProps {
  mode: AnalysisMode;
  historyOpen: boolean;
  settingsOpen: boolean;

  onCodeMode: () => void;
  onProjectMode: () => void;
  onToggleHistory: () => void;
  onToggleSettings: () => void;
}

function AppHeader({
  mode,
  historyOpen,
  settingsOpen,
  onCodeMode,
  onProjectMode,
  onToggleHistory,
  onToggleSettings,
}: AppHeaderProps) {
  return (
    <header className="header">
      <div>
        <h1>CodeScope</h1>

        <p>Analyze your code quality in seconds.</p>
      </div>

      <div className="mode-switcher">
        <button
          className={mode === "code" ? "active" : ""}
          type="button"
          onClick={onCodeMode}
        >
          Code
        </button>

        <button
          className={mode === "project" ? "active" : ""}
          type="button"
          onClick={onProjectMode}
        >
          Project
        </button>

        <button
          className={historyOpen ? "active" : ""}
          type="button"
          onClick={onToggleHistory}
        >
          History
        </button>

        <button
          className={settingsOpen ? "active" : ""}
          type="button"
          onClick={onToggleSettings}
        >
          Settings
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
