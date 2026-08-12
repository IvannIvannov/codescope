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

const manyParametersCode = `
function createUser(
  name: string,
  email: string,
  age: number,
  city: string,
  country: string,
  role: string
) {
  return { name, email, age, city, country, role };
}
`;

console.log("\nMany parameters analysis:");
console.log(analyzeCode(manyParametersCode));

console.log("Basic analysis:");
console.log(analyzeCode(testCode));

console.log("\nLong function analysis:");
console.log(analyzeCode(longFunctionCode));
