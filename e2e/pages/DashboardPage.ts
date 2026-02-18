import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the dashboard (/d)
 */
export class DashboardPage extends BasePage {
  // Navigation
  readonly eventsLink: Locator;
  readonly settingsLink: Locator;
  readonly createEventButton: Locator;

  // Content
  readonly pageTitle: Locator;
  readonly eventsList: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);

    // Navigation
    this.eventsLink = page.getByRole('link', { name: /events/i });
    this.settingsLink = page.getByRole('link', { name: /settings/i });
    this.createEventButton = page.getByRole('link', { name: /create event|new event/i });

    // Content
    this.pageTitle = page.locator('h1').first();
    this.eventsList = page.locator('[data-testid="events-list"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.navigateTo('/d');
  }

  /**
   * Navigate to create event page
   */
  async goToCreateEvent() {
    await this.createEventButton.click();
    await expect(this.page).toHaveURL(/\/d\/events\/new/, { timeout: 10000 });
  }

  /**
   * Navigate to a specific event by ID
   */
  async goToEvent(eventId: string) {
    await this.navigateTo(`/d/events/${eventId}`);
  }

  /**
   * Check if user is on the dashboard
   */
  async expectOnDashboard() {
    await expect(this.page).toHaveURL(/\/d/);
  }

  /**
   * Check if events list has items
   */
  async expectHasEvents() {
    await expect(this.eventsList).toBeVisible();
    const count = await this.eventsList.locator('[data-testid="event-card"]').count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Check if showing empty state
   */
  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Click on an event card by title
   */
  async clickEventByTitle(title: string) {
    const eventCard = this.page.locator(`[data-testid="event-card"]:has-text("${title}")`);
    await eventCard.click();
  }
}
