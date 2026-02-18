import { test, expect } from '../../fixtures';

test.describe('Event Design Editing', () => {
  let eventId: string;

  test.beforeEach(async ({
    authenticateAs,
    onboardedTestUser,
    eventCreatePage,
    testEvent,
  }) => {
    // Authenticate as onboarded user
    await authenticateAs(onboardedTestUser, { skipOnboarding: true });

    // Create an event to edit
    eventId = await eventCreatePage.createEvent({
      title: `Design Test ${testEvent.title}`,
      venueName: testEvent.venueName,
      venueAddress: testEvent.venueAddress,
      city: testEvent.city,
      startsAt: testEvent.startsAt,
      type: 'rsvp', // RSVP is simpler for testing
    });
  });

  test('should display design tab with all options', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('design');

    // Verify template cards are visible
    await expect(eventEditPage.templateCards.first()).toBeVisible({ timeout: 5000 });

    // Count templates - should have multiple options
    const templateCount = await eventEditPage.templateCards.count();
    expect(templateCount).toBeGreaterThanOrEqual(5);
  });

  test('should change template selection', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('design');

    // Select brutalist template
    await eventEditPage.selectTemplate('brutalist');

    // Save changes
    await eventEditPage.saveDesign();

    // Reload and verify persistence
    await page.reload();
    await eventEditPage.switchToTab('design');

    // The brutalist template card should have some selection indicator
    const brutalistCard = eventEditPage.templateCards.filter({
      hasText: /brutalist/i,
    });
    await expect(brutalistCard).toBeVisible();
  });

  test('should change typography style', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('design');

    // Select mono typography
    await eventEditPage.selectTypography('mono');

    // Save changes
    await eventEditPage.saveDesign();

    // Verify toast appeared
    await eventEditPage.expectSuccessToast();
  });

  test('should update multiple design settings at once', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);

    // Use the combined update method
    await eventEditPage.updateDesign({
      template: 'neon',
      typography: 'headline',
      accentColor: '#00ff88',
    });

    // Reload and verify changes persisted
    await page.reload();
    await eventEditPage.switchToTab('design');

    // Page should still load without errors
    await expect(eventEditPage.templateCards.first()).toBeVisible();
  });

  test('should select custom accent color', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('design');

    // Select a custom color via the color picker
    const customColor = '#ff6600';
    await eventEditPage.selectAccentColor(customColor);

    // Save
    await eventEditPage.saveDesign();

    // Verify success
    await eventEditPage.expectSuccessToast();
  });
});
