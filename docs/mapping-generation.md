# Generating Mappings (`extract-variables.ts`)

The project includes a script (`src/bin/extract-variables.ts`) to analyze a source CSS file (like Bootstrap's compiled CSS) and generate mapping files that can be useful for understanding Bootstrap's variables or as a starting point for a transformer configuration.

## Usage

```bash
node dist/bin/extract-variables.js -i path/to/bootstrap.css -o path/to/default-mapping.json
```

### Options

_(Currently, this script takes input (`-i`) and output (`-o`) paths. More options might be added later, e.g., for specifying the variable prefix.)_

- `-i, --input <inputFile>`: (Required) Path to the source CSS file (e.g., `bootstrap.css`).
- `-o, --output <outputFile>`: (Required) Path to write the main mapping file (containing raw resolved values). The alias file will be generated alongside it.
- `-p, --prefix <prefix>`: (Optional) The prefix to use for identifying variables to extract. Defaults to `--bs-`.

## Output Files

This script generates **two** files based on the path provided to the `-o` option (note: the explanation below lists the raw values file first for logical clarity, though the aliases file may appear first in an alphabetical directory listing):

1. **`[output-path]` (e.g., `default-mapping.json`): Raw Resolved Values**

   - Contains a `defaultMapping` object.
   - Maps _every_ extracted Bootstrap variable (matching the prefix) to its fully resolved, final, raw value (e.g., hex code, pixel value, string).
   - `var(...)` references are resolved to their ultimate value (handling potential cycles or depth limits).
   - This file provides a clear lookup for the actual computed value of each variable.
   - **Example (`default-mapping.json`):**

     ```json
     {
       "defaultMapping": {
         "--bs-white": "#fff",
         "--bs-emphasis-color": "#fff", // Resolved to #fff
         "--bs-primary": "#0d6efd",
         "--bs-body-font-family": "system-ui, -apple-system, \"Segoe UI\", ...", // Resolved value
         "--bs-nav-link-disabled-color": "#adb5bd" // Resolved value, even if original was var(--bs-secondary-color)
         // ... all other variables with their raw values
       }
     }
     ```

2. **`[output-basename]-var-aliases.json` (e.g., `default-mapping-var-aliases.json`): Variable Aliases**

   - Generated in the same directory as the main output file.
   - Contains a `variableAliases` object.
   - Maps Bootstrap variables to _other_ Bootstrap variables via `var(...)` syntax.
   - This includes two types of aliases:
     - **Explicit Aliases:** Original `var(...)` references found directly in the source CSS (e.g., `--bs-body-font-family: var(--bs-font-sans-serif);`).
     - **Derived Aliases:** References created by the script when multiple variables resolve to the same raw value. The script chooses a "canonical" source variable (shortest name, then alphabetical) and makes other variables with the same value refer to it (e.g., `--bs-emphasis-color` might become `var(--bs-white)`).
   - This file captures Bootstrap's internal variable relationships.
   - **Example (`default-mapping-var-aliases.json`):**

     ```json
     {
       "variableAliases": {
         "--bs-emphasis-color": "var(--bs-white)", // Derived based on shared value #fff
         "--bs-body-font-family": "var(--bs-font-sans-serif)", // Explicit from source CSS
         "--bs-nav-link-disabled-color": "var(--bs-secondary-color)" // Example explicit alias
         // ... other explicit or derived aliases
       }
     }
     ```

## Using the Generated Files

These generated files can be used as input for the main `bootstrap-css-variables-transformer` tool:

- **`[output-path]` (Raw Values File):**
  - Can be used as a base configuration (`-c`). This allows you to map variables based on their final computed value in Bootstrap.
  - Can serve as a comprehensive reference for available variables and their default values.
- **`...-var-aliases.json` (Aliases File):**
  - Crucially, this file can be used in the **first step** of the [Two-Step Transformation Process](./transformer-usage.md#advanced-usage-two-step-transformation-for-aliases-and-theming) described in the Transformer Usage guide.
  - Using this file first (e.g., `node dist/bin/cli.js -i bootstrap.css -o intermediate.css -c default-mapping-var-aliases.json`) ensures that Bootstrap's internal variable relationships (like `--bs-emphasis-color` depending on `--bs-white`) are resolved before you apply your main theme mappings in the second step.
