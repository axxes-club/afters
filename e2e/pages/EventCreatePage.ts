import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for event creation (/b/events/new)
 */
export class EventCreatePage extends BasePage {
  // Event type toggles
  readonly ticketedButton: Locator;
  readonly rsvpButton: Locator;

  // Event details
  readonly titleInput: Locator;
  readonly descriptionTextarea: Locator;

  // Date & Time
  readonly startsAtInput: Locator;
  readonly endsAtInput: Locator;
  readonly tonightButton: Locator;
  readonly tomorrowButton: Locator;

  // Venue
  readonly venueNameInput: Locator;
  readonly venueAddressInput: Locator;
  readonly citySelect: Locator;
  readonly stateInput: Locator;
  readonly secretLocationToggle: Locator;

  // RSVP settings (visible when RSVP mode)
  readonly rsvpCapacityInput: Locator;
  readonly allowPlusOnesToggle: Locator;

  // Style
  readonly accentColorButtons: Locator;
  readonly customColorPicker: Locator;

  // Submit
  readonly createEventButton: Locator;

  constructor(page: Page) {
    super(page);

    // Event type toggles
    this.ticketedButton = page.getByRole('button', { name: /ticketed/i });
    this.rsvpButton = page.getByRole('button', { name: /rsvp only/i });

    // Event details
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionTextarea = page.locator('textarea[name="description"]');

    // Date & Time
    this.startsAtInput = page.locator('input[name="startsAt"]');
    this.endsAtInput = page.locator('input[name="endsAt"]');
    this.tonightButton = page.getByRole('button', { name: /tonight/i });
    this.tomorrowButton = page.getByRole('button', { name: /tomorrow/i });

    // Venue
    this.venueNameInput = page.locator('input[name="venueName"]');
    this.venueAddressInput = page.locator('input[name="venueAddress"]');
    this.citySelect = page.locator('[data-field="city"]');
    this.stateInput = page.locator('input[name="state"]');
    this.secretLocationToggle = page.locator('button:has-text("Secret Location")');

    // RSVP settings
    this.rsvpCapacityInput = page.locator('input[name="rsvpCapacity"]');
    this.allowPlusOnesToggle = page.locator('button:has-text("Allow +1s")');

    // Style
    this.accentColorButtons = page.locator('button[style*="background-color"]');
    this.customColorPicker = page.locator('input[type="color"]');

    // Submit
    this.createEventButton = page.getByRole('button', { name: /create event/i });
  }

  /**
   * Navigate to create event page
   */
  async goto() {
    await this.navigateTo('/b/events/new');
  }

  /**
   * Select event type
   */
  async selectEventType(type: 'ticketed' | 'rsvp') {
    if (type === 'ticketed') {
      await this.ticketedButton.click();
    } else {
      await this.rsvpButton.click();
    }
  }

  /**
   * Fill in the basic event details
   */
  async fillBasicDetails(data: {
    title: string;
    description?: string;
    venueName: string;
    venueAddress: string;
    city: string;
    state?: string;
    startsAt: Date;
    endsAt?: Date;
  }) {
    await this.titleInput.fill(data.title);

    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }

    // Fill venue info
    await this.venueNameInput.fill(data.venueName);
    await this.venueAddressInput.fill(data.venueAddress);

    // Select city from dropdown
    await this.citySelect.click();
    await this.page.getByRole('option', { name: new RegExp(data.city, 'i') }).click();

    if (data.state) {
      await this.stateInput.fill(data.state);
    }

    // Format datetime-local for input
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    await this.startsAtInput.fill(formatDateTimeLocal(data.startsAt));

    if (data.endsAt) {
      // Click "SET TIME" to show ends at input
      const setTimeButton = this.page.getByRole('button', { name: /set time/i });
      if (await setTimeButton.isVisible()) {
        await setTimeButton.click();
      }
      await this.endsAtInput.fill(formatDateTimeLocal(data.endsAt));
    }
  }

  /**
   * Fill RSVP settings (only applicable for RSVP events)
   */
  async fillRsvpSettings(data: { capacity?: number; allowPlusOnes?: boolean }) {
    if (data.capacity !== undefined) {
      await this.rsvpCapacityInput.fill(String(data.capacity));
    }

    if (data.allowPlusOnes) {
      await this.allowPlusOnesToggle.click();
    }
  }

  /**
   * Select an accent color
   */
  async selectAccentColor(colorHex: string) {
    // Try to find a preset color button
    const colorButton = this.page.locator(
      `button[style*="background-color: ${colorHex}"], button[style*="background-color:${colorHex}"]`
    );

    if (await colorButton.isVisible()) {
      await colorButton.click();
    } else {
      // Use custom color picker
      await this.customColorPicker.fill(colorHex);
    }
  }

  /**
   * Submit the form to create the event
   */
  async submit() {
    await this.createEventButton.click();
  }

  /**
   * Create a complete event and return the event ID
   */
  async createEvent(data: {
    title: string;
    description?: string;
    venueName: string;
    venueAddress: string;
    city: string;
    state?: string;
    startsAt: Date;
    endsAt?: Date;
    type?: 'ticketed' | 'rsvp';
    rsvpCapacity?: number;
    allowPlusOnes?: boolean;
  }): Promise<string> {
    await this.goto();

    // Select event type if specified
    if (data.type) {
      await this.selectEventType(data.type);

      // Fill RSVP settings if it's an RSVP event
      if (data.type === 'rsvp') {
        await this.fillRsvpSettings({
          capacity: data.rsvpCapacity,
          allowPlusOnes: data.allowPlusOnes,
        });
      }
    }

    // Fill basic details
    await this.fillBasicDetails({
      title: data.title,
      description: data.description,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      city: data.city,
      state: data.state,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    });

    // Submit the form
    await this.submit();

    // Wait for redirect to event edit page
    await expect(this.page).toHaveURL(/\/b\/events\/[a-zA-Z0-9]+/, { timeout: 20000 });

    // Extract event ID from URL
    const url = this.page.url();
    const match = url.match(/\/b\/events\/([a-zA-Z0-9]+)/);

    if (!match) {
      throw new Error(`Could not extract event ID from URL: ${url}`);
    }

    return match[1];
  }

  /**
   * Expect validation error to be shown
   */
  async expectValidationError(fieldName?: string) {
    if (fieldName) {
      const field = this.page.locator(`[data-field="${fieldName}"]`);
      await expect(field.locator('..').locator('.text-red-500')).toBeVisible();
    } else {
      await expect(this.page.locator('.text-red-500')).toBeVisible();
    }
  }
}
