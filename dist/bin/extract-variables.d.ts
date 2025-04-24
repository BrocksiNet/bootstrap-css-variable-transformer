#!/usr/bin/env node
interface CliOptions {
    input: string;
    output: string;
    prefix?: string;
}
export declare function parseArguments(argv: string[]): CliOptions;
export declare function runExtraction(options: CliOptions): Promise<void>;
export {};
