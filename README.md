# CodeScope

CodeScope is a full-stack code quality analyzer for JavaScript and TypeScript projects. It analyzes source code, detects common code quality issues, calculates a quality score, and provides clear suggestions for improving maintainability.

The application supports both individual code analysis and complete project analysis through a modern web interface.

## Features

- Analyze individual JavaScript and TypeScript files
- Analyze complete projects and folders
- Automatic code quality score from 0 to 100
- Severity classification for detected issues
- Detailed suggestions for improving code
- Monaco-based code editor with issue markers
- Navigate directly from an issue to the affected line
- Filter project files by issue status
- Sort files by name or number of issues
- Filter project issues by severity and rule
- Configurable analyzer rules and thresholds
- Relaxed, Balanced, and Strict presets
- Custom analyzer configuration
- Import and export analyzer configuration as JSON
- Analysis history stored locally
- Compare previous analysis results
- Code quality score trend visualization
- Export analysis reports as JSON or CSV
- REST API for code analysis

## Screenshots

> Screenshots of the CodeScope interface will be added here.

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

### Analyzer

- TypeScript
- ts-morph
- Custom static analysis rules

### Testing

- Vitest

## Architecture

CodeScope is organized as an npm workspace monorepo:

```text
codescope/
├── apps/
│   ├── api/
│   │   └── src/
│   └── web/
│       └── src/
├── packages/
│   └── analyzer/
│       ├── src/
│       │   └── rules/
│       └── tests/
├── package.json
└── README.md
```

The project consists of three main parts:

**Web application**  
Provides the user interface, Monaco code editor, project explorer, settings, history, comparisons, charts, and report exports.

**API**  
Provides the HTTP interface between the frontend and the analyzer.

**Analyzer**  
Contains the static analysis engine and individual code quality rules.

## Analyzer Rules

CodeScope currently includes the following rules:

| Rule                  | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `no-any`              | Detects explicit use of the TypeScript `any` type               |
| `no-console`          | Detects usage of `console.*`                                    |
| `max-function-length` | Detects functions exceeding the configured line limit           |
| `max-parameters`      | Detects functions with too many parameters                      |
| `complexity`          | Detects functions exceeding the configured complexity threshold |
| `deep-nesting`        | Detects excessive nesting depth                                 |

Each rule contributes to the final analysis report and helps identify areas that may reduce code readability and maintainability.

## Analysis Modes

### Code Mode

Code Mode allows you to paste code directly into the editor or open a supported source file and analyze it individually.

Supported file types include:

```text
.ts
.tsx
.js
.jsx
```

### Project Mode

Project Mode allows you to open a project folder and analyze multiple supported source files at once.

CodeScope generates:

- Overall project health score
- Total issue count
- Severity breakdown
- File-level scores
- Project metrics
- Navigable issue list

## Analyzer Configuration

The analyzer can be customized using several thresholds:

```json
{
  "noAny": true,
  "noConsole": true,
  "maxFunctionLength": 50,
  "maxParameters": 4,
  "maxComplexity": 10,
  "maxNestingDepth": 3
}
```

CodeScope also provides three predefined configuration presets:

- **Relaxed** — fewer restrictions
- **Balanced** — balanced defaults for general development
- **Strict** — stronger code quality requirements

Changing individual settings automatically switches the active configuration to **Custom**.

Analyzer configuration is persisted locally in the browser and can also be imported or exported as JSON.

## Analysis History

CodeScope stores recent analysis results locally in the browser.

The History panel allows you to:

- Review previous analyses
- Compare two analysis results
- Track score changes
- Compare issue counts and severity
- Filter score trends between code and project analyses

## Report Export

Analysis results can be exported in:

- JSON
- CSV

Project exports include the project summary as well as individual file reports and detected issues.

## Getting Started

### Requirements

Make sure you have installed:

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd codescope
```

Install dependencies:

```bash
npm install
```

## Environment Variables

### Web

Create:

```text
apps/web/.env
```

You can use:

```text
apps/web/.env.example
```

as a template.

```env
VITE_API_URL=http://localhost:3000
```

### API

Create:

```text
apps/api/.env
```

You can use:

```text
apps/api/.env.example
```

as a template.

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
```

## Running Locally

Start the API:

```bash
npm run dev --workspace=@codescope/api
```

Start the web application in another terminal:

```bash
npm run dev --workspace=@codescope/web
```

The web application will normally be available at:

```text
http://localhost:5173
```

The API will normally be available at:

```text
http://localhost:3000
```

API health endpoint:

```text
GET /health
```

Code analysis endpoint:

```text
POST /analyze/code
```

## Testing

The analyzer includes automated tests covering the core analysis rules and important regression scenarios.

Run the tests with:

```bash
npm test --workspace=@codescope/analyzer
```

Current test suite:

```text
9 tests
```

The tests cover:

- Clean code analysis
- Explicit `any` detection
- Disabled `no-any` behavior
- Console usage detection
- `no-console` property-access regression
- Maximum parameters
- Maximum function length
- Complexity
- Nesting depth

## Production Build

Build the web application:

```bash
npm run build --workspace=@codescope/web
```

Build the API:

```bash
npm run build --workspace=@codescope/api
```

Build the analyzer:

```bash
npm run build --workspace=@codescope/analyzer
```

## Example

Given code such as:

```ts
function calculate(
  first: any,
  second: any,
  third: number,
  fourth: number,
  fifth: number,
) {
  console.log("calculating");

  return first + second + third + fourth + fifth;
}
```

CodeScope can identify issues such as explicit `any` usage, console usage, and excessive function parameters depending on the selected analyzer configuration.

The result includes a quality score, severity information, source location, and suggestions for improving the code.

## Project Status

CodeScope currently includes:

- Functional static analysis engine
- Six configurable analyzer rules
- Code and project analysis
- REST API
- React web interface
- Monaco Editor integration
- Project issue navigation
- Configurable presets
- Persistent analyzer settings
- Analysis history and comparisons
- Score trend visualization
- JSON and CSV report export
- Automated analyzer tests
- Production-ready environment configuration

## Future Improvements

Potential future improvements include:

- Additional static analysis rules
- GitHub repository analysis
- Improved syntax and issue visualization
- More detailed project statistics
- CI integration
- Additional report formats

## Author

Developed as a full-stack software engineering project focused on static code analysis, developer tooling, and code quality.
