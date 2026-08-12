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

const complexFunctionCode = `
function processOrder(order: unknown) {
  if (order) {
    if (true) {
      if (true) {
        console.log("processing");
      }
    }
  }

  for (let i = 0; i < 10; i++) {
    if (i > 2) {
      if (i < 8) {
        console.log(i);
      }
    }
  }

  while (false) {
    if (true) {
      console.log("waiting");
    }
  }

  const result = true && true;
  const fallback = false || true;

  return result || fallback;
}
`;

console.log("\nComplexity analysis:");
console.log(analyzeCode(complexFunctionCode));

console.log("\nMany parameters analysis:");
console.log(analyzeCode(manyParametersCode));

console.log("Basic analysis:");
console.log(analyzeCode(testCode));

console.log("\nLong function analysis:");
console.log(analyzeCode(longFunctionCode));
