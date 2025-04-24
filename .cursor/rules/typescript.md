# TypeScript Rules

## Formatting

- Use double quotes for strings
- Use 2 spaces for indentation
- Maximum line width: 100 characters
- Use trailing commas for multi-line arrays, objects, and parameters
- Always use semicolons at the end of statements
- Use spaces inside brackets and braces
- Don't use any space in empty lines

## Import Organization

- Imports should be automatically organized and grouped
- Remove unused imports

## Code Style

- Use template literals instead of string concatenation
- Avoid using template literals when a simple string would suffice
- Avoid using negation in else conditions

## Type Safety

- Avoid using `any` types when possible (warning)
- Define proper interfaces and types for better code clarity

## Development Practices

- Avoid leaving `console.log` statements in production code (warning)
- Keep functions and methods small and focused
- Follow the Single Responsibility Principle

## Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting TypeScript files.

To lint and format your code, run:

```bash
npm run biome:check   # Check code for linting errors
npm run biome:fix     # Fix linting and formatting issues
```

Files in `dist` and `node_modules` directories are ignored for formatting.
