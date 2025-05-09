# CSS Variable Transformer

Transforms CSS to use CSS variables based on a JSON configuration file. This allows for easier theming and consistency, especially when working with frameworks or design systems that rely on CSS variables.

[![CI Status](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/ci.yml) <!-- Placeholder -->
[![npm version](https://badge.fury.io/js/css-variables-transformer.svg)](https://badge.fury.io/js/css-variables-transformer) <!-- Placeholder -->

## Overview

This tool helps manage CSS variables by:

- Replacing hardcoded values (like hex codes) with CSS variables.
- Replacing existing `var(...)` references with mapped variables.
- Updating variable declarations to use mapped variables.
- Generating a `*.vars.css` file for all target theme variables.

It uses configuration files to define mappings and supports both robust AST-based (default) and faster Regex-based transformations.

## Installation

```bash
npm install -g css-variables-transformer
# or locally
npm install --save-dev css-variables-transformer
```

## Quick Start

**1. Transform CSS:**

```bash
css-variables-transformer -i input.css -o output.css -c theme-map.json
```

**2. Generate Mapping Files (Optional):**

```bash
css-variables-extractor -i source.css -o config/default-mapping.json
# or directly node dist/bin/extract-variables.js -i source.css -o config/default-mapping.json
```

## Documentation

- **[Transformer Tool Usage](./docs/transformer-usage.md):** Detailed CLI options, configuration file format, advanced usage (two-step transformation), and the generated `.vars.css` file.
- **[Mapping Generation](./docs/mapping-generation.md):** How to use the `css-variables-extractor` script and understand its output files.
- **[How It Works](./docs/how-it-works.md):** Technical details on the AST and Regex transformation methods.
- **[Development Guide](./docs/development.md):** Information for contributors, setup, development commands, project structure, and AI assistant configuration.

## References

- [LightningCSS - How to Transform a DashedIdent value](https://www.brocksi.net/blog/lightningcss-how-to-transform-a-dashedident/) - Blog post explaining how to use LightningCSS visitors to transform CSS variable values.
- [LightningCSS AST Viewer](https://lightningcss-ast-viewer.vercel.app/)

## Disclaimer

This code was generated with AI.

## Contributing

Contributions are welcome! Please see the [Development Guide](./docs/development.md) for details. Please feel free to submit a Pull Request.

## License

MIT
