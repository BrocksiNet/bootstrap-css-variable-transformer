import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "lightningcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the project root relative to the script location
const projectRoot = path.resolve(__dirname, "..");
const cssFilePath = path.join(projectRoot, "output", "all.css");

console.info(`Attempting to validate CSS file: ${cssFilePath}`);

try {
  const cssContent = fs.readFileSync(cssFilePath, "utf8");

  if (!cssContent.trim()) {
    console.warn("CSS file is empty. Skipping validation.");
    process.exit(0); // Treat empty as valid for this check
  }

  transform({
    filename: path.basename(cssFilePath),
    code: Buffer.from(cssContent),
    visitor: {}, // Empty visitor - just parse
    errorRecovery: false, // Fail on first error
  });

  console.info("CSS validation successful: lightningcss parsed the file without errors.");
  process.exit(0);
} catch (error) {
  console.error("CSS validation failed:");
  console.error(error instanceof Error ? error.message : String(error));
  // Optionally print more error details if available
  if (error && typeof error === "object" && "source" in error) {
    console.error("--- Error Source Snippet ---");
    console.error(error.source);
    console.error("--------------------------");
  }
  process.exit(1);
}
