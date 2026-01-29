import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    test: {
      environment: "happy-dom",
      globals: true,
      setupFiles: ["./tests/setup.ts"],
      env: {
        DATABASE_URL:
          env.DATABASE_URL || "postgresql://test:test@localhost:5432/test",
        CLERK_SECRET_KEY: "test-clerk-secret",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "test-clerk-publishable",
      },
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["node_modules", ".next", ".vercel"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          ".next/",
          "tests/",
          "**/*.config.{js,ts}",
          "**/types.ts",
          "**/*.d.ts",
        ],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
