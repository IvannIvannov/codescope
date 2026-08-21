import type { Language, ProjectFile } from "../types";

export function createSafeFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "analysis"
  );
}

export function escapeCsvValue(value: string | number | undefined) {
  const stringValue = value === undefined ? "" : String(value);

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function getProjectName(files: ProjectFile[]) {
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
}

export function getLanguageFromFile(name: string): Language {
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
}

export function isSupportedFile(name: string) {
  const lowerName = name.toLowerCase();

  return (
    lowerName.endsWith(".ts") ||
    lowerName.endsWith(".tsx") ||
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".jsx")
  );
}
