
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const dashboardRouterEntry = path.resolve(
  rootDir,
  "../../apps/dashboard/node_modules/react-router-dom/dist/index.mjs",
);

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "react-router-dom": dashboardRouterEntry,

      "@about-me/web": path.resolve(
        rootDir,
        "../../apps/web/src",
      ),

      "@build-me/ui/navbar": path.resolve(
        rootDir,
        "../../packages/ui/src/components/Navbar/index.ts",
      ),
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(rootDir, "setup.ts")],
    clearMocks: true,
    restoreMocks: true,
  },
});
