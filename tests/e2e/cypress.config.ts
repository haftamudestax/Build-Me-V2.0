import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "cypress";

function readEnvValue(filePath: string, name: string): string | undefined {
  try {
    const contents = readFileSync(filePath, "utf8");
    const match = contents.match(
      new RegExp(`^\\s*${name}\\s*=\\s*["']?([^\\r\\n"']+)["']?\\s*$`, "m"),
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

const supabaseUrl = readEnvValue(
  dashboardEnvPath,
  "VITE_SUPABASE_URL",
);

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      config.env.supabaseUrl = supabaseUrl;
      return config;
    },
  },
});