import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3400);

/**
 * End-to-end journey against a PRODUCTION build with an isolated in-memory database and demo access on
 * (so the seeded fictional accounts and the on-screen OTP exist). Run: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: process.env.E2E_REUSE ? 60_000 : 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || (process.platform === "linux" ? "/opt/pw-browsers/chromium" : undefined), args: ["--no-sandbox"] },
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !!process.env.E2E_REUSE,
    timeout: 120_000,
    env: {
      HIKAYATI_DEMO_ACCESS: "true",
      HIKAYATI_SECRET: "e2e-secret-e2e-secret",
      HIKAYATI_DATA_DIR: "memory://",
      HIKAYATI_DEV_OTP: "123456",
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next",
    },
  },
});
