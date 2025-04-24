import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseArguments, runExtraction } from "../../src/bin/extract-variables";

// Mock core modules
vi.mock("node:fs");

// Mocked functions
const mockedReadFileSync = vi.mocked(readFileSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);

// Mock process.argv base
const baseArgv = ["/usr/bin/node", "/path/to/extract-variables.js"];

describe("Extract Variables CLI", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  describe("Argument Parsing", () => {
    it("should parse required input argument", () => {
      const argv = [...baseArgv, "-i", "input.css"];
      const options = parseArguments(argv);
      expect(options.input).toBe("input.css");
      // Check defaults
      expect(options.output).toBe("config/default-mapping.json");
      expect(options.prefix).toBe("--bs-");
    });

    it("should parse optional output and prefix arguments", () => {
      const argv = [...baseArgv, "-i", "in.css", "-o", "out.json", "-p", "--custom-"];
      const options = parseArguments(argv);
      expect(options.input).toBe("in.css");
      expect(options.output).toBe("out.json");
      expect(options.prefix).toBe("--custom-");
    });

    it("should throw an error if input argument is missing", () => {
      const argv = [...baseArgv]; // Missing -i
      expect(() => parseArguments(argv)).toThrow();
    });
  });

  describe("Extraction Execution", () => {
    it("should read input, extract variables, and write JSON mapping", async () => {
      const options = {
        input: "test-input.css",
        output: "test-output.json",
        prefix: "--bs-",
      };
      const cssContent = `
        :root {
          --bs-blue: #0d6efd;
          --bs-font-size: 1rem;
          --other-var: red; /* Should be ignored */
        }
        .rule { --bs-red: #dc3545; } /* Should find this too */
      `;

      mockedReadFileSync.mockReturnValue(cssContent);

      await runExtraction(options);

      // Check readFileSync was called
      expect(mockedReadFileSync).toHaveBeenCalledWith(path.resolve(options.input), "utf-8");

      // Check writeFileSync was called
      expect(mockedWriteFileSync).toHaveBeenCalledTimes(1);

      // Check the content written to the file
      const expectedJson = {
        defaultMapping: {
          "--bs-blue": "#0d6efd",
          "--bs-font-size": "1rem",
          "--bs-red": "#dc3545",
        },
      };
      const expectedOutputPath = path.resolve(options.output);
      const actualJsonString = mockedWriteFileSync.mock.calls[0][1]; // Get the content argument

      expect(mockedWriteFileSync).toHaveBeenCalledWith(
        expectedOutputPath,
        expect.any(String), // We check the parsed content below
        "utf-8",
      );
      expect(JSON.parse(actualJsonString as string)).toEqual(expectedJson);
    });

    it("should use the specified prefix for extraction", async () => {
      const options = {
        input: "prefix-input.css",
        output: "prefix-output.json",
        prefix: "--custom-", // Custom prefix
      };
      const cssContent = `
        :root {
          --custom-color: green;
          --bs-blue: #0d6efd; /* Should be ignored */
        }
      `;

      mockedReadFileSync.mockReturnValue(cssContent);

      await runExtraction(options);

      expect(mockedReadFileSync).toHaveBeenCalledWith(path.resolve(options.input), "utf-8");
      expect(mockedWriteFileSync).toHaveBeenCalledTimes(1);

      const expectedJson = {
        defaultMapping: {
          "--custom-color": "green",
        },
      };
      const actualJsonString = mockedWriteFileSync.mock.calls[0][1];
      expect(JSON.parse(actualJsonString as string)).toEqual(expectedJson);
    });

    // TODO: Add test for error handling during extraction (e.g., file read error)
  });
});
