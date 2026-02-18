import { test as base, expect } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EventCreatePage } from '../pages/EventCreatePage';
import { EventEditPage } from '../pages/EventEditPage';
import { setupClerkTestSession } from '../utils/clerk-test-helpers';

// ─── Test Data Types ───

export interface TestUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  slug: string;
}

export interface TestEvent {
  title: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  startsAt: Date;
  endsAt?: Date;
}

// ─── Fixtures Type ───

type Fixtures = {
  // Page objects
  basePage: BasePage;
  onboardingPage: OnboardingPage;
  dashboardPage: DashboardPage;
  eventCreatePage: EventCreatePage;
  eventEditPage: EventEditPage;

  // Test data factories
  newTestUser: TestUser;
  onboardedTestUser: TestUser;
  testEvent: TestEvent;

  // Auth helpers
  authenticateAs: (
    user: TestUser,
    options?: { skipOnboarding?: boolean }
  ) => Promise<void>;
  seedUser: (
    user: TestUser,
    options?: { createOrganizerProfile?: boolean }
  ) => Promise<void>;
};

// ─── Extended Test ───

export const test = base.extend<Fixtures>({
  // Page Objects
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  eventCreatePage: async ({ page }, use) => {
    await use(new EventCreatePage(page));
  },

  eventEditPage: async ({ page }, use) => {
    await use(new EventEditPage(page));
  },

  // Test Data Factories
  newTestUser: async ({}, use) => {
    const uniqueId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    await use({
      userId: `user_${uniqueId}`,
      email: `${uniqueId}@test.afters.app`,
      firstName: 'Test',
      lastName: 'User',
      displayName: `Test Organizer ${uniqueId.slice(-6)}`,
      slug: `test-org-${uniqueId.slice(-8)}`,
    });
  },

  onboardedTestUser: async ({}, use) => {
    // Pre-seeded user with organizer profile (created in global-setup.ts)
    await use({
      userId: 'user_e2e_onboarded',
      email: 'e2e-onboarded@test.afters.app',
      firstName: 'E2E',
      lastName: 'Tester',
      displayName: 'E2E Test Organizer',
      slug: 'e2e-test-organizer',
    });
  },

  testEvent: async ({}, use) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(22, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(4, 0, 0, 0);
    dayAfter.setDate(dayAfter.getDate() + 1);

    await use({
      title: `E2E Test Event ${Date.now()}`,
      venueName: 'Test Venue',
      venueAddress: '123 Test Street',
      city: 'New York',
      state: 'NY',
      startsAt: tomorrow,
      endsAt: dayAfter,
    });
  },

  // Auth Helper: Seed user directly via API
  seedUser: async ({ request }, use) => {
    const seed = async (
      user: TestUser,
      options?: { createOrganizerProfile?: boolean }
    ) => {
      const bypassToken = process.env.E2E_AUTH_BYPASS_TOKEN;

      if (!bypassToken) {
        throw new Error('E2E_AUTH_BYPASS_TOKEN not set');
      }

      const response = await request.post('/api/e2e/seed-user', {
        headers: {
          'X-E2E-Bypass-Token': bypassToken,
          'Content-Type': 'application/json',
        },
        data: {
          userId: user.userId,
          email: user.email,
          displayName: user.displayName,
          slug: user.slug,
          firstName: user.firstName,
          lastName: user.lastName,
          createOrganizerProfile: options?.createOrganizerProfile ?? true,
        },
      });

      if (!response.ok()) {
        const errorText = await response.text();
        throw new Error(`Failed to seed user: ${response.status()} - ${errorText}`);
      }
    };

    await use(seed);
  },

  // Auth Helper: Authenticate and optionally seed
  authenticateAs: async ({ page, request }, use) => {
    const authenticate = async (
      user: TestUser,
      options?: { skipOnboarding?: boolean }
    ) => {
      // Set up Clerk test session
      await setupClerkTestSession(page, {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // If skipping onboarding, seed the user with a profile
      if (options?.skipOnboarding) {
        const bypassToken = process.env.E2E_AUTH_BYPASS_TOKEN;

        if (!bypassToken) {
          console.warn('E2E_AUTH_BYPASS_TOKEN not set - skipping user seed');
          return;
        }

        const response = await request.post('/api/e2e/seed-user', {
          headers: {
            'X-E2E-Bypass-Token': bypassToken,
            'Content-Type': 'application/json',
          },
          data: {
            userId: user.userId,
            email: user.email,
            displayName: user.displayName,
            slug: user.slug,
            firstName: user.firstName,
            lastName: user.lastName,
            createOrganizerProfile: true,
          },
        });

        if (!response.ok()) {
          const errorText = await response.text();
          console.warn(`Failed to seed user: ${response.status()} - ${errorText}`);
        }
      }
    };

    await use(authenticate);
  },
});

export { expect };
