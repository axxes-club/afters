import { BrowserContext, Page } from '@playwright/test';

export interface TestSessionUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Sign the page in as a test user through /api/e2e/sign-in (non-production
 * only, guarded by E2E_AUTH_BYPASS_TOKEN). The session cookie lands in the
 * page's browser context, exactly as a real sign-in would leave it.
 */
export async function setupTestSession(page: Page, user: TestSessionUser): Promise<void> {
  const bypassToken = process.env.E2E_AUTH_BYPASS_TOKEN;
  if (!bypassToken) {
    throw new Error('E2E_AUTH_BYPASS_TOKEN not set - required for signed-in E2E tests');
  }
  const response = await page.request.post('/api/e2e/sign-in', {
    headers: { 'X-E2E-Bypass-Token': bypassToken, 'Content-Type': 'application/json' },
    data: user,
  });
  if (!response.ok()) {
    throw new Error(`E2E sign-in failed: ${response.status()} - ${await response.text()}`);
  }
}

/** Clear the session and any client storage. */
export async function clearSession(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.addInitScript(() => {
    window.sessionStorage.clear();
  });
}

/** Is the page showing signed-in UI? */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const dashboardLink = page.locator('a[href="/b"]');
  const signOutButton = page.locator('button:has-text("Sign out")');
  const userButton = page.locator('[aria-label="Account menu"]');

  return (
    (await dashboardLink.isVisible()) ||
    (await signOutButton.isVisible()) ||
    (await userButton.isVisible())
  );
}
