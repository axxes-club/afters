import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright Configuration for Afters E2E Tests
 * 
 * Run commands:
 *   pnpm test:e2e              # Run all tests
 *   pnpm test:e2e:ui           # Open UI mode
 *   pnpm test:e2e:headed       # Run with visible browser
 *   pnpm test:e2e:debug        # Debug mode
 *   pnpm test:e2e:codegen      # Generate tests from browser actions
 */
export default defineConfig({
  testDir: './e2e/specs',

  // Run tests sequentially within a file, parallel across files
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,

  // Fail fast in CI, allow retries
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Timeout settings
  timeout: 60_000, // 60s per test
  expect: {
    timeout: 10_000, // 10s for assertions
  },

  // Reporter configuration
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
      ]
    : [
        ['list'],
        ['html', { open: 'on-failure' }],
      ],

  // Global setup/teardown for Neon branch management
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  // Output directory for test artifacts
  outputDir: 'test-results',

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

    // Locale and timezone for consistent test behavior
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Accessibility testing
    bypassCSP: true,
  },

  projects: [
    // ─── Auth Setup ───
    // Runs first, creates authenticated state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ─── Desktop Browsers ───
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility testing
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // ─── Mobile Browsers ───
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific settings
        isMobile: true,
        hasTouch: true,
      },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        isMobile: true,
        hasTouch: true,
      },
      dependencies: ['setup'],
    },

    // ─── Accessibility Testing ───
    {
      name: 'a11y',
      testDir: './e2e/specs/accessibility',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
          forcedColors: 'active',
        },
      },
      dependencies: ['setup'],
    },
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
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
