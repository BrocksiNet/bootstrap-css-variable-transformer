#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
/**
 * Extracts Bootstrap CSS variable declarations from the CSS content
 *
 * @param cssContent The CSS content to extract variables from
 * @param prefix The prefix to filter variables (default: --bs-)
 * @returns An object mapping variable names to their theme equivalents
 */
function extractBootstrapVariables(cssContent, prefix = "--bs-") {
    const variables = {};
    // Match all CSS custom properties that start with the specified prefix
    // This will find variables even if they're not in a :root selector
    const varRegex = new RegExp(`${prefix.replace("--", "--")}[a-z0-9-]+\\s*:\\s*[^;]+\\s*;`, "g");
    const matches = cssContent.match(varRegex);
    if (matches) {
        for (const match of matches) {
            // Extract the variable name and value
            // Dynamically create the regex to match the specific prefix
            const namePartRegex = new RegExp(`(--(${prefix.substring(2)}[a-z0-9-]+))\\s*:\\s*([^;]+)\\s*;`);
            const varMatch = match.match(namePartRegex);
            if (varMatch?.[1] && varMatch?.[3]) {
                const varName = varMatch[1];
                const varValue = varMatch[3].trim();
                // Create theme variable name by replacing the prefix with --theme-
                // Example: --bs-primary -> --theme-primary
                // Ensure this replacement also uses the dynamic prefix
                const themePrefix = "--theme-";
                const themeName = `${themePrefix}${varName.replace(prefix, "")}`;
                variables[varName] = {
                    value: varValue,
                    themeName,
                };
            }
        }
    }
    return variables;
}
export function parseArguments(argv) {
    const program = new Command();
    program
        .version("0.1.0")
        .description("Extracts Bootstrap CSS variables from a CSS file to create a default mapping file.")
        .requiredOption("-i, --input <inputFile>", "Path to the input CSS file (e.g., compiled Bootstrap CSS)")
        .option("-o, --output <outputFile>", "Path to write the mapping JSON file", "config/default-mapping.json")
        .option("-p, --prefix <prefix>", "Prefix to filter CSS variables (default: --bs-)", "--bs-")
        .parse(argv);
    return program.opts();
}
export async function runExtraction(options) {
    console.info("\nExtraction Options:");
    console.info(`Input CSS File: ${options.input}`);
    console.info(`Output Mapping File: ${options.output}`);
    console.info(`Variable Prefix: ${options.prefix}`);
    try {
        const inputFile = path.resolve(options.input);
        const outputFile = path.resolve(options.output);
        console.info(`\nReading input CSS from: ${inputFile}`);
        const cssContent = readFileSync(inputFile, "utf-8");
        const extractedVariables = extractBootstrapVariables(cssContent, options.prefix);
        const variableCount = Object.keys(extractedVariables).length;
        console.info(`\nExtracted ${variableCount} Bootstrap variables`);
        // Show a sample of the variables found (first 5)
        const sampleVariables = Object.entries(extractedVariables).slice(0, 5);
        if (sampleVariables.length > 0) {
            console.info("\nSample of variables found (first 5):");
            for (const [bsVar, { value, themeName }] of sampleVariables) {
                console.info(`  ${bsVar}: ${value} → ${themeName}`);
            }
        }
        // Count variables by type (colors, spacing, etc.)
        const colorVars = Object.keys(extractedVariables).filter((v) => v.includes("-color") ||
            v.includes("-bg") ||
            v.includes("-background") ||
            v.includes("-border") ||
            v.endsWith("-blue") ||
            v.endsWith("-red") ||
            v.endsWith("-green") ||
            v.endsWith("-yellow")).length;
        const spacingVars = Object.keys(extractedVariables).filter((v) => v.includes("-spacing") ||
            v.includes("-padding") ||
            v.includes("-margin") ||
            v.includes("-gap")).length;
        console.info("\nVariable types:");
        console.info(`  Color-related: ${colorVars}`);
        console.info(`  Spacing-related: ${spacingVars}`);
        console.info(`  Other: ${variableCount - colorVars - spacingVars}`);
        // Create the mapping with original values
        const variablesMapping = {};
        for (const [varName, details] of Object.entries(extractedVariables)) {
            variablesMapping[varName] = details.value;
        }
        // Create the mapping JSON object
        const mappingJson = {
            defaultMapping: variablesMapping,
        };
        // Write the mapping to the output file
        writeFileSync(outputFile, JSON.stringify(mappingJson, null, 2), "utf-8");
        console.info(`\nMapping JSON written to: ${outputFile}`);
        console.info("\nExtraction complete.");
    }
    catch (error) {
        console.error("\nError during extraction process:", error);
        throw error;
    }
}
// Main execution block
async function main() {
    try {
        const options = parseArguments(process.argv);
        await runExtraction(options);
    }
    catch (error) {
        process.exit(1);
    }
}
// Execute the main function if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
