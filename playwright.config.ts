import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "output/playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.QA_BASE_URL ?? "https://www.forthesoul.ch",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "iPhone-SE-WebKit", use: { ...devices["iPhone SE"] } },
    { name: "iPhone-13-WebKit", use: { ...devices["iPhone 13"] } },
    { name: "iPad-Mini-WebKit", use: { ...devices["iPad Mini"] } },
    {
      name: "iPad-Mini-Landscape-WebKit",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 1024, height: 768 },
      },
    },
    { name: "iPad-Pro-11-WebKit", use: { ...devices["iPad Pro 11"] } },
    {
      name: "iPad-Pro-11-Landscape-WebKit",
      use: {
        ...devices["iPad Pro 11"],
        viewport: { width: 1194, height: 834 },
      },
    },
    { name: "Pixel-7-Chromium", use: { ...devices["Pixel 7"] } },
    {
      name: "Android-Tablet-Chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 800, height: 1280 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "Android-Tablet-Landscape-Chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "Tablet-Firefox",
      use: {
        browserName: "firefox",
        viewport: { width: 820, height: 1180 },
        deviceScaleFactor: 1,
        hasTouch: true,
      },
    },
  ],
});
