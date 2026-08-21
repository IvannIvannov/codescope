import type { AnalyzerConfig } from "./types.js";

export const defaultConfig: AnalyzerConfig = {
  noAny: true,
  noConsole: true,
  maxFunctionLength: 50,
  maxParameters: 4,
  maxComplexity: 10,
  maxNestingDepth: 3,
};
