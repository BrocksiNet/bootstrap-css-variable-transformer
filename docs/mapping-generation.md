# Generating Mappings (`css-variables-extractor`)

The project includes a script (`src/bin/extract-variables.ts`, exposed as `css-variables-extractor`) to analyze a source CSS file and generate mapping files. These can be useful for understanding a library's variables or as a starting point for a transformer configuration.

## Usage

```bash
css-variables-extractor -i path/to/source.css -o path/to/default-mapping.json
# Or using node directly:
# node dist/bin/extract-variables.js -i path/to/source.css -o path/to/default-mapping.json
```

### Options

- `-i, --input <inputFile>`: (Required) Path to the source CSS file (e.g., `library.css`).
- `-o, --output <outputFile>`: (Required) Path to write the main mapping file (containing raw resolved values). The alias file will be generated alongside it.
- `-p, --prefix <prefix>`: (Optional) The prefix to use for identifying variables to extract. Defaults to `--bs-` (consider changing this default or making it required if the tool is truly generic).

## Output Files

This script generates **two** files based on the path provided to the `-o` option:

1. **`[output-path]` (e.g., `default-mapping.json`): Raw Resolved Values**

   - Contains a `defaultMapping` object.
   - Maps _every_ extracted variable (matching the prefix) to its fully resolved, final, raw value.
   - `var(...)` references are resolved to their ultimate value.
   - **Example (`default-mapping.json`):**

     ```json
     {
       "defaultMapping": {
         "--lib-white": "#fff",
         "--lib-emphasis-color": "#fff",
         "--lib-primary": "#0d6efd",
         "--lib-body-font-family": "system-ui, ...",
         "--lib-nav-link-disabled-color": "#adb5bd"
       }
     }
     ```

2. **`[output-basename]-var-aliases.json` (e.g., `default-mapping-var-aliases.json`): Variable Aliases**

   - Contains a `variableAliases` object.
   - Maps source variables to _other_ source variables via `var(...)` syntax.
   - Includes explicit and derived aliases.
   - **Example (`default-mapping-var-aliases.json`):**

     ```json
     {
       "variableAliases": {
         "--lib-emphasis-color": "var(--lib-white)",
         "--lib-body-font-family": "var(--lib-font-sans-serif)",
         "--lib-nav-link-disabled-color": "var(--lib-secondary-color)"
       }
     }
     ```

## Using the Generated Files

These generated files can be used as input for the main `css-variables-transformer` tool:

- **`[output-path]` (Raw Values File):**
  - Can be used as a base configuration (`-c`).
- **`...-var-aliases.json` (Aliases File):**
  - Can be used in the **first step** of the [Two-Step Transformation Process](./transformer-usage.md#advanced-usage-two-step-transformation-for-aliases-and-theming).
  - Using this file first (e.g., `css-variables-transformer -i source.css -o intermediate.css -c default-mapping-var-aliases.json`) ensures that internal variable relationships are resolved before you apply your main theme mappings.
