import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e/specs',

  // Run tests sequentially within a file, parallel across files
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,

  // Fail fast in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never' }]],

  // Global setup/teardown for Neon branch management
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  use: {
    // Base URL for Next.js dev server
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Viewport for consistency
    viewport: { width: 1280, height: 720 },

    // Additional context options
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Auth setup project - runs first, creates authenticated state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main test project with Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Firefox (optional - uncomment to enable)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },

    // Mobile viewport testing (optional - uncomment to enable)
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      ENABLE_AUTH_IN_DEV: 'true',
    },
  },
});
