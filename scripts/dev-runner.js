import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register ts-node/esm loader
register("ts-node/esm", pathToFileURL("./"));

// Main execution logic for the runner
async function run() {
  try {
    // Import cli.ts functions *after* registration
    const { parseArguments, runTransformation } = await import("../src/bin/cli.ts");

    console.info("Parsing command-line arguments...");
    // Pass the command-line arguments (slice off node executable and script path)
    const options = parseArguments(process.argv);

    await runTransformation(options);
  } catch (error) {
    console.error("Error during script execution via runner:", error);
    process.exit(1); // Exit with error code if anything fails
  }
}

run();
