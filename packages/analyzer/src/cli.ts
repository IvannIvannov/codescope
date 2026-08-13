#!/usr/bin/env node

import path from "node:path";
import { analyzeProject } from "./index.js";

const args = process.argv.slice(2);

const command = args[0];
const targetPath = args[1];

if (command !== "analyze") {
  console.log("Usage: codescope analyze <path>");
  process.exit(1);
}

if (!targetPath) {
  console.log("Please provide a project path.");
  process.exit(1);
}

const resolvedPath = path.resolve(targetPath);

const report = analyzeProject(resolvedPath);

console.log("\nCodeScope Analysis");
console.log("==================");
console.log(`Score: ${report.score}/100`);
console.log(`Files: ${report.metrics.files}`);
console.log(`Lines of code: ${report.metrics.linesOfCode}`);
console.log(`Functions: ${report.metrics.functions}`);

console.log("\nIssues");
console.log("------");
console.log(`High: ${report.summary.high}`);
console.log(`Medium: ${report.summary.medium}`);
console.log(`Low: ${report.summary.low}`);

for (const issue of report.issues) {
  console.log(`\n[${issue.severity.toUpperCase()}] ${issue.rule}`);

  if (issue.file) {
    console.log(`${issue.file}:${issue.line}`);
  }

  console.log(issue.message);
}
