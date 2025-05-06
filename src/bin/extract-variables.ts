#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";

interface CliOptions {
  input: string;
  output: string;
  prefix?: string;
}

interface ExtractedVariableData {
  originalValue: string;
  themeName: string; // Retained for now, though not directly in final JSONs
  resolvedValue?: string; // Ultimate raw value
}

interface ExtractionResult {
  resolvedValues: Record<string, string>;
  aliases: Record<string, string>;
}

/**
 * Extracts Bootstrap CSS variable declarations from the CSS content
 *
 * @param cssContent The CSS content to extract variables from
 * @param prefix The prefix to filter variables (default: --bs-)
 * @returns An object mapping variable names to their theme equivalents
 */
export function extractBootstrapVariables(cssContent: string, prefix = "--bs-"): ExtractionResult {
  const declarations: Record<string, ExtractedVariableData> = {};

  // 1. Initial pass: Collect all declared variables and their original values
  const varRegex = new RegExp(`${prefix.replace("--", "--")}[a-z0-9-]+\s*:\s*[^;]+\s*;`, "g");
  const matches = cssContent.match(varRegex);

  if (matches) {
    for (const match of matches) {
      const namePartRegex = new RegExp(`(--(${prefix.substring(2)}[a-z0-9-]+))\s*:\s*([^;]+)\s*;`);
      const varMatch = match.match(namePartRegex);
      if (varMatch?.[1] && varMatch?.[3]) {
        const varName = varMatch[1];
        const originalValue = varMatch[3].trim();
        const themePrefix = "--theme-"; // Kept for consistency, though not used in output maps
        const themeName = `${themePrefix}${varName.replace(prefix, "")}`;
        declarations[varName] = { originalValue, themeName };
      }
    }
  }

  const resolvedValues: Record<string, string> = {};
  const MAX_RESOLUTION_DEPTH = 10; // Prevent infinite loops

  // 2. Resolve values: Find the ultimate raw value for each variable
  for (const varName in declarations) {
    let currentValue = declarations[varName].originalValue;
    const visitedInPath: Set<string> = new Set(); // For cycle detection in current path
    let depth = 0;

    while (currentValue.startsWith("var(")) {
      // Check for cycle before proceeding
      const referencedVarNameCheck = currentValue.substring(4, currentValue.length - 1).trim();
      if (visitedInPath.has(referencedVarNameCheck)) {
        // Cycle detected
        console.warn(
          `Cycle detected resolving ${varName} involving ${referencedVarNameCheck}, using '${currentValue}' as is.`,
        );
        break;
      }
      visitedInPath.add(referencedVarNameCheck);

      // Now, attempt to resolve the reference
      const referencedVarName = referencedVarNameCheck;
      if (declarations[referencedVarName]) {
        currentValue = declarations[referencedVarName].originalValue;
        depth++; // Increment depth AFTER successful step

        // Check if max depth has been REACHED or exceeded
        if (depth >= MAX_RESOLUTION_DEPTH) {
          // If the value *after* the max step is still a var, keep it and warn
          if (currentValue.startsWith("var(")) {
            console.warn(
              `Max resolution depth (${MAX_RESOLUTION_DEPTH}) reached for ${varName}, using '${currentValue}' as is.`,
            );
          }
          // In either case (var or raw), break because max steps done.
          break;
        }
      } else {
        // Referenced variable not found, keep 'var(...)' form
        break;
      }
    }
    // Warning check after loop removed as it's handled inside
    resolvedValues[varName] = currentValue;
    declarations[varName].resolvedValue = currentValue;
  }

  // Refine resolvedValues: ensure all are truly raw, or keep var if it was the end of resolution
  for (const varName in resolvedValues) {
    if (resolvedValues[varName].startsWith("var(")) {
      // If a value is still a 'var()', it means it couldn't be fully resolved to raw
      // or was a var() to a non-prefixed var, or cycle/depth limit.
      // For default-mapping, we want the original declaration if it was a var()
      // that did NOT resolve to a prefixed variable's raw value.
      // This part is tricky: default-mapping wants "real" values.
      // If var(--bs-foo) -> var(--bs-bar) -> #FFF. default-mapping gets #FFF.
      // If var(--bs-foo) -> var(--other-var), default-mapping gets var(--other-var)
      // The current resolvedValues[varName] should be correct here.
    }
  }

  const aliases: Record<string, string> = {};

  // 3. Generate Aliases
  // Type 1: Explicit var() declarations from input
  for (const varName in declarations) {
    if (declarations[varName].originalValue.startsWith("var(")) {
      aliases[varName] = declarations[varName].originalValue;
    }
  }

  // Type 2: Aliases from shared resolved raw values
  const valueToVarNames: Record<string, string[]> = {};
  for (const varName in declarations) {
    const entry = declarations[varName];
    // Only consider for canonical source if it resolved to a non-var value
    if (entry.resolvedValue && !entry.resolvedValue.startsWith("var(")) {
      if (!valueToVarNames[entry.resolvedValue]) {
        valueToVarNames[entry.resolvedValue] = [];
      }
      valueToVarNames[entry.resolvedValue].push(varName);
    }
  }

  for (const rawValue in valueToVarNames) {
    const candidates = valueToVarNames[rawValue];
    if (candidates.length > 1) {
      candidates.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
      });
      const canonicalVar = candidates[0];
      for (let i = 1; i < candidates.length; i++) {
        const aliasVar = candidates[i];
        // Add as alias only if not already an explicit Type 1 alias
        // And ensure it's not self-referential (though sort should prevent canonical from being here)
        if (!aliases[aliasVar] && aliasVar !== canonicalVar) {
          aliases[aliasVar] = `var(${canonicalVar})`;
        }
      }
    }
  }

  // Final default map should only contain truly resolved raw values for keys present in declarations
  const finalDefaultMapping: Record<string, string> = {};
  for (const varName in declarations) {
    const finalVal = resolvedValues[varName];
    // If resolved value is still a var() AND it's an alias we've decided,
    // the default map should show its *original* declared value if that was also a var,
    // or its resolved raw value if the original was not a var but resolved to one (e.g. cycle).
    // This logic is tricky. The goal: default-map shows "real" values.
    // If --bs-foo was "var(--bs-bar)" and --bs-bar was "#FFF", then resolvedValues[--bs-foo] is "#FFF". This is correct.
    // If --bs-foo was "var(--non-bs-var)", then resolvedValues[--bs-foo] is "var(--non-bs-var)". This is a "real" value in this context.
    finalDefaultMapping[varName] = finalVal;
  }

  return { resolvedValues: finalDefaultMapping, aliases };
}

export function parseArguments(argv: string[]): CliOptions {
  const program = new Command();

  program
    .version("0.1.0")
    .description(
      "Extracts Bootstrap CSS variables from a CSS file to create a default mapping file.",
    )
    .requiredOption(
      "-i, --input <inputFile>",
      "Path to the input CSS file (e.g., compiled Bootstrap CSS)",
    )
    .option(
      "-o, --output <outputFile>",
      "Path to write the mapping JSON file",
      "config/default-mapping.json",
    )
    .option("-p, --prefix <prefix>", "Prefix to filter CSS variables (default: --bs-)", "--bs-")
    .parse(argv);

  return program.opts<CliOptions>();
}

export async function runExtraction(options: CliOptions): Promise<void> {
  console.info("\nExtraction Options:");
  console.info(`Input CSS File: ${options.input}`);
  console.info(`Output Mapping File: ${options.output}`);
  console.info(`Variable Prefix: ${options.prefix}`);

  try {
    const inputFile = path.resolve(options.input);
    const rawMappingOutputFile = path.resolve(options.output);

    // Derive aliases filename from raw mapping filename
    const outputDir = path.dirname(rawMappingOutputFile);
    const outputExt = path.extname(rawMappingOutputFile);
    const outputBase = path.basename(rawMappingOutputFile, outputExt); // Get filename without extension
    const aliasesOutputFile = path.join(outputDir, `${outputBase}-var-aliases${outputExt}`);

    console.info(`Aliases File: ${aliasesOutputFile}`); // Inform user about the second file
    console.info(`\nReading input CSS from: ${inputFile}`);

    const cssContent = readFileSync(inputFile, "utf-8");
    const { resolvedValues, aliases } = extractBootstrapVariables(cssContent, options.prefix);

    const variableCount = Object.keys(resolvedValues).length;
    console.info(`\nExtracted ${variableCount} Bootstrap variables`);

    // Show a sample of the resolved values found (first 5)
    const sampleVariables = Object.entries(resolvedValues).slice(0, 5);
    if (sampleVariables.length > 0) {
      console.info("\nSample of resolved values found (first 5):");
      for (const [bsVar, value] of sampleVariables) {
        console.info(`  ${bsVar}: ${value}`);
      }
    }

    // Create the raw mapping JSON object
    const rawMappingJson = {
      defaultMapping: resolvedValues,
    };

    // Write the raw mapping to the output file
    writeFileSync(rawMappingOutputFile, JSON.stringify(rawMappingJson, null, 2), "utf-8");
    console.info(`\nRaw mapping JSON written to: ${rawMappingOutputFile}`);

    // Create the aliases JSON object if aliases exist
    if (Object.keys(aliases).length > 0) {
      const aliasesJson = {
        variableAliases: aliases,
      };
      // Write the aliases to the second output file
      writeFileSync(aliasesOutputFile, JSON.stringify(aliasesJson, null, 2), "utf-8");
      console.info(`Variable aliases JSON written to: ${aliasesOutputFile}`);
    } else {
      console.info("No variable aliases found to write.");
    }

    console.info("\nExtraction complete.");
  } catch (error) {
    console.error("\nError during extraction process:", error);
    throw error;
  }
}

// Main execution block
export async function main() {
  try {
    const options = parseArguments(process.argv);
    await runExtraction(options);
  } catch (error) {
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
