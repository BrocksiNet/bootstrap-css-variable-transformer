import type { MappingConfig } from "../schemas/configSchema.js";
/**
 * Transform method to use
 */
export declare enum TransformMethod {
    AST = "ast",
    REGEX = "regex"
}
/**
 * Result of the CSS transformation.
 */
export interface TransformResult {
    css: string;
    targetVariables: Set<string>;
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
export declare function transformCss(cssContent: string, config: MappingConfig, method?: TransformMethod): TransformResult;
