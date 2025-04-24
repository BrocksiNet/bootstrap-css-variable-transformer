import { readFileSync } from "node:fs";
// tests/lib/mapping-loader.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadAndMergeMappingConfigs, loadMappingConfig } from "../../src/lib/mapping-loader"; // Also import the new function
// Import type from schema definition
import type { MappingConfig } from "../../src/schemas/configSchema.js";

// Mock the fs module
vi.mock("node:fs");

// Remove manual interface definition
// interface MappingConfig {
//   defaultMapping: Record<string, string>;
//   overrides: Record<string, string>;
// }

describe("Mapping Loader", () => {
  // Use mocked version of readFileSync
  const mockedReadFileSync = vi.mocked(readFileSync);

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it("should load and parse a valid mapping configuration file", () => {
    const mockFilePath = "valid-config.json";
    const mockConfigContent: MappingConfig = {
      defaultMapping: { "--bs-primary": "--theme-primary" },
      overrides: {},
    };
    const mockJsonString = JSON.stringify(mockConfigContent);

    mockedReadFileSync.mockReturnValue(mockJsonString);

    const config = loadMappingConfig(mockFilePath);

    expect(mockedReadFileSync).toHaveBeenCalledWith(mockFilePath, "utf-8");
    expect(config).toEqual({
      defaultMapping: { "--bs-primary": "--theme-primary" },
      overrides: {}, // The schema adds this default
    });
  });

  it("should throw an error if the file does not exist", () => {
    const mockFilePath = "non-existent-config.json";
    const error = new Error("File not found") as NodeJS.ErrnoException;
    error.code = "ENOENT"; // Simulate file not found error

    mockedReadFileSync.mockImplementation(() => {
      throw error;
    });

    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /File not found.*non-existent-config\.json/i,
    );
    expect(mockedReadFileSync).toHaveBeenCalledWith(mockFilePath, "utf-8");
  });

  it("should throw a generic error for other read errors", () => {
    const mockFilePath = "read-error-config.json";
    const readError = new Error("Disk read error"); // Generic error

    mockedReadFileSync.mockImplementation(() => {
      throw readError;
    });

    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /Error reading mapping configuration file.*Disk read error/i,
    );
    expect(mockedReadFileSync).toHaveBeenCalledWith(mockFilePath, "utf-8");
  });

  it("should throw an error for invalid JSON", () => {
    const mockFilePath = "invalid-config.json";
    const invalidJsonString = '{"defaultMapping": "broken'; // Invalid JSON

    mockedReadFileSync.mockReturnValue(invalidJsonString);

    expect(() => loadMappingConfig(mockFilePath)).toThrow(/Invalid JSON.*invalid-config\.json/i);
    expect(mockedReadFileSync).toHaveBeenCalledWith(mockFilePath, "utf-8");
  });

  // --- Tests for Schema Validation ---

  it("should throw an error if defaultMapping is not an object", () => {
    const mockFilePath = "invalid-default-type.json";
    const invalidConfig = {
      defaultMapping: "not-an-object",
      overrides: { key: "value" },
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));
    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /defaultMapping: Expected object.*received string/i,
    );
  });

  it("should throw an error if overrides is not an object", () => {
    const mockFilePath = "invalid-overrides-type.json";
    const invalidConfig = {
      defaultMapping: { key: "value" },
      overrides: 123, // Not an object
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));
    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /overrides: Expected object.*received number/i,
    );
  });

  it("should throw an error if defaultMapping contains non-string values", () => {
    const mockFilePath = "invalid-default-value.json";
    const invalidConfig = {
      defaultMapping: { key1: "valid", key2: 123 }, // Contains number
      overrides: { key: "value" },
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));
    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /defaultMapping\.key2: Expected string.*received number/i,
    );
  });

  it("should throw an error if overrides contains non-string values", () => {
    const mockFilePath = "invalid-overrides-value.json";
    const invalidConfig = {
      defaultMapping: { key: "value" },
      overrides: { key1: "valid", key2: false }, // Contains boolean
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(invalidConfig));
    expect(() => loadMappingConfig(mockFilePath)).toThrow(
      /overrides\.key2: Expected string.*received boolean/i,
    );
  });

  // Tests for loadAndMergeMappingConfigs function
  describe("loadAndMergeMappingConfigs", () => {
    it("should load and merge two valid configuration files", () => {
      const defaultsPath = "default-config.json";
      const overridesPath = "overrides-config.json";

      const defaultConfig = {
        defaultMapping: {
          "--bs-primary": "#0d6efd",
          "--bs-secondary": "#6c757d",
        },
      };

      const overridesConfig = {
        overrides: {
          "--bs-btn-primary-bg": "--custom-primary",
          "--bs-btn-secondary-bg": "--custom-secondary",
        },
      };

      // Mock readFileSync to return different content based on the path
      mockedReadFileSync.mockImplementation((path) => {
        if (path === defaultsPath) {
          return JSON.stringify(defaultConfig);
        }
        if (path === overridesPath) {
          return JSON.stringify(overridesConfig);
        }
        throw new Error("Unexpected path");
      });

      const mergedConfig = loadAndMergeMappingConfigs(defaultsPath, overridesPath);

      // Verify the files were read
      expect(mockedReadFileSync).toHaveBeenCalledWith(defaultsPath, "utf-8");
      expect(mockedReadFileSync).toHaveBeenCalledWith(overridesPath, "utf-8");

      // Verify the merged result
      expect(mergedConfig).toEqual({
        defaultMapping: {
          "--bs-primary": "#0d6efd",
          "--bs-secondary": "#6c757d",
        },
        overrides: {
          "--bs-btn-primary-bg": "--custom-primary",
          "--bs-btn-secondary-bg": "--custom-secondary",
        },
      });
    });

    it("should return only defaults if overrides file is not provided", () => {
      const defaultsPath = "default-config.json";

      const defaultConfig = {
        defaultMapping: { "--bs-primary": "#0d6efd" },
      };

      mockedReadFileSync.mockReturnValue(JSON.stringify(defaultConfig));

      const config = loadAndMergeMappingConfigs(defaultsPath);

      expect(mockedReadFileSync).toHaveBeenCalledWith(defaultsPath, "utf-8");
      expect(mockedReadFileSync).toHaveBeenCalledTimes(1); // Should only read one file
      expect(config).toEqual({
        defaultMapping: { "--bs-primary": "#0d6efd" },
        overrides: {}, // Default from schema
      });
    });

    it("should return only defaults and warn if overrides file has an error", () => {
      const defaultsPath = "default-config.json";
      const overridesPath = "error-overrides.json";

      const defaultConfig = {
        defaultMapping: { "--bs-primary": "#0d6efd" },
      };

      // Mock console.warn and console.error to capture messages
      const originalWarn = console.warn;
      const originalError = console.error;
      const mockWarn = vi.fn();
      const mockError = vi.fn();
      console.warn = mockWarn;
      console.error = mockError;

      // Set up mocks for readFileSync
      const overrideError = new Error("Error reading overrides file");
      mockedReadFileSync.mockImplementation((path) => {
        if (path === defaultsPath) {
          return JSON.stringify(defaultConfig);
        }
        if (path === overridesPath) {
          // Simulate error when trying to load overrides
          // This will trigger the catch block in loadMappingConfig for the overrides path
          throw overrideError;
        }
        throw new Error("Unexpected path");
      });

      const config = loadAndMergeMappingConfigs(defaultsPath, overridesPath);

      // Restore console methods
      console.warn = originalWarn;
      console.error = originalError;

      // Verify the default file was read
      expect(mockedReadFileSync).toHaveBeenCalledWith(defaultsPath, "utf-8");
      expect(mockedReadFileSync).toHaveBeenCalledWith(overridesPath, "utf-8");

      // Verify warnings and errors were logged
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining("Warning: Could not load overrides file"),
      );
      expect(mockError).toHaveBeenCalledTimes(1);
      // Check for the more specific error message thrown by loadMappingConfig
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Error reading mapping configuration file at error-overrides.json"),
      );

      // Verify only defaults were returned
      expect(config).toEqual({
        defaultMapping: { "--bs-primary": "#0d6efd" },
        overrides: {}, // Default from schema
      });
    });
  });

  // TODO: Add tests for validating the structure (e.g., missing keys)
});
