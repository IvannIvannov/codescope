import type { AnalyzerConfig, AnalyzerPreset } from "./types";

export const STORAGE_KEY = "codescope-analyzer-config";

export const HISTORY_STORAGE_KEY = "codescope-analysis-history";

export const MAX_HISTORY_ITEMS = 10;

export const initialCode = `function test(value: any) {
  console.log(value);
}`;

export const defaultAnalyzerConfig: AnalyzerConfig = {
  noAny: true,
  noConsole: true,
  maxFunctionLength: 50,
  maxParameters: 4,
  maxComplexity: 10,
  maxNestingDepth: 3,
};

export const analyzerPresets: Record<AnalyzerPreset, AnalyzerConfig> = {
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
