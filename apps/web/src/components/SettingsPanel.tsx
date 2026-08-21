import type { ActivePreset, AnalyzerConfig, AnalyzerPreset } from "../types";

interface SettingsPanelProps {
  analyzerConfig: AnalyzerConfig;
  activePreset: ActivePreset;

  onApplyPreset: (preset: AnalyzerPreset) => void;

  onConfigChange: <K extends keyof AnalyzerConfig>(
    key: K,
    value: AnalyzerConfig[K],
  ) => void;

  onExportConfig: () => void;
  onImportConfig: () => void;
  onResetConfig: () => void;
}

function formatPresetName(preset: ActivePreset) {
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

function SettingsPanel({
  analyzerConfig,
  activePreset,
  onApplyPreset,
  onConfigChange,
  onExportConfig,
  onImportConfig,
  onResetConfig,
}: SettingsPanelProps) {
  return (
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
            {(["strict", "balanced", "relaxed"] as AnalyzerPreset[]).map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  className={activePreset === preset ? "active" : ""}
                  onClick={() => onApplyPreset(preset)}
                >
                  {formatPresetName(preset)}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="settings-secondary-button"
            type="button"
            onClick={onExportConfig}
          >
            Export config
          </button>

          <button
            className="settings-secondary-button"
            type="button"
            onClick={onImportConfig}
          >
            Import config
          </button>

          <button
            className="reset-settings-button"
            type="button"
            onClick={onResetConfig}
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
            onChange={(event) => onConfigChange("noAny", event.target.checked)}
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
              onConfigChange("noConsole", event.target.checked)
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
              onConfigChange(
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
              onConfigChange(
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
              onConfigChange(
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
              onConfigChange(
                "maxNestingDepth",
                Math.max(1, Number(event.target.value) || 1),
              )
            }
          />

          <small>Balanced default: 3 levels</small>
        </label>
      </div>
    </section>
  );
}

export default SettingsPanel;
