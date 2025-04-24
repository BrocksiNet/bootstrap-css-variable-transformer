#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { loadAndMergeMappingConfigs, loadMappingConfig } from "../lib/mapping-loader.js";
// Import the transformer, TransformMethod enum, and TransformResult interface
import { TransformMethod, transformCss } from "../lib/transformer.js";
// Import package.json to get the version
// Use import attributes (`with`)
import packageJson from '../../package.json' with { type: 'json' };
export function parseArguments(argv) {
    const program = new Command();
    program
        .version(packageJson.version) // Read from package.json
        .description("Transforms Bootstrap CSS to use consistent CSS variables based on a config file.")
        .requiredOption("-i, --input <inputFile>", "Path to the input CSS file (e.g., compiled Bootstrap CSS)")
        .requiredOption("-o, --output <outputFile>", "Path to write the transformed CSS file")
        .requiredOption("-c, --config <configFile>", "Path to the JSON configuration file for default variable mapping")
        .option("--overrides <overridesFile>", "Path to the JSON configuration file with variable overrides")
        .option("-m, --method <method>", "Transformation method to use (ast or regex, default: ast)", "ast")
        .parse(argv); // Parse the provided arguments
    // Get options and validate method
    const options = program.opts();
    // Validate and convert method string to enum
    if (options.method !== "ast" && options.method !== "regex") {
        console.error(`Invalid method: ${options.method}, falling back to 'ast'`);
        options.method = TransformMethod.AST;
    }
    else {
        options.method = options.method === "ast" ? TransformMethod.AST : TransformMethod.REGEX;
    }
    return options;
}
export async function runTransformation(options) {
    console.info("\nCLI Options Received:");
    console.info(`Input File: ${options.input}`);
    console.info(`Output File: ${options.output}`);
    console.info(`Config File: ${options.config}`);
    if (options.overrides) {
        console.info(`Overrides File: ${options.overrides}`);
    }
    console.info(`Method: ${options.method}`);
    try {
        const inputFile = path.resolve(options.input);
        const outputFile = path.resolve(options.output);
        const configFile = path.resolve(options.config);
        const overridesFile = options.overrides ? path.resolve(options.overrides) : undefined;
        console.info(`\nReading input CSS from: ${inputFile}`);
        console.info(`Reading default config from: ${configFile}`);
        if (overridesFile) {
            console.info(`Reading overrides from: ${overridesFile}`);
        }
        const cssContent = readFileSync(inputFile, "utf-8");
        const config = overridesFile
            ? loadAndMergeMappingConfigs(configFile, overridesFile)
            : loadMappingConfig(configFile);
        console.info(`\nTransforming CSS using ${options.method} method...`);
        // Capture the result object
        const { css: transformedCss, targetVariables } = transformCss(cssContent, config, options.method);
        let finalCss = transformedCss;
        // Generate and write the variables file if any target variables were collected
        if (targetVariables.size > 0) {
            const outputDir = path.dirname(outputFile);
            const outputBaseName = path.basename(outputFile, path.extname(outputFile));
            const varsFileName = `${outputBaseName}.vars.css`;
            const varsFilePath = path.join(outputDir, varsFileName);
            console.info(`\nDetected ${targetVariables.size} target variables. Generating ${varsFileName}...`);
            const varsContent = `:root {\n${[...targetVariables].map((v) => `  ${v}: ;`).join("\n")}\n}\n`;
            writeFileSync(varsFilePath, varsContent, "utf-8");
            console.info(`Variable placeholder file written to: ${varsFilePath}`);
            // Prepend the @import rule to the main CSS
            const importRule = `@import url('./${varsFileName}');\n\n`;
            finalCss = importRule + transformedCss;
            console.info(`Added @import rule to ${path.basename(outputFile)}`);
        }
        else {
            console.info("\nNo target variables detected, skipping variable file generation.");
        }
        // Write the final CSS (potentially with the import rule)
        writeFileSync(outputFile, finalCss, "utf-8");
        console.info(`\nTransformed CSS written to: ${outputFile}`);
        console.info("\nTransformation complete.");
    }
    catch (error) {
        // Log the error and re-throw or handle appropriately
        console.error("\nError during transformation process:", error);
        // Instead of process.exit, let the error propagate or handle it differently
        throw error; // Re-throwing allows calling code (like tests) to catch it
    }
}
