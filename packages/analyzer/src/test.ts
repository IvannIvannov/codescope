import { analyzeCode } from "./index.js";

const testCode = `
function printUser(user: any) {
  console.log(user);
}

const data: any = {
  name: "John"
};
`;

const issues = analyzeCode(testCode);

console.log(issues);