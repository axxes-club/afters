import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for event editing (/d/events/[eventId])
 *
 * This page has multiple tabs: Overview, Tickets, Door, Design, Details, Venue, Settings
 */
export class EventEditPage extends BasePage {
  // Tab navigation
  readonly overviewTab: Locator;
  readonly ticketsTab: Locator;
  readonly doorTab: Locator;
  readonly designTab: Locator;
  readonly detailsTab: Locator;
  readonly venueTab: Locator;
  readonly settingsTab: Locator;

  // Event header
  readonly eventTitle: Locator;
  readonly eventStatus: Locator;

  // Design tab elements
  readonly templateCards: Locator;
  readonly typographyButtons: Locator;
  readonly accentColorButtons: Locator;
  readonly customColorPicker: Locator;
  readonly saveDesignButton: Locator;

  // Details tab elements
  readonly aboutSection: Locator;
  readonly aboutTextarea: Locator;
  readonly lineupSection: Locator;
  readonly addArtistButton: Locator;
  readonly faqsSection: Locator;
  readonly addFaqButton: Locator;
  readonly gallerySection: Locator;
  readonly saveDetailsButton: Locator;

  constructor(page: Page) {
    super(page);

    // Tab navigation
    this.overviewTab = page.getByRole('tab', { name: /overview/i });
    this.ticketsTab = page.getByRole('tab', { name: /tickets/i });
    this.doorTab = page.getByRole('tab', { name: /door/i });
    this.designTab = page.getByRole('tab', { name: /design/i });
    this.detailsTab = page.getByRole('tab', { name: /details/i });
    this.venueTab = page.getByRole('tab', { name: /venue/i });
    this.settingsTab = page.getByRole('tab', { name: /settings/i });

    // Event header
    this.eventTitle = page.locator('h1').first();
    this.eventStatus = page.locator('[data-testid="event-status"]');

    // Design tab elements
    this.templateCards = page.locator('[data-template-card]');
    this.typographyButtons = page.locator('button').filter({
      hasText: /^(MONO|HEADLINE|ELEGANT|MODERN)$/i,
    });
    this.accentColorButtons = page.locator('button').filter({
      has: page.locator('.w-10.h-10, .w-8.h-8'),
    });
    this.customColorPicker = page.locator('input[type="color"]');
    this.saveDesignButton = page.getByRole('button', { name: /save/i }).first();

    // Details tab elements
    this.aboutSection = page.locator('button:has-text("ABOUT")');
    this.aboutTextarea = page.locator('textarea').first();
    this.lineupSection = page.locator('button:has-text("LINEUP")');
    this.addArtistButton = page.getByRole('button', { name: /add artist/i });
    this.faqsSection = page.locator('button:has-text("FAQ")');
    this.addFaqButton = page.getByRole('button', { name: /add faq/i });
    this.gallerySection = page.locator('button:has-text("GALLERY")');
    this.saveDetailsButton = page.getByRole('button', { name: /save/i }).first();
  }

  /**
   * Navigate to a specific event
   */
  async goto(eventId: string) {
    await this.navigateTo(`/d/events/${eventId}`);
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(
    tab: 'overview' | 'tickets' | 'door' | 'design' | 'details' | 'venue' | 'settings'
  ) {
    const tabMap = {
      overview: this.overviewTab,
      tickets: this.ticketsTab,
      door: this.doorTab,
      design: this.designTab,
      details: this.detailsTab,
      venue: this.venueTab,
      settings: this.settingsTab,
    };

    await tabMap[tab].click();
    await this.page.waitForTimeout(300); // Wait for tab transition
  }

  // ─── Design Tab Methods ───

  /**
   * Select a template by name
   */
  async selectTemplate(templateName: string) {
    const template = this.templateCards.filter({
      hasText: new RegExp(templateName, 'i'),
    });
    await template.click();
  }

  /**
   * Select typography style
   */
  async selectTypography(style: 'mono' | 'headline' | 'elegant' | 'modern') {
    const button = this.page.getByRole('button', {
      name: new RegExp(`^${style}$`, 'i'),
    });
    await button.click();
  }

  /**
   * Select an accent color
   */
  async selectAccentColor(colorHex: string) {
    // Try preset colors first
    const colorButton = this.page.locator(
      `button[style*="background-color: ${colorHex}"]`
    );

    if (await colorButton.isVisible()) {
      await colorButton.click();
    } else {
      // Use custom color picker
      await this.customColorPicker.fill(colorHex);
    }
  }

  /**
   * Save design changes
   */
  async saveDesign() {
    await this.saveDesignButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Update all design settings at once
   */
  async updateDesign(options: {
    template?: string;
    typography?: 'mono' | 'headline' | 'elegant' | 'modern';
    accentColor?: string;
  }) {
    await this.switchToTab('design');

    if (options.template) {
      await this.selectTemplate(options.template);
    }

    if (options.typography) {
      await this.selectTypography(options.typography);
    }

    if (options.accentColor) {
      await this.selectAccentColor(options.accentColor);
    }

    await this.saveDesign();
  }

  // ─── Details Tab Methods ───

  /**
   * Expand a collapsible section
   */
  async expandSection(section: 'about' | 'lineup' | 'faqs' | 'gallery') {
    const sectionMap = {
      about: this.aboutSection,
      lineup: this.lineupSection,
      faqs: this.faqsSection,
      gallery: this.gallerySection,
    };

    await sectionMap[section].click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Set the about section text
   */
  async setAbout(text: string) {
    await this.expandSection('about');
    await this.aboutTextarea.fill(text);
  }

  /**
   * Add an artist to the lineup
   */
  async addArtist(name: string, role: string) {
    await this.expandSection('lineup');
    await this.addArtistButton.click();

    // Fill the last artist entry
    const artistInputs = this.page.locator('input[placeholder*="Artist"], input[placeholder*="Name"]');
    const roleInputs = this.page.locator('input[placeholder*="Role"]');

    await artistInputs.last().fill(name);
    await roleInputs.last().fill(role);
  }

  /**
   * Add a FAQ entry
   */
  async addFaq(question: string, answer: string) {
    await this.expandSection('faqs');
    await this.addFaqButton.click();

    // Fill the last FAQ entry
    const questionInputs = this.page.locator('input[placeholder*="Question"]');
    const answerInputs = this.page.locator('textarea[placeholder*="Answer"]');

    await questionInputs.last().fill(question);
    await answerInputs.last().fill(answer);
  }

  /**
   * Save details changes
   */
  async saveDetails() {
    await this.saveDetailsButton.click();
    await this.expectSuccessToast();
  }

  /**
   * Update all details at once
   */
  async updateDetails(options: {
    about?: string;
    lineup?: Array<{ name: string; role: string }>;
    faqs?: Array<{ question: string; answer: string }>;
  }) {
    await this.switchToTab('details');

    if (options.about) {
      await this.setAbout(options.about);
    }

    if (options.lineup) {
      for (const artist of options.lineup) {
        await this.addArtist(artist.name, artist.role);
      }
    }

    if (options.faqs) {
      for (const faq of options.faqs) {
        await this.addFaq(faq.question, faq.answer);
      }
    }

    await this.saveDetails();
  }

  // ─── Verification Methods ───

  /**
   * Verify the page shows the correct event title
   */
  async expectEventTitle(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  /**
   * Verify a template is selected
   */
  async expectTemplateSelected(templateName: string) {
    const template = this.templateCards.filter({
      hasText: new RegExp(templateName, 'i'),
    });
    // Selected templates typically have a border or different style
    await expect(template.locator('[class*="border"], [class*="ring"]')).toBeVisible();
  }
}
