# Test Fixtures

This directory contains test fixtures for the Bootstrap CSS Variables Transformer.

## Structure

- `input/` - Source CSS files for testing
  - `variable-consistency-test.css` - Test for variable consistency feature

- `expected/` - Expected output files for different transformation methods
  - `variable-consistency-ast.css` - Expected output using AST transformation
  - `variable-consistency-regex.css` - Expected output using regex transformation

- `config.json` - Main configuration for Bootstrap to theme variable mappings
- `test-config.json` - Specialized configuration for specific test cases

## Adding New Tests

1. Add an input CSS file to the `input/` directory
2. Add expected output files to the `expected/` directory (one for each transformation method if needed)
3. Update the test files in `tests/lib/` to reference your new fixtures
