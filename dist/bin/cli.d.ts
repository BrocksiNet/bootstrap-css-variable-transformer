#!/usr/bin/env node
import { TransformMethod } from "../lib/transformer.js";
export interface CliOptions {
    input: string;
    output: string;
    config: string;
    overrides?: string;
    method: TransformMethod;
}
export declare function parseArguments(argv: string[]): CliOptions;
export declare function runTransformation(options: CliOptions): Promise<void>;
