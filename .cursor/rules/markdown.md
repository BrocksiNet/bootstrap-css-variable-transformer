# Markdown Style Guide

## Overview

This document defines the Markdown formatting standards for the project documentation to ensure consistency.

## Rules

- Add blank lines before and after lists
- Add blank lines before code blocks
- Use proper heading hierarchy (# for main title, ## for sections, ### for subsections)
- Always add a blank line after headings
- Use `-` for unordered lists consistently
- Use backticks for inline code (e.g., `variable`)
- Follow proper indentation in nested lists
- Avoid trailing spaces at the end of lines
- File should end with an empty line

## Examples

### Correct List Formatting

```markdown
This is a paragraph.

- Item 1
- Item 2
- Item 3

Next paragraph starts here.
```

### Correct Code Block Formatting

To create a code block with syntax highlighting:

Here is a description of the code:

```javascript
function example() {
    return true;
}
```

More text continues here.

### Correct Heading Structure

```markdown
# Main Title

## Section

Text under section.

### Subsection

Text under subsection.
```

## Tools

We using a linter like markdownlint to automatically check for style issues. You can run the check using the following npm script:

```bash
npm run lint:md
```

To automatically fix some issues, you can run:

```bash
npm run lint:md -- --fix
```
