export function analyzeCode(code: string) {
  return {
    lines: code.split("\n").length,
    characters: code.length,
  };
}
