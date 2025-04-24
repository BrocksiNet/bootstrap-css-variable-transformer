# Testing Conventions

This document outlines the conventions for writing and organizing tests within the project.

## Testing Framework

We use [Vitest](https://vitest.dev/) as our testing framework.

## File Location

- All test files should be located within the `tests/` directory.
- Test files should mirror the structure of the `src/` directory (e.g., tests for `src/lib/transformer.ts` should be in `tests/lib/transformer.test.ts`).
- **Test fixtures** (input files, expected output files, configuration files used specifically for tests) must be placed within the `tests/fixtures/` directory.
  - Input files go in `tests/fixtures/input/`.
  - Expected output files go in `tests/fixtures/expected/`.
  - Test-specific configuration files can be placed directly in `tests/fixtures/` or in a dedicated subdirectory if needed.

## Naming Conventions

- Test files should be named using the pattern `[filename].test.ts`.
- Test descriptions (`describe` blocks) should clearly state the module or functionality being tested.
- Individual test cases (`it` blocks) should describe the specific behavior being verified.
