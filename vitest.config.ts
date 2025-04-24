import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use the 'node' environment for Node.js-specific testing
    environment: "node",
    // Enable globals like describe, it, expect for convenience
    globals: true,
  },
});
