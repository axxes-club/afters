import { test, expect } from '../../fixtures';

test.describe('Event Details Editing', () => {
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
      title: `Details Test ${testEvent.title}`,
      venueName: testEvent.venueName,
      venueAddress: testEvent.venueAddress,
      city: testEvent.city,
      startsAt: testEvent.startsAt,
      type: 'rsvp',
    });
  });

  test('should display details tab with all sections', async ({
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    // Verify sections are visible
    await expect(eventEditPage.aboutSection).toBeVisible({ timeout: 5000 });
    await expect(eventEditPage.lineupSection).toBeVisible();
    await expect(eventEditPage.faqsSection).toBeVisible();
    await expect(eventEditPage.gallerySection).toBeVisible();
  });

  test('should add and save about section text', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    const aboutText =
      'This is an amazing underground techno event. Join us for a night of pounding beats and unforgettable vibes. Featuring top DJs from around the world.';

    await eventEditPage.setAbout(aboutText);
    await eventEditPage.saveDetails();

    // Reload and verify persistence
    await page.reload();
    await eventEditPage.switchToTab('details');
    await eventEditPage.expandSection('about');

    // The textarea should contain our text
    await expect(eventEditPage.aboutTextarea).toHaveValue(aboutText);
  });

  test('should add artist to lineup', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    await eventEditPage.addArtist('DJ Test One', 'Headliner');
    await eventEditPage.saveDetails();

    // Reload and verify
    await page.reload();
    await eventEditPage.switchToTab('details');
    await eventEditPage.expandSection('lineup');

    // Should see the artist name somewhere
    await expect(page.getByText('DJ Test One')).toBeVisible();
  });

  test('should add multiple artists to lineup', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    // Add multiple artists
    await eventEditPage.addArtist('Artist Alpha', 'Headliner');
    await eventEditPage.addArtist('Artist Beta', 'Support');
    await eventEditPage.addArtist('Artist Gamma', 'Opening');

    await eventEditPage.saveDetails();

    // Reload and verify
    await page.reload();
    await eventEditPage.switchToTab('details');
    await eventEditPage.expandSection('lineup');

    // All artists should be visible
    await expect(page.getByText('Artist Alpha')).toBeVisible();
    await expect(page.getByText('Artist Beta')).toBeVisible();
    await expect(page.getByText('Artist Gamma')).toBeVisible();
  });

  test('should add FAQ entry', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    await eventEditPage.addFaq(
      'What time do doors open?',
      'Doors open at 10pm, music starts at 11pm sharp.'
    );
    await eventEditPage.saveDetails();

    // Reload and verify
    await page.reload();
    await eventEditPage.switchToTab('details');
    await eventEditPage.expandSection('faqs');

    await expect(page.getByText('What time do doors open?')).toBeVisible();
  });

  test('should add multiple FAQs', async ({
    page,
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);
    await eventEditPage.switchToTab('details');

    await eventEditPage.addFaq(
      'Is there parking?',
      'Street parking is available. We recommend rideshare.'
    );
    await eventEditPage.addFaq(
      'Can I bring a camera?',
      'Professional cameras are not allowed. Phone photography is fine.'
    );

    await eventEditPage.saveDetails();

    // Reload and verify
    await page.reload();
    await eventEditPage.switchToTab('details');
    await eventEditPage.expandSection('faqs');

    await expect(page.getByText('Is there parking?')).toBeVisible();
    await expect(page.getByText('Can I bring a camera?')).toBeVisible();
  });

  test('should update all details at once', async ({
    eventEditPage,
  }) => {
    await eventEditPage.goto(eventId);

    await eventEditPage.updateDetails({
      about: 'Complete event description with all the details attendees need to know.',
      lineup: [
        { name: 'Main Act', role: 'Headliner' },
        { name: 'Support Act', role: 'Support' },
      ],
      faqs: [
        { question: 'Age requirement?', answer: '21+ with valid ID' },
      ],
    });

    // Verify success toast
    await eventEditPage.expectSuccessToast();
  });
});
