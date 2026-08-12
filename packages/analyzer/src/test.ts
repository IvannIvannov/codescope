import { analyzeCode } from "./index.js";

const testCode = `
function printUser(user: any) {
  console.log(user);
}

const data: any = {
  name: "John"
};
`;

const longFunctionCode = `
function processEverything() {
${Array.from({ length: 55 }, (_, i) => `  const value${i} = ${i};`).join("\n")}
}
`;

console.log("Basic analysis:");
console.log(analyzeCode(testCode));

console.log("\nLong function analysis:");
console.log(analyzeCode(longFunctionCode));
