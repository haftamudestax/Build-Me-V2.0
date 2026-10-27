import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "cypress";

function readEnvValue(
  filePath: string,
  name: string,
): string | undefined {
  try {
    const contents = readFileSync(filePath, "utf8");
    const match = contents.match(
      new RegExp(
        `^\\s*${name}\\s*=\\s*["']?([^\\r\\n"']+)["']?\\s*$`,
        "m",
      ),
    );

    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const dashboardEnvPath = resolve(
  __dirname,
  "../../apps/dashboard/.env.local",
);

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  readEnvValue(dashboardEnvPath, "VITE_SUPABASE_URL");

export default defineConfig({
  e2e: {
    baseUrl: "http://127.0.0.1:5174",
    env: {
      supabaseUrl,
      adminBaseUrl: "http://127.0.0.1:5174",
      webBaseUrl: "http://127.0.0.1:5173",
    },
    setupNodeEvents(_on, config) {
      return config;
    },
  },
});