
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "authentication/authentication.test.ts",
    "projects/projects.test.ts",
    "users/users.test.ts",
  ],
    include: ["**/*.test.ts"],
    setupFiles: ["./setup.ts"],
    testTimeout: 10_000,
    hookTimeout: 15_000,
    clearMocks: true,
    restoreMocks: true,
  },
});
