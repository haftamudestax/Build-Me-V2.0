import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "api/**/*.test.ts",
      "authentication/**/*.test.ts",
      "authorization/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
    ],
    setupFiles: ["./setup.ts"],
    testTimeout: 10_000,
    hookTimeout: 15_000,
    clearMocks: true,
    restoreMocks: true,
  },
});