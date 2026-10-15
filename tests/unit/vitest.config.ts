import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@about-me/web": path.resolve(rootDir, "../../apps/web/src"),
      "@build-me/ui/navbar": path.resolve(
        rootDir,
        "../../packages/ui/src/components/navbar/index.ts"
      ),
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(rootDir, "setup.ts")],
  },
});