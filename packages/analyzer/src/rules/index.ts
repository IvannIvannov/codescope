import type { AnalysisRule } from "../types.js";
import { noAnyRule } from "./no-any.js";
import { noConsoleRule } from "./no-console.js";

export const rules: AnalysisRule[] = [noAnyRule, noConsoleRule];
