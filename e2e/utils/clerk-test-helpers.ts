import { BrowserContext, Page } from '@playwright/test';

export interface ClerkTestUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Set up a Clerk test session using the @clerk/testing package.
 * This allows bypassing real OAuth flows in E2E tests.
 *
 * Requires CLERK_TESTING_TOKEN environment variable to be set.
 * Get this from: Clerk Dashboard > API Keys > Testing Token
 */
export async function setupClerkTestSession(
  page: Page,
  _user?: ClerkTestUser
): Promise<void> {
  // Use @clerk/testing's setupClerkTestingToken
  // This injects the testing token that Clerk recognizes
  const { setupClerkTestingToken } = await import('@clerk/testing/playwright');

  await setupClerkTestingToken({
    frontendApiUrl: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  });
}

/**
 * Alternative: Set up Clerk test session via cookies directly.
 * Use this if @clerk/testing doesn't work in your setup.
 */
export async function setupClerkTestSessionViaCookies(
  context: BrowserContext,
  user: ClerkTestUser
): Promise<void> {
  const testingToken = process.env.CLERK_TESTING_TOKEN;

  if (!testingToken) {
    throw new Error('CLERK_TESTING_TOKEN not set - required for E2E tests');
  }

  // Clerk's testing token is injected via cookies
  await context.addCookies([
    {
      name: '__clerk_db_jwt',
      value: testingToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '__session',
      value: JSON.stringify({
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
      domain: 'localhost',
      path: '/',
    },
  ]);

  // Also set localStorage for client-side Clerk
  await context.addInitScript((userData) => {
    window.localStorage.setItem('clerk-user', JSON.stringify(userData));
  }, user);
}

/**
 * Clear all Clerk-related session data
 */
export async function clearClerkSession(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  await context.addInitScript(() => {
    window.localStorage.removeItem('clerk-user');
    window.sessionStorage.clear();
  });
}

/**
 * Check if a user is authenticated by looking for Clerk session indicators
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for common authenticated UI elements
  const dashboardLink = page.locator('a[href="/d"]');
  const signOutButton = page.locator('button:has-text("Sign out")');
  const userButton = page.locator('[data-clerk-component="user-button"]');

  return (
    (await dashboardLink.isVisible()) ||
    (await signOutButton.isVisible()) ||
    (await userButton.isVisible())
  );
}
