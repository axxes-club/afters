import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the onboarding flow (/onboarding)
 */
export class OnboardingPage extends BasePage {
  // Welcome step
  readonly letsGoButton: Locator;

  // Profile setup form
  readonly displayNameInput: Locator;
  readonly slugInput: Locator;
  readonly bioTextarea: Locator;
  readonly createProfileButton: Locator;

  // Validation
  readonly slugErrorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Welcome step
    this.letsGoButton = page.getByRole('button', { name: /let's go/i });

    // Profile setup form
    this.displayNameInput = page.locator('#displayName');
    this.slugInput = page.locator('#slug');
    this.bioTextarea = page.locator('#bio');
    this.createProfileButton = page.getByRole('button', { name: /create profile/i });

    // Validation
    this.slugErrorMessage = page.locator('p.text-red-500');
  }

  /**
   * Navigate to onboarding page
   */
  async goto() {
    await this.navigateTo('/onboarding');
  }

  /**
   * Complete the welcome step by clicking "Let's Go"
   */
  async completeWelcomeStep() {
    // Wait for welcome step to be visible
    await expect(this.letsGoButton).toBeVisible({ timeout: 10000 });
    await this.letsGoButton.click();
    // Wait for profile form to appear
    await expect(this.displayNameInput).toBeVisible({ timeout: 5000 });
  }

  /**
   * Fill in the profile form fields
   */
  async fillProfile(data: { displayName: string; slug: string; bio?: string }) {
    await this.displayNameInput.fill(data.displayName);
    await this.slugInput.fill(data.slug);

    if (data.bio) {
      await this.bioTextarea.fill(data.bio);
    }

    // Wait for slug validation debounce
    await this.page.waitForTimeout(600);
  }

  /**
   * Submit the profile form
   */
  async submitProfile() {
    await this.createProfileButton.click();
  }

  /**
   * Complete the full onboarding flow
   */
  async completeOnboarding(data: { displayName: string; slug: string; bio?: string }) {
    await this.goto();
    await this.completeWelcomeStep();
    await this.fillProfile(data);
    await this.submitProfile();

    // Should redirect to dashboard
    await expect(this.page).toHaveURL(/\/d/, { timeout: 15000 });
  }

  /**
   * Check if slug shows as available (no error visible)
   */
  async expectSlugAvailable() {
    await expect(this.slugErrorMessage).toBeHidden({ timeout: 3000 });
  }

  /**
   * Check if slug shows an error
   */
  async expectSlugError(message?: string) {
    await expect(this.slugErrorMessage).toBeVisible({ timeout: 3000 });
    if (message) {
      await expect(this.slugErrorMessage).toContainText(message);
    }
  }

  /**
   * Check if the form is in a valid state (submit button enabled)
   */
  async expectFormValid() {
    await expect(this.createProfileButton).toBeEnabled();
  }

  /**
   * Check if the form is invalid (submit button disabled)
   */
  async expectFormInvalid() {
    await expect(this.createProfileButton).toBeDisabled();
  }
}
