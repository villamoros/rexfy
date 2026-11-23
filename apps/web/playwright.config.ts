import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Same Clerk development instance as `npm run dev`; @clerk/testing reads the keys from here.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
process.env.CLERK_PUBLISHABLE_KEY ??=
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "es-CO",
    trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    {
      name: "public-desktop",
      testMatch: /public-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "public-mobile",
      testMatch: /public-smoke\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "commercial-desktop",
      testIgnore: /public-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "commercial-mobile",
      testIgnore: /public-smoke\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
  outputDir: "test-results",
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: ci ? "npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !ci,
        timeout: 180_000,
      },
});
