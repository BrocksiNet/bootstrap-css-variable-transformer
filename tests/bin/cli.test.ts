import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CliOptions, parseArguments, runTransformation } from "../../src/bin/cli"; // Import runTransformation and CliOptions type
import { loadMappingConfig } from "../../src/lib/mapping-loader.js"; // Import for mocking
import { TransformMethod, transformCss } from "../../src/lib/transformer.js"; // Import for mocking and TransformMethod enum
import type { MappingConfig } from "../../src/schemas/configSchema.js";

// Mock core modules
vi.mock("node:fs");
vi.mock("../../src/lib/transformer.js");
vi.mock("../../src/lib/mapping-loader.js");

// Mocked functions
const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);
const mockedTransformCss = vi.mocked(transformCss);
const mockedLoadMappingConfig = vi.mocked(loadMappingConfig);

// Mock process.argv for testing purposes
const baseArgv = ["/usr/bin/node", "/path/to/cli.js"]; // Mock node executable and script path

describe("CLI Argument Parsing", () => {
  it("should parse valid required arguments", () => {
    const argv = [
      ...baseArgv,
      "--input",
      "my-input.css",
      "--output",
      "my-output.css",
      "--config",
      "my-config.json",
    ];
    const options = parseArguments(argv);
    expect(options.input).toBe("my-input.css");
    expect(options.output).toBe("my-output.css");
    expect(options.config).toBe("my-config.json");
  });

  it("should parse valid short arguments", () => {
    const argv = [...baseArgv, "-i", "in.css", "-o", "out.css", "-c", "cfg.json"];
    const options = parseArguments(argv);
    expect(options.input).toBe("in.css");
    expect(options.output).toBe("out.css");
    expect(options.config).toBe("cfg.json");
  });

  it("should throw an error if --input is missing", () => {
    const argv = [
      ...baseArgv,
      // Missing --input
      "--output",
      "my-output.css",
      "--config",
      "my-config.json",
    ];
    // Commander throws a specific error, we check if it throws anything
    expect(() => parseArguments(argv)).toThrow();
    // Optionally, check for specific error message or type if needed
    // expect(() => parseArguments(argv)).toThrow(/required option.*input/);
  });

  it("should throw an error if --output is missing", () => {
    const argv = [
      ...baseArgv,
      "--input",
      "my-input.css",
      // Missing --output
      "--config",
      "my-config.json",
    ];
    expect(() => parseArguments(argv)).toThrow();
  });

  it("should throw an error if --config is missing", () => {
    const argv = [
      ...baseArgv,
      "--input",
      "my-input.css",
      "--output",
      "my-output.css",
      // Missing --config
    ];
    expect(() => parseArguments(argv)).toThrow();
  });

  // Add more tests for edge cases or optional arguments if they exist
});

describe("CLI Transformation Execution", () => {
  beforeEach(() => {
    // Reset mocks before each test in this suite
    vi.resetAllMocks();

    // Default mock implementations
    mockedReadFileSync.mockReturnValue("dummy css content");
    mockedLoadMappingConfig.mockResolvedValue({
      defaultMapping: {},
      overrides: {},
    } as unknown as MappingConfig); // Mock resolved value for async function
  });

  it("should write .vars.css and import rule when targetVariables exist", async () => {
    const options: CliOptions = {
      input: "input.css",
      output: "output/final.css",
      config: "config.json",
      method: TransformMethod.AST,
      overrides: undefined,
    };

    const mockTargetVars = new Set(["--theme-one", "--theme-two"]);
    const mockTransformedCss = ":root { color: blue; }";
    mockedTransformCss.mockReturnValue({
      css: mockTransformedCss,
      targetVariables: mockTargetVars,
    });

    await runTransformation(options);

    // Check writeFileSync calls
    expect(mockedWriteFileSync).toHaveBeenCalledTimes(2);

    // Check .vars.css file write
    const expectedVarsPath = path.resolve("output/final.vars.css");
    const expectedVarsContent = ":root {\n  --theme-one: ;\n  --theme-two: ;\n}\n";
    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      expectedVarsPath,
      expectedVarsContent,
      "utf-8",
    );

    // Check final .css file write (with import)
    const expectedFinalPath = path.resolve("output/final.css");
    const expectedFinalContent = `@import url('./final.vars.css');\n\n${mockTransformedCss}`;
    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      expectedFinalPath,
      expectedFinalContent,
      "utf-8",
    );
  });

  it("should NOT write .vars.css or import rule when targetVariables is empty", async () => {
    const options: CliOptions = {
      input: "in.css",
      output: "out/other.css",
      config: "cfg.json",
      method: TransformMethod.AST,
      overrides: undefined,
    };

    const mockTransformedCss = ".rule {}";
    mockedTransformCss.mockReturnValue({
      css: mockTransformedCss,
      targetVariables: new Set(), // Empty set
    });

    await runTransformation(options);

    // Check writeFileSync calls - should only be called once for the main file
    expect(mockedWriteFileSync).toHaveBeenCalledTimes(1);

    // Check final .css file write (without import)
    const expectedFinalPath = path.resolve("out/other.css");
    expect(mockedWriteFileSync).toHaveBeenCalledWith(
      expectedFinalPath,
      mockTransformedCss, // Original transformed CSS, no import
      "utf-8",
    );
  });

  it("should catch and log errors during transformation", async () => {
    const options: CliOptions = {
      input: "in.css",
      output: "out/other.css",
      config: "cfg.json",
      method: TransformMethod.AST,
      overrides: undefined,
    };
    const transformError = new Error("Transformation failed!");

    // Mock transformCss to throw an error
    mockedTransformCss.mockImplementation(() => {
      throw transformError;
    });

    // Spy on console.error
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {}); // Suppress console output during test

    // Expect runTransformation to throw the error it catches
    await expect(runTransformation(options)).rejects.toThrow(transformError);

    // Check that the error was logged
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error during transformation process:"),
      transformError,
    );

    // Ensure output file was NOT written
    expect(mockedWriteFileSync).not.toHaveBeenCalled();

    // Restore console.error spy
    errorSpy.mockRestore();
  });
});
