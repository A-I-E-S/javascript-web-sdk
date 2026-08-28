import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '.artifacts/playwright/results',
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: '.artifacts/playwright/report', open: 'never' }]] : 'line',
  retries: process.env.CI ? 2 : 0,
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node tools/serve-playground.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1000 } } },
    { name: 'chromium-tablet', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 768, height: 1000 } } },
    { name: 'chromium-mobile', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 390, height: 844 } } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } } }
  ]
});
