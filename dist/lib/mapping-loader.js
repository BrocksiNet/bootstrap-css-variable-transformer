import { readFileSync } from "node:fs";
// Import schema and inferred type from the schema definition
import { mappingConfigSchema } from "../schemas/configSchema.js";
/**
 * Loads, parses, and validates the mapping configuration file using a Zod schema.
 *
 * @param filePath The path to the JSON configuration file.
 * @returns The validated MappingConfig object.
 * @throws Error if the file cannot be read, is not valid JSON, or fails schema validation.
 */
export function loadMappingConfig(filePath) {
    let fileContent;
    try {
        fileContent = readFileSync(filePath, "utf-8");
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new Error(`Mapping configuration file not found at: ${filePath}`);
        }
        throw new Error(`Error reading mapping configuration file at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    let parsedJson;
    try {
        parsedJson = JSON.parse(fileContent);
    }
    catch (error) {
        throw new Error(`Invalid JSON in mapping configuration file at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Validate the parsed JSON against the Zod schema
    const validationResult = mappingConfigSchema.safeParse(parsedJson);
    if (!validationResult.success) {
        // Format Zod errors for better readability
        const errorMessages = validationResult.error.errors.map((err) => `${err.path.join(".") || "config"}: ${err.message}`);
        throw new Error(`Invalid configuration in ${filePath}:\n- ${errorMessages.join("\n- ")}`);
    }
    // Validation successful, return the typed data
    return validationResult.data;
}
/**
 * Loads and merges multiple mapping configuration files.
 * Allows for separate files: one with defaultMapping and another with overrides.
 *
 * @param defaultsFilePath Path to the default mappings file
 * @param overridesFilePath Path to the overrides file (optional)
 * @returns The merged MappingConfig object
 */
export function loadAndMergeMappingConfigs(defaultsFilePath, overridesFilePath) {
    // Load the default mapping file
    const defaultConfig = loadMappingConfig(defaultsFilePath);
    // If no overrides file is provided, return the default config
    if (!overridesFilePath) {
        return defaultConfig;
    }
    try {
        // Load the overrides file
        const overridesConfig = loadMappingConfig(overridesFilePath);
        // Merge the configurations
        return {
            // Use defaultMapping from default config (may be empty object if undefined)
            defaultMapping: {
                ...defaultConfig.defaultMapping,
            },
            // Merge overrides, with the overrides file taking precedence
            overrides: {
                ...defaultConfig.overrides,
                ...overridesConfig.overrides,
            },
        };
    }
    catch (error) {
        // If there's an error with the overrides file, log a warning and return just the defaults
        console.warn("Warning: Could not load overrides file. Using only default mappings.");
        console.error(error instanceof Error ? error.message : String(error));
        return defaultConfig;
    }
}
