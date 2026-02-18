import { test, expect } from '../../fixtures';

test.describe('Event Creation', () => {
  test.beforeEach(async ({ authenticateAs, onboardedTestUser }) => {
    // Use pre-onboarded user for event tests
    await authenticateAs(onboardedTestUser, { skipOnboarding: true });
  });

  test('should create a ticketed event with required fields', async ({
    page,
    eventCreatePage,
    testEvent,
  }) => {
    const eventId = await eventCreatePage.createEvent({
      title: testEvent.title,
      venueName: testEvent.venueName,
      venueAddress: testEvent.venueAddress,
      city: testEvent.city,
      state: testEvent.state,
      startsAt: testEvent.startsAt,
      type: 'ticketed',
    });

    // Verify we're on the event edit page
    expect(eventId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/d/events/${eventId}`));

    // Verify event title is shown somewhere on the page
    await expect(page.getByText(testEvent.title)).toBeVisible({ timeout: 10000 });
  });

  test('should create an RSVP event', async ({
    page,
    eventCreatePage,
    testEvent,
  }) => {
    const rsvpTitle = `RSVP ${testEvent.title}`;

    const eventId = await eventCreatePage.createEvent({
      title: rsvpTitle,
      venueName: testEvent.venueName,
      venueAddress: testEvent.venueAddress,
      city: testEvent.city,
      state: testEvent.state,
      startsAt: testEvent.startsAt,
      type: 'rsvp',
      rsvpCapacity: 100,
    });

    expect(eventId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/d/events/${eventId}`));
  });

  test('should create an RSVP event with plus ones enabled', async ({
    page,
    eventCreatePage,
    testEvent,
  }) => {
    const eventId = await eventCreatePage.createEvent({
      title: `Plus Ones ${testEvent.title}`,
      venueName: testEvent.venueName,
      venueAddress: testEvent.venueAddress,
      city: testEvent.city,
      state: testEvent.state,
      startsAt: testEvent.startsAt,
      type: 'rsvp',
      rsvpCapacity: 50,
      allowPlusOnes: true,
    });

    expect(eventId).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/d/events/${eventId}`));
  });

  test('should show create event form with all sections', async ({
    eventCreatePage,
  }) => {
    await eventCreatePage.goto();

    // Verify main form sections are visible
    await expect(eventCreatePage.titleInput).toBeVisible();
    await expect(eventCreatePage.venueNameInput).toBeVisible();
    await expect(eventCreatePage.startsAtInput).toBeVisible();

    // Verify event type toggles
    await expect(eventCreatePage.ticketedButton).toBeVisible();
    await expect(eventCreatePage.rsvpButton).toBeVisible();

    // Verify create button
    await expect(eventCreatePage.createEventButton).toBeVisible();
  });

  test('should toggle between ticketed and RSVP modes', async ({
    eventCreatePage,
    page,
  }) => {
    await eventCreatePage.goto();

    // Default should be ticketed
    await expect(eventCreatePage.ticketedButton).toBeVisible();

    // Switch to RSVP
    await eventCreatePage.selectEventType('rsvp');

    // RSVP capacity input should appear
    await expect(eventCreatePage.rsvpCapacityInput).toBeVisible({ timeout: 3000 });

    // Switch back to ticketed
    await eventCreatePage.selectEventType('ticketed');

    // RSVP capacity should be hidden
    await expect(eventCreatePage.rsvpCapacityInput).toBeHidden({ timeout: 3000 });
  });
});
