import { Page, expect } from '@playwright/test';

/**
 * Common test helper utilities
 */

/**
 * Wait for network to be idle with timeout
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Network idle timeout is OK, continue
  }
}

/**
 * Wait for all images to load
 */
export async function waitForImages(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const images = Array.from(document.images);
      return images.every((img) => img.complete && img.naturalHeight !== 0);
    },
    { timeout }
  );
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * Scroll element into view and wait for it to be visible
 */
export async function scrollIntoViewAndWait(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Get all console errors from page
 */
export function setupConsoleErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * Mock API response for testing
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: {
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
  }
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response.body ?? {}),
      headers: response.headers,
    });
  });
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return page.evaluate(() => {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      load: timing.loadEventEnd - timing.navigationStart,
      firstPaint: navigation?.startTime ?? 0,
      ttfb: timing.responseStart - timing.navigationStart,
    };
  });
}

/**
 * Take a full-page screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(
  page: Page,
  type: 'success' | 'error' | 'any' = 'any',
  timeout = 5000
) {
  const selector = type === 'any'
    ? '[data-sonner-toast]'
    : `[data-sonner-toast][data-type="${type}"]`;
  
  await expect(page.locator(selector).first()).toBeVisible({ timeout });
  return page.locator(selector).first();
}

/**
 * Dismiss all toasts
 */
export async function dismissAllToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]');
  const count = await toasts.count();
  
  for (let i = 0; i < count; i++) {
    const toast = toasts.nth(i);
    if (await toast.isVisible()) {
      await toast.click();
    }
  }
}

/**
 * Fill form by field labels
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string>
) {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }
}

/**
 * Generate unique test data
 */
export function generateTestData(prefix: string) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: `${prefix}-${unique}`,
    email: `${prefix}-${unique}@test.afters.app`,
    slug: `${prefix}-${unique}`.toLowerCase(),
    name: `Test ${prefix} ${unique.slice(-6)}`,
  };
}

/**
 * Wait for redirect to a URL pattern
 */
export async function waitForRedirect(
  page: Page,
  urlPattern: RegExp,
  timeout = 10000
) {
  await expect(page).toHaveURL(urlPattern, { timeout });
}

/**
 * Check if running in CI
 */
export function isCI(): boolean {
  return process.env.CI === 'true';
}

/**
 * Skip test if condition is not met
 */
export function skipIf(condition: boolean, reason: string) {
  if (condition) {
    console.log(`Skipping test: ${reason}`);
    return true;
  }
  return false;
}
