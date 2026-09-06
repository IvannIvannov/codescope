import { describe, expect, it } from "vitest";

import { analyzeCode, type AnalyzerConfig } from "../src/index.js";

const relaxedConfig: AnalyzerConfig = {
  noAny: false,
  noConsole: false,
  maxFunctionLength: 1000,
  maxParameters: 100,
  maxComplexity: 100,
  maxNestingDepth: 100,
};

describe("CodeScope analyzer", () => {
  it("returns a clean report for simple valid code", () => {
    const code = `
      function add(a: number, b: number) {
        return a + b;
      }
    `;

    const report = analyzeCode(code, relaxedConfig);

    expect(report.summary.totalIssues).toBe(0);
    expect(report.score).toBe(100);
  });

  it("detects explicit any types", () => {
    const code = `
      function greet(name: any) {
        return name;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      noAny: true,
    });

    const issues = report.issues.filter((issue) => issue.rule === "no-any");

    expect(issues.length).toBeGreaterThan(0);
  });

  it("does not report any when noAny is disabled", () => {
    const code = `
      function greet(name: any) {
        return name;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      noAny: false,
    });

    expect(report.issues.some((issue) => issue.rule === "no-any")).toBe(false);
  });

  it("detects console usage", () => {
    const code = `
      function greet(name: string) {
        console.log(name);
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      noConsole: true,
    });

    expect(report.issues.some((issue) => issue.rule === "no-console")).toBe(
      true,
    );
  });

  it("does not treat normal property access as console usage", () => {
    const code = `
      const user = {
        name: "CodeScope",
      };

      const name = user.name;
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      noConsole: true,
    });

    expect(report.issues.some((issue) => issue.rule === "no-console")).toBe(
      false,
    );
  });

  it("detects functions with too many parameters", () => {
    const code = `
      function calculate(
        first: number,
        second: number,
        third: number,
        fourth: number
      ) {
        return first + second + third + fourth;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      maxParameters: 3,
    });

    expect(report.issues.some((issue) => issue.rule === "max-parameters")).toBe(
      true,
    );
  });

  it("detects functions that exceed the maximum length", () => {
    const code = `
      function longFunction() {
        const a = 1;
        const b = 2;
        const c = 3;
        const d = 4;
        const e = 5;

        return a + b + c + d + e;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      maxFunctionLength: 5,
    });

    expect(
      report.issues.some((issue) => issue.rule === "max-function-length"),
    ).toBe(true);
  });

  it("detects excessive cyclomatic complexity", () => {
    const code = `
      function check(
        a: boolean,
        b: boolean,
        c: boolean
      ) {
        if (a) {
          return 1;
        }

        if (b) {
          return 2;
        }

        if (c) {
          return 3;
        }

        return 0;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      maxComplexity: 2,
    });

    expect(report.issues.some((issue) => issue.rule === "complexity")).toBe(
      true,
    );
  });

  it("detects excessive nesting depth", () => {
    const code = `
      function check(
        first: boolean,
        second: boolean,
        third: boolean
      ) {
        if (first) {
          if (second) {
            if (third) {
              return true;
            }
          }
        }

        return false;
      }
    `;

    const report = analyzeCode(code, {
      ...relaxedConfig,
      maxNestingDepth: 2,
    });

    expect(report.issues.some((issue) => issue.rule === "deep-nesting")).toBe(
      true,
    );
  });
});
