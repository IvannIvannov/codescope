import type { AnalysisRule } from "../types.js";
import { noAnyRule } from "./no-any.js";
import { noConsoleRule } from "./no-console.js";
import { maxFunctionLengthRule } from "./max-function-length.js";
import { maxParametersRule } from "./max-parameters.js";
import { complexityRule } from "./complexity.js";

export const rules: AnalysisRule[] = [
  noAnyRule,
  noConsoleRule,
  maxFunctionLengthRule,
  maxParametersRule,
  complexityRule,
];
