# Development Guide

This guide provides information for developers working on or contributing to the `bootstrap-css-variables-transformer` project.

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/YourUsername/bootstrap-css-variables-transformer.git
   cd bootstrap-css-variables-transformer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Development Commands

- **Build:** Compile TypeScript to JavaScript in the `dist/` directory.

  ```bash
  npm run build
  ```

- **Test:** Run unit tests using Vitest.

  ```bash
  npm run test
  ```

- **Test with Coverage:** Run tests and generate a coverage report.

  ```bash
  npm run test -- --coverage
  # or
  npm run test:coverage
  ```

- **Lint:** Lint and format code using Biome.

  ```bash
  npm run lint
  ```

- **Validate Output CSS:** Checks `output/all.css` (if it exists) for syntax validity using `lightningcss`. Useful for quickly checking the transformer's output.

  ```bash
  npm run validate:css
  ```

- **Run CLI Locally:** Execute the CLI tool using the compiled code.

  ```bash
  node dist/bin/cli.js --help
  ```

## Project Structure

The project follows this structure:

```shell
bootstrap-css-variables-transformer/
├── src/
│   ├── bin/
│   │   ├── cli.ts               # Main CLI entry point
│   │   └── extract-variables.ts # Script to extract vars
│   ├── lib/
│   │   ├── transformer.ts       # Main transformation logic (AST & Regex)
│   │   └── mapping-loader.ts    # Loads and processes mapping files
│   └── schemas/
│       └── configSchema.ts      # Zod schema for configuration validation
├── dist/                        # Compiled JavaScript output
├── input/                       # Example input CSS files
├── output/                      # Example output transformed CSS
├── config/                      # Example configuration files
├── docs/                        # Documentation files (like this one)
├── scripts/                     # Helper scripts
├── tests/
│   ├── fixtures/                # Test input/output files
│   ├── bin/
│   │   ├── cli.test.ts
│   │   └── extract-variables.test.ts # Tests for extract script
│   └── lib/
│       ├── mapping-loader.test.ts
│       └── transformer.test.ts
├── .cursor/                     # Cursor AI configuration
│   └── rules                    # AI prompt rules
├── .gitignore
├── biome.json                   # Biome linter/formatter config
├── config.json                  # Root config (likely example/test)
├── .markdownlint.json           # Markdown linting config
├── package.json
├── package-lock.json
├── README.md                    # Main project README
├── tsconfig.json                # TypeScript configuration
└── vitest.config.ts             # Vitest configuration
```

## AI Assistant Configuration (`.cursor/rules`)

This project utilizes an AI programming assistant (like Cursor AI / Gemini) during development. The behavior and instructions for the assistant are configured in the `.cursor/rules` file within the workspace.

This file helps ensure the AI provides relevant, consistent, and helpful code suggestions, explanations, and refactoring aligned with the project's goals and coding style.

If you are using an AI assistant that respects these files, please review the `.cursor/rules` file to understand the specific instructions given to the AI for this project.

## TODO

- Read version from `package.json` in CLI.
- Improve AST transformation to handle literal value replacements and variable replacements within properties/functions, not just in declarations.
- Add more comprehensive tests, especially for edge cases and the AST method.
- Consider refactoring CLI (`cli.ts`) for automatic two-stage transformation (alias detection).
- Investigate/resolve max resolution depth test discrepancy (`extract-variables.test.ts`).

## Detailed TODOs

- [x] Set up project structure and package.json
- [x] Create CLI interface with command-line arguments
- [x] Implement mapping configuration loader
- [x] Build transformer functionality
  - Regex-based implementation:
    - [x] Process literal value replacements (e.g., #fff -> var(--theme-color))
    - [x] Process variable references (e.g., var(--bs-color) -> var(--theme-color))
    - [x] Process variable declarations (e.g., --bs-color: #fff -> --bs-color: var(--theme-color))
  - AST-based implementation:
    - [x] Create visitor for CSS custom property (DashedIdent) transformation
    - [x] Add visitor for variable references (var() functions)
    - [ ] Add visitor for color values in properties
    - [ ] Handle other property types (lengths, gradients, etc.)
- [ ] Improve variable consistency:
  - [x] Detect defined Bootstrap variables and their values (regex implementation)
  - [x] Match hardcoded values to potential variable equivalents (regex implementation)
  - [x] Replace hardcoded values with references to appropriate Bootstrap variables (regex implementation)
  - [ ] Implement variable consistency in AST transformation
- [x] Support for basic inheritance and overriding configurations
- [x] Implement file I/O handling
- [x] Write unit tests
  - [x] Set up test fixtures structure
  - [x] Add transformer tests for both methods
  - [x] Add variable consistency tests
  - [ ] Add more comprehensive test suite
- [x] Add documentation and examples (Initial Version)
- [ ] Create GitHub Actions workflow for CI/CD
- [x] Generate default mappings: *(Functionality exists in `extract-variables.ts`)*
  - [x] Create tool to extract Bootstrap variables from CSS files (Consider if needed or use external tool)
  - [x] Add command for generating default-mapping.json file from Bootstrap CSS (Consider if needed)
