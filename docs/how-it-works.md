# How It Works

This document explains the technical approaches used by the `css-variables-transformer` tool.

## Background

When working with CSS, especially from UI libraries or frameworks, variables might not be used consistently, making theming difficult. For example, a library might define root CSS variables, but many component-specific styles might not reference these variables or might use hardcoded values, creating a disconnect after compilation.

This tool uses LightningCSS to parse and transform CSS, replacing hardcoded values with CSS variables and establishing proper variable relationships for easy theming based on a user-provided configuration.

### Inconsistent Variable Usage

A common issue in CSS is that defined variables often aren't used consistently:

1. Some CSS variables are defined but never referenced (e.g., `--lib-light: #f9f9f9;`)
2. The same hardcoded values appear in multiple places where the variable should be used (e.g., `color: #f9f9f9;` instead of `color: var(--lib-light);`)

Our transformer addresses this by:

- Identifying hardcoded values that match defined source variables (based on your config or an extracted alias map).
- Replacing these values with references to the appropriate variables.
- Then transforming those source variables to target theme variables (based on your config).

This creates a more consistent variable structure and improves theme customization.

## Transformation Methods

This tool uses two approaches to transform CSS:

### AST-based Transformation (Default)

The AST-based approach uses LightningCSS to parse the CSS into an Abstract Syntax Tree, modify the tree directly, and then generate CSS from the modified tree:

1. Parse command-line arguments (input/output files, config path, method).
2. Load and validate the mapping configuration file using Zod.
3. Parse the input CSS file using LightningCSS into an AST.
4. Apply transformation visitors to the AST:
   - **Current implementation**: Transforms the _value_ of CSS custom property _declarations_ (e.g., `--source-primary: value;`) based on the mapping configuration. It can map a declaration to another variable (`--source-primary: var(--theme-primary);`) or to a literal value (`--source-primary: #ffffff;`), attempting to parse simple literals like colors, dimensions, and numbers. It also transforms `var()` function calls within property values.
   - **Planned**: Implement visitors to replace hardcoded literal values (like `#0d6efd`) within standard properties (like `background-color`) with corresponding theme variables.
   - **Planned**: Implement logic to identify hardcoded values that match defined source variables and replace them with variable references _before_ applying the theme mapping (variable consistency feature).
5. Generate the transformed CSS from the modified AST.

If the AST transformation encounters issues, it automatically falls back to the regex-based method.

### Regex-based Transformation

The regex-based approach uses string pattern matching and regular expressions for transformations:

1. Process the CSS as a string, combining defaultMapping and overrides.
2. Extract all defined source variables and build a value-to-variable mapping.
3. Process literal value replacements, with two sub-steps:
   - Replace hardcoded values that match source variables with references to those variables.
   - Replace hardcoded values and source variables with theme variables based on the config.
4. Process variable references (e.g., `var(--source-btn-color)` → `var(--theme-btn-color)`).
5. Process variable declarations (e.g., `--source-btn-color: #fff` → `--source-btn-color: var(--theme-btn-color)`).

This approach is fully implemented for the basic transformations and variable consistency improvements but may be less robust than AST for complex CSS structures.

## Example Transformation

**Basic Variable Mapping:**

Input:

```css
.btn-primary {
  --source-btn-color: #fff;
  --source-btn-bg: #0042a0;
}
```

Output (using a mapping like `{ "#fff": "--theme-button-text", "#0042a0": "--theme-primary" }`):

```css
.btn-primary {
  --source-btn-color: var(--theme-button-text);
  --source-btn-bg: var(--theme-primary);
}
```

**Improved Variable Consistency (Conceptual - primarily Regex method currently):**

Input:

```css
:root {
  --lib-light: #f9f9f9;
}

.light-panel {
  background-color: #f9f9f9;
  color: #212529;
}
```

Output after source variable consistency (Stage 1 in Regex):

```css
:root {
  --lib-light: #f9f9f9;
}

.light-panel {
  background-color: var(--lib-light);
  color: #212529;
}
```

Final output after theme transformation (Stage 2, assumes `--lib-light` maps to `--theme-light` and `#212529` maps to `--theme-text`):

```css
:root {
  --lib-light: var(--theme-light);
}

.light-panel {
  background-color: var(--theme-light); /* Updated from var(--lib-light) */
  color: var(--theme-text); /* Updated from #212529 */
}
```
