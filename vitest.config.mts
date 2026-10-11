import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: { HIKAYATI_SECRET: "test-secret-test-secret", HIKAYATI_DEMO_ACCESS: "true", NODE_ENV: "test" },
  },
});
