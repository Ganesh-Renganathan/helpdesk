import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["line"]],

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "bun run --cwd server src/index.ts",
      url: "http://localhost:8080/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "bun run --cwd client dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
