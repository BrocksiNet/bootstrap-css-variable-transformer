import { z } from "zod";
/**
 * Zod schema for validating the mapping configuration file.
 */
export const mappingConfigSchema = z.object({
    /**
     * Default mappings from Bootstrap variables (or hardcoded values)
     * to theme variables. Expects an object where keys and values are strings.
     * Optional in each file but required in the final merged config.
     */
    defaultMapping: z.record(z.string()).optional().default({}),
    /**
     * Specific overrides for component-level Bootstrap variables.
     * These take precedence over default mappings if applicable.
     * Expects an object where keys and values are strings.
     * Optional in each file but required in the final merged config.
     */
    overrides: z.record(z.string()).optional().default({}),
});
