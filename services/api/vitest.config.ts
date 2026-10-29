
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "../../tests/api/**/*.test.ts"
    ],
    testTimeout: 10_000,
    hookTimeout: 15_000,
    clearMocks: true,
    restoreMocks: true,
  },
});
