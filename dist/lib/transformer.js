import { transform, } from "lightningcss";
/**
 * Transform method to use
 */
export var TransformMethod;
(function (TransformMethod) {
    TransformMethod["AST"] = "ast";
    TransformMethod["REGEX"] = "regex";
})(TransformMethod || (TransformMethod = {}));
// Helper to format a parsed Color object to a hex string
function formatColorToHex(colorData) {
    const r = Math.round(colorData.r * 255);
    const g = Math.round(colorData.g * 255);
    const b = Math.round(colorData.b * 255);
    const toHex = (c) => c.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
/**
 * Transforms CSS content based on the provided mapping configuration.
 * Selects the appropriate transformation method based on the method parameter.
 *
 * @param cssContent The raw CSS string.
 * @param config The validated mapping configuration.
 * @param method The transformation method to use (ast or regex).
 * @returns An object containing the transformed CSS string and a set of used target variables.
 */
export function transformCss(cssContent, config, method = TransformMethod.AST) {
    if (!cssContent.trim()) {
        return { css: "", targetVariables: new Set() };
    }
    let result;
    try {
        // Choose the transformation method
        switch (method) {
            case TransformMethod.AST:
                result = transformWithAst(cssContent, config);
                break;
            case TransformMethod.REGEX:
                result = transformWithRegex(cssContent, config);
                break;
            default:
                console.warn(`Unknown transform method: ${method}, falling back to AST`);
                result = transformWithAst(cssContent, config);
                break;
        }
    }
    catch (error) {
        console.error("Error during CSS transformation:", error);
        // Return original CSS on error, with empty variables set
        result = { css: cssContent, targetVariables: new Set() };
    }
    return result;
}
/**
 * Transforms CSS content using LightningCSS AST visitors.
 * This is the recommended approach for more accurate CSS parsing and transformation.
 *
 * @param cssContent The raw CSS string.
 * @param config The validated mapping configuration.
 * @returns An object containing the transformed CSS string and a set of used target variables.
 */
function transformWithAst(cssContent, config) {
    const finalMapping = { ...config.defaultMapping, ...config.overrides };
    const targetVariables = new Set();
    // Create a visitor to transform the CSS AST
    const visitor = {
        Declaration(declaration) {
            // Handle CSS custom properties (--bs-xxx: value)
            if (declaration.property === "custom" && "name" in declaration.value) {
                const customProperty = declaration.value;
                const variableName = customProperty.name;
                // Check if this CSS variable needs to be mapped
                if (finalMapping[variableName]) {
                    const mappedValue = finalMapping[variableName];
                    // CASE 1: Map to another variable
                    if (mappedValue.startsWith("--")) {
                        targetVariables.add(mappedValue);
                        // Transform the value
                        return {
                            ...declaration,
                            value: {
                                ...customProperty,
                                value: [
                                    {
                                        type: "function",
                                        value: {
                                            name: "var",
                                            arguments: [
                                                {
                                                    type: "token",
                                                    value: { type: "ident", value: mappedValue },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        };
                    }
                    // Build the new token array based on the literal value type
                    let newValueTokens = [];
                    const dimensionRegex = /^(-?\d+(\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|cm|mm|in|pt|pc|ex|ch|lh|rlh|deg|rad|grad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx|fr)$/i;
                    const numberRegex = /^-?\d+(\.\d+)?$/;
                    // Common simple keywords
                    const keywords = new Set(["none", "inherit", "initial", "unset", "revert", "auto", "solid", "transparent", "currentColor"]);
                    if (mappedValue.startsWith("var(")) {
                        // Handle var() function calls
                        // Corrected Regex: Capture typical dashed identifiers
                        const varName = mappedValue.match(/var\(\s*(--[\w-]+)\s*\)/)?.[1];
                        if (varName) {
                            newValueTokens = [
                                {
                                    type: "function",
                                    value: {
                                        name: "var",
                                        arguments: [
                                            { type: "token", value: { type: "ident", value: varName } },
                                        ],
                                    },
                                },
                            ];
                        }
                        else {
                            // Fallback for invalid var() syntax - treat as ident
                            newValueTokens = [{ type: "token", value: { type: "ident", value: mappedValue } }];
                        }
                    }
                    else if (dimensionRegex.test(mappedValue)) {
                        // Handle dimensions (e.g., 1rem, 10px, 50%)
                        const match = mappedValue.match(dimensionRegex);
                        if (match) {
                            const num = Number.parseFloat(match[1]);
                            const unit = match[3].toLowerCase();
                            newValueTokens = [
                                // Note: lightningcss might have a specific 'dimension' type, using token for now
                                { type: "token", value: { type: "dimension", value: num, unit: unit } },
                            ];
                        }
                    }
                    else if (numberRegex.test(mappedValue) && !Number.isNaN(Number.parseFloat(mappedValue))) {
                        // Handle standalone numbers (e.g., 1.5, 400)
                        const num = Number.parseFloat(mappedValue);
                        newValueTokens = [
                            { type: "token", value: { type: "number", value: num } },
                        ];
                    }
                    else if (mappedValue.startsWith("#")) {
                        // Handle hex colors -> hash token
                        newValueTokens = [
                            { type: "token", value: { type: "hash", value: mappedValue.slice(1) } },
                        ];
                    }
                    else if (mappedValue.startsWith("rgba(")) {
                        // Handle rgba() - Attempt to parse into color value
                        try {
                            const match = mappedValue.match(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\)/);
                            if (match) {
                                const [, r, g, b, a] = match.map(Number);
                                // Note: This assumes lightningcss expects RGBColor structure.
                                // Might need adjustments based on the actual CssColor type.
                                newValueTokens = [
                                    { type: 'color', value: { type: 'rgb', r, g, b, alpha: a } }
                                ];
                            }
                            else {
                                newValueTokens = [{ type: "token", value: { type: "ident", value: mappedValue } }]; // Fallback
                            }
                        }
                        catch { // Fallback on parsing error
                            newValueTokens = [{ type: "token", value: { type: "ident", value: mappedValue } }];
                        }
                    }
                    else if (mappedValue.includes(",") && mappedValue.split(',').every(part => numberRegex.test(part.trim()))) {
                        // Handle COMMA-SEPARATED NUMBERS ONLY -> number, comma, white-space tokens
                        const parts = mappedValue.split(",");
                        newValueTokens = parts.flatMap((part, index) => {
                            const numStr = part.trim();
                            const num = Number.parseFloat(numStr);
                            const tokens = [
                                { type: "token", value: { type: "number", value: num } },
                            ];
                            if (index < parts.length - 1) {
                                tokens.push({ type: "token", value: { type: "comma" } });
                                tokens.push({ type: "token", value: { type: "white-space", value: " " } });
                            }
                            return tokens;
                        });
                    }
                    else if (keywords.has(mappedValue.toLowerCase())) {
                        // Handle known simple keywords
                        newValueTokens = [
                            { type: "token", value: { type: "ident", value: mappedValue } },
                        ];
                    }
                    else {
                        // Fallback for other complex values (font stacks, calc(), gradients, etc.)
                        // Use a raw token type if available, otherwise fallback to ident might be necessary
                        // NOTE: Checking LightningCSS docs, there isn't a direct `raw` token type.
                        // The closest might be preserving structure or using unparsed value types.
                        // For simplicity and to avoid escaping, let's try creating a basic `ident`
                        // token but log a warning that it might not be ideal for complex values.
                        // A more robust solution might involve parsing functions or using `lightningcss.parseCustomPropertyValue`.
                        newValueTokens = [
                            // Still using ident as the primary fallback, as 'raw' isn't a standard token type.
                            // The goal is for LightningCSS *not* to escape this ident, but its behavior might vary.
                            { type: "token", value: { type: "ident", value: mappedValue } },
                        ];
                    }
                    // Return the declaration with the new token array value
                    return {
                        ...declaration,
                        value: {
                            ...customProperty, // Keep CustomProperty structure
                            value: newValueTokens, // Assign the new token array
                        },
                    };
                }
            }
            // TODO: Add logic here to handle transforming regular properties (like 'color')
            // based on literal value mappings (e.g., #ffffff -> var(--white)) if desired for AST method.
            // Currently, only variable-to-variable mapping is implemented in AST.
            return declaration; // Return original if no mapping applies
        },
        // Potentially add visitors for 'Function' or other nodes if we need to replace
        // variable usages (var(--old)) or literal values within functions/properties.
    };
    // Apply transformations to the CSS
    try {
        const result = transform({
            filename: "input.css",
            code: Buffer.from(cssContent),
            visitor,
            errorRecovery: true,
        });
        console.info("AST transformation successful.");
        return { css: result.code.toString(), targetVariables };
    }
    catch (transformError) {
        console.error("Error during AST transformation:", transformError);
        console.warn("Falling back to REGEX transformation...");
        // If AST transformation fails, fall back to regex transformation
        return transformWithRegex(cssContent, config);
    }
}
/**
 * Transforms CSS content using regex-based string replacement.
 * This approach may be faster but less accurate for complex CSS.
 *
 * @param cssContent The raw CSS string.
 * @param config The validated mapping configuration.
 * @returns An object containing the transformed CSS string and a set of used target variables.
 */
function transformWithRegex(cssContent, config) {
    let transformedCss = cssContent;
    const finalMapping = { ...config.defaultMapping, ...config.overrides };
    const targetVariables = new Set();
    // --- Post-processing String Replacement ---
    const literals = [];
    const variables = [];
    // Separate mappings
    for (const [searchValue, replaceValue] of Object.entries(finalMapping)) {
        if (searchValue.startsWith("--")) {
            variables.push([searchValue, replaceValue]);
        }
        else {
            literals.push([searchValue, replaceValue]);
        }
    }
    // 1. Process Literal Value Replacements First (e.g., #fff -> var(--foo))
    for (const [searchValue, replaceValue] of literals) {
        // Only collect if the replacement value IS a variable
        if (replaceValue.startsWith("--")) {
            // Corrected escaping
            const escapedSearchValueForRegex = searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            // Use a regex that looks for the value surrounded by non-alphanumeric chars or line boundaries
            // This handles cases like `: #value;`, `( #value,`, ` #value `, etc.
            const literalRegex = new RegExp(`(?<![a-zA-Z0-9])${escapedSearchValueForRegex}(?![a-zA-Z0-9])`, "gi");
            // Use replace with a function to check if replacement occurred and collect variable
            let replaced = false;
            transformedCss = transformedCss.replace(literalRegex, () => {
                replaced = true;
                return `var(${replaceValue})`;
            });
            if (replaced) {
                targetVariables.add(replaceValue);
            }
        }
        // Example: mapping "old-class": "new-class" (though not the primary use case here)
        else {
            // Corrected escaping
            const escapedSearchValueForRegex = searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            // Use a regex that looks for the value surrounded by non-alphanumeric chars or line boundaries
            const literalRegex = new RegExp(`(?<![a-zA-Z0-9])${escapedSearchValueForRegex}(?![a-zA-Z0-9])`, "gi");
            transformedCss = transformedCss.replace(literalRegex, replaceValue);
        }
    }
    // 2. Process Variable Reference Replacements Second (var(--foo) -> var(--bar))
    for (const [variableName, mappedVariable] of variables) {
        // Only collect if the replacement value IS a variable (it should be by definition here)
        if (mappedVariable.startsWith("--")) {
            const escapedVariableName = variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            const varRegex = new RegExp(`var\\s*\\(\\s*${escapedVariableName}\\s*\\)`, "gi");
            // Use replace with a function to check if replacement occurred and collect variable
            let replaced = false;
            transformedCss = transformedCss.replace(varRegex, () => {
                replaced = true;
                return `var(${mappedVariable})`;
            });
            if (replaced) {
                targetVariables.add(mappedVariable);
            }
        }
        // If mappedVariable is not a variable (e.g., mapping --foo: #fff), just replace
        else {
            const escapedVariableName = variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            const varRegex = new RegExp(`var\\s*\\(\\s*${escapedVariableName}\\s*\\)`, "gi");
            transformedCss = transformedCss.replace(varRegex, mappedVariable);
        }
    }
    // 3. Process Variable Declaration Value Replacements Third (--foo: xxx -> --foo: var(--bar))
    for (const [variableName, mappedVariable] of variables) {
        // Only collect if the replacement value IS a variable
        if (mappedVariable.startsWith("--")) {
            const escapedVariableName = variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            const declarationRegex = new RegExp(`(${escapedVariableName}\\s*:\\s*)([^;}]*?)(\\s*[;}])`, "gi");
            // Use replace with a function to check if replacement occurred and collect variable
            let replaced = false;
            transformedCss = transformedCss.replace(declarationRegex, (match, propertyPart, _originalValuePart, endPart) => {
                replaced = true;
                return `${propertyPart}var(${mappedVariable})${endPart}`;
            });
            if (replaced) {
                targetVariables.add(mappedVariable);
            }
        }
        // If mappedVariable is not a variable (e.g. --foo: red), just replace the value
        else {
            const escapedVariableName = variableName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
            const declarationRegex = new RegExp(`(${escapedVariableName}\\s*:\\s*)([^;}]*?)(\\s*[;}])`, "gi");
            transformedCss = transformedCss.replace(declarationRegex, (match, propertyPart, _originalValuePart, endPart) => {
                return `${propertyPart}${mappedVariable}${endPart}`;
            });
        }
    }
    return { css: transformedCss, targetVariables };
}
