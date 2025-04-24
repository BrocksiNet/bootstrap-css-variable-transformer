import { z } from "zod";
/**
 * Zod schema for validating the mapping configuration file.
 */
export declare const mappingConfigSchema: z.ZodObject<{
    /**
     * Default mappings from Bootstrap variables (or hardcoded values)
     * to theme variables. Expects an object where keys and values are strings.
     * Optional in each file but required in the final merged config.
     */
    defaultMapping: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
    /**
     * Specific overrides for component-level Bootstrap variables.
     * These take precedence over default mappings if applicable.
     * Expects an object where keys and values are strings.
     * Optional in each file but required in the final merged config.
     */
    overrides: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    defaultMapping: Record<string, string>;
    overrides: Record<string, string>;
}, {
    defaultMapping?: Record<string, string> | undefined;
    overrides?: Record<string, string> | undefined;
}>;
/**
 * Inferred TypeScript type from the mappingConfigSchema.
 * Use this type in your application code.
 */
export type MappingConfig = z.infer<typeof mappingConfigSchema>;
