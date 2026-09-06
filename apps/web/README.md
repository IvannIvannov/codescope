# CodeScope

**CodeScope** is a full-stack code quality analyzer for JavaScript and TypeScript projects.

It analyzes source code, detects common maintainability and quality issues, calculates a code quality score, and provides actionable suggestions for improvement.

🔗 **Live Demo:** https://codescope-n5t7.onrender.com  
💻 **GitHub:** https://github.com/IvannIvannov/codescope

---

## Features

### Code Analysis

Analyze individual JavaScript or TypeScript files directly in the browser.

CodeScope detects:

- Explicit `any` usage
- `console` statements
- Long functions
- Functions with too many parameters
- High cyclomatic complexity
- Deeply nested code

Each analysis returns:

- Code quality score
- Number of detected issues
- Severity levels
- File metrics
- Line and column locations
- Suggestions for improvement

---

## Project Analysis

CodeScope can also analyze an entire project.

Supported files:

- `.ts`
- `.tsx`
- `.js`
- `.jsx`

Project mode includes:

- Overall project health score
- Per-file scores
- Total issue count
- Severity breakdown
- File filtering
- File sorting
- Project-wide issue explorer
- Direct navigation from an issue to the affected file and line

---

## Interactive Code Editor

The application uses the Monaco Editor to provide a development experience similar to modern IDEs.

Features include:

- Syntax highlighting
- Code editing
- Line navigation
- Analyzer issue markers
- Automatic file language detection

---

## Analyzer Settings

Analyzer behavior can be customized directly from the interface.

Available settings:

- Detect explicit `any`
- Detect `console` usage
- Maximum function length
- Maximum number of parameters
- Maximum complexity
- Maximum nesting depth

### Presets

CodeScope includes three predefined analyzer configurations:

- **Relaxed**
- **Balanced**
- **Strict**

Changing individual settings automatically creates a **Custom** configuration.

Analyzer settings are persisted locally in the browser.

---

## Configuration Import & Export

Analyzer configurations can be exported as JSON and imported again later.

Example:

```json
{
  "noAny": true,
  "noConsole": true,
  "maxFunctionLength": 40,
  "maxParameters": 4,
  "maxComplexity": 8,
  "maxNestingDepth": 2
}
```

Invalid configuration files are detected and reported directly in the settings panel.

---

## Analysis History

CodeScope keeps analysis history in the browser using local storage.

History features include:

- Previous code analyses
- Previous project analyses
- Score tracking
- Analysis comparison
- Score trend visualization
- Code / Project history filtering

Two analysis runs can be selected and compared directly.

---

## Report Export

Analysis results can be exported for further use.

Supported formats:

- JSON
- CSV

Project reports include both aggregate project metrics and individual file results.

---

## Architecture

CodeScope is built as an npm workspaces monorepo.

```text
codescope/
├── apps/
│   ├── api/
│   │   └── Fastify REST API
│   │
│   └── web/
│       └── React + Vite frontend
│
└── packages/
    └── analyzer/
        └── Code analysis engine
```

The analyzer is separated from both the frontend and API, allowing the core analysis logic to be reused independently.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Monaco Editor

### Backend

- Node.js
- Fastify
- TypeScript
- `@fastify/cors`

### Analyzer

- TypeScript
- ts-morph

### Testing

- Vitest

### Deployment

- Render Static Site
- Render Web Service

---

## API

The backend exposes an API used by the web application.

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

### Analyze Code

```http
POST /analyze/code
```

Example request:

```json
{
  "code": "function test(value: any) { console.log(value); }"
}
```

An optional analyzer configuration can also be provided.

---

## Local Development

### Requirements

- Node.js
- npm

### Clone the repository

```bash
git clone https://github.com/IvannIvannov/codescope.git
cd codescope
```

### Install dependencies

```bash
npm install
```

---

## Run the API

From the repository root:

```bash
npm run dev --workspace=@codescope/api
```

The API runs by default on:

```text
http://localhost:3000
```

---

## Run the Web Application

Open another terminal and run:

```bash
npm run dev --workspace=@codescope/web
```

The frontend runs by default on:

```text
http://localhost:5173
```

---

## Environment Variables

### API

Create:

```text
apps/api/.env
```

Example:

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

A template is available in:

```text
apps/api/.env.example
```

### Web

Create:

```text
apps/web/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000
```

A template is available in:

```text
apps/web/.env.example
```

---

## Production Build

Build the analyzer:

```bash
npm run build --workspace=@codescope/analyzer
```

Build the API:

```bash
npm run build --workspace=@codescope/api
```

Build the frontend:

```bash
npm run build --workspace=@codescope/web
```

---

## Tests

The analyzer contains automated tests covering the main analysis rules and regression cases.

Run them with:

```bash
npm test --workspace=@codescope/analyzer
```

The current analyzer test suite contains **9 automated tests**.

---

## Example

Input:

```ts
function test(value: any) {
  console.log(value);
}
```

CodeScope can detect:

- Explicit `any`
- Console usage

The resulting report includes the detected issues, their severity, source location, suggestions, metrics, and an overall quality score.

---

## Project Status

CodeScope currently includes:

- Code analysis
- Project analysis
- Multiple analyzer rules
- Configurable thresholds
- Analyzer presets
- Monaco Editor integration
- Project issue navigation
- Analysis history
- Analysis comparison
- Score trends
- JSON and CSV exports
- Configuration import/export
- Persistent browser settings
- Automated analyzer tests
- REST API
- Production deployment

---

## Live Application

Try CodeScope here:

**https://codescope-n5t7.onrender.com**

---

## Author

Developed by **Ivan Ivanov**.

GitHub: https://github.com/IvannIvannov