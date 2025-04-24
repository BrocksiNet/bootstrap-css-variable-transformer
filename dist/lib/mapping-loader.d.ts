import { type MappingConfig } from "../schemas/configSchema.js";
/**
 * Loads, parses, and validates the mapping configuration file using a Zod schema.
 *
 * @param filePath The path to the JSON configuration file.
 * @returns The validated MappingConfig object.
 * @throws Error if the file cannot be read, is not valid JSON, or fails schema validation.
 */
export declare function loadMappingConfig(filePath: string): MappingConfig;
/**
 * Loads and merges multiple mapping configuration files.
 * Allows for separate files: one with defaultMapping and another with overrides.
 *
 * @param defaultsFilePath Path to the default mappings file
 * @param overridesFilePath Path to the overrides file (optional)
 * @returns The merged MappingConfig object
 */
export declare function loadAndMergeMappingConfigs(defaultsFilePath: string, overridesFilePath?: string): MappingConfig;
