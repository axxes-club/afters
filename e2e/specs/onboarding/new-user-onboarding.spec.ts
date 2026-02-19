import { test, expect } from '../../fixtures';

test.describe('New User Onboarding', () => {
  test('should complete onboarding flow and redirect to dashboard', async ({
    page,
    onboardingPage,
    authenticateAs,
    newTestUser,
  }) => {
    // Authenticate as new user (no profile yet)
    await authenticateAs(newTestUser, { skipOnboarding: false });

    // Navigate to dashboard - should redirect to onboarding
    await page.goto('/b');

    // Wait for either dashboard or onboarding
    await page.waitForURL(/\/(d|onboarding)/, { timeout: 15000 });

    // If redirected to onboarding, complete the flow
    if (page.url().includes('/onboarding')) {
      // Complete welcome step
      await onboardingPage.completeWelcomeStep();

      // Fill onboarding form
      await onboardingPage.fillProfile({
        displayName: newTestUser.displayName,
        slug: newTestUser.slug,
        bio: 'E2E test organizer bio - testing the full onboarding flow',
      });

      // Verify slug is valid (no error shown)
      await onboardingPage.expectSlugAvailable();

      // Submit
      await onboardingPage.submitProfile();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/b/, { timeout: 15000 });
    }

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/b/);
  });

  test('should show error for invalid slug format', async ({
    page,
    onboardingPage,
    authenticateAs,
    newTestUser,
  }) => {
    await authenticateAs(newTestUser, { skipOnboarding: false });
    await page.goto('/onboarding');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Try to proceed if on welcome step
    const letsGoButton = page.getByRole('button', { name: /let's go/i });
    if (await letsGoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await letsGoButton.click();
    }

    // Wait for form
    await expect(onboardingPage.displayNameInput).toBeVisible({ timeout: 5000 });

    // Try to use invalid slug with uppercase
    await onboardingPage.fillProfile({
      displayName: 'Test Organizer',
      slug: 'Invalid-SLUG-123',
    });

    // Should show error for uppercase letters
    await onboardingPage.expectSlugError();
  });

  test('should auto-generate slug from display name', async ({
    page,
    onboardingPage,
    authenticateAs,
    newTestUser,
  }) => {
    await authenticateAs(newTestUser, { skipOnboarding: false });
    await page.goto('/onboarding');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Try to proceed if on welcome step
    const letsGoButton = page.getByRole('button', { name: /let's go/i });
    if (await letsGoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await letsGoButton.click();
    }

    // Wait for form
    await expect(onboardingPage.displayNameInput).toBeVisible({ timeout: 5000 });

    // Fill display name
    await onboardingPage.displayNameInput.fill('DJ Test Artist');

    // Wait for auto-generation
    await page.waitForTimeout(500);

    // Check that slug input has a value (auto-generated)
    const slugValue = await onboardingPage.slugInput.inputValue();
    expect(slugValue.length).toBeGreaterThan(0);
  });
});
