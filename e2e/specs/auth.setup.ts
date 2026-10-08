import { test as setup } from '@playwright/test';

/**
 * Auth setup - runs before all tests to establish authentication state.
 *
 * This setup file:
 * 1. Ensures the test environment is ready
 *
 * Note: Individual tests use the `authenticateAs` fixture to set up
 * specific user sessions as needed.
 */
setup('configure auth environment', async ({ page }) => {
  // Verify the app is running
  const response = await page.goto('/');

  if (!response?.ok()) {
    throw new Error(`App not responding: ${response?.status()}`);
  }

  console.log('✅ Auth setup complete - app is running');
});
