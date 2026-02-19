import { Page, Locator, expect } from '@playwright/test';

/**
 * Base page object with common methods and elements.
 * All page objects should extend this class.
 */
export class BasePage {
  readonly page: Page;

  // Common elements
  readonly loadingSpinner: Locator;
  readonly toastSuccess: Locator;
  readonly toastError: Locator;
  readonly toastAny: Locator;

  constructor(page: Page) {
    this.page = page;
    // Only match explicit loading indicators, not decorative spinners
    this.loadingSpinner = page.locator('[data-testid="loading"], [data-loading="true"]');
    this.toastSuccess = page.locator('[data-sonner-toast][data-type="success"]');
    this.toastError = page.locator('[data-sonner-toast][data-type="error"]');
    this.toastAny = page.locator('[data-sonner-toast]');
  }

  /**
   * Wait for the page to fully load (network idle)
   */
  async waitForPageLoad(options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 10000;
    await this.page.waitForLoadState('networkidle', { timeout });
    // Wait for any explicit loading indicators to disappear
    const spinnerCount = await this.loadingSpinner.count();
    if (spinnerCount > 0) {
      await expect(this.loadingSpinner.first()).toBeHidden({ timeout });
    }
  }

  /**
   * Navigate to a path and wait for page load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Expect a success toast to appear
   */
  async expectSuccessToast(message?: string, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 5000;
    await expect(this.toastSuccess).toBeVisible({ timeout });
    if (message) {
      await expect(this.toastSuccess).toContainText(message);
    }
  }

  /**
   * Expect an error toast to appear
   */
  async expectErrorToast(message?: string, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 5000;
    await expect(this.toastError).toBeVisible({ timeout });
    if (message) {
      await expect(this.toastError).toContainText(message);
    }
  }

  /**
   * Dismiss all visible toasts by clicking them
   */
  async dismissToasts() {
    const count = await this.toastAny.count();
    for (let i = 0; i < count; i++) {
      const toast = this.toastAny.nth(i);
      if (await toast.isVisible()) {
        await toast.click();
      }
    }
  }

  /**
   * Wait for a specific URL pattern
   */
  async expectUrl(pattern: RegExp, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 10000;
    await expect(this.page).toHaveURL(pattern, { timeout });
  }

  /**
   * Fill a form field by label
   */
  async fillByLabel(label: string | RegExp, value: string) {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Click a button by its text
   */
  async clickButton(text: string | RegExp) {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Wait for an API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, options?: { timeout?: number }) {
    const timeout = options?.timeout ?? 30000;
    return this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
