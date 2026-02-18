# Changelog

## 0.2.11 (2026-02-18)

- Redesign Aftie AI settings page with hero activation section
- Add color-coded capability cards in 2-column grid
- Add example prompts section showing Aftie's capabilities
- Better active state with stats grid and online indicator

## 0.2.10 (2026-02-18)

- Fix push notification UX - show enable CTA immediately instead of loading
- Improve push hook to not block on service worker ready
- Better error handling for push permission states

## 0.2.9 (2026-02-18)

- Redesign notifications settings page with card-based layout
- Add color-coded notification types (green/blue/amber/purple)
- Fix "Push Not Available" showing incorrectly while loading
- Integrate push + email notifications with ticket sales
- Integrate push + email notifications with free RSVPs
- Add event reminder cron endpoint (1h and 24h reminders)
- Add organizer sale email template
- Add event reminder email template

## 0.2.8 (2026-02-18)

- Implement full notification settings with database persistence
- Add browser push notifications with VAPID keys
- Add email notification preferences (ticket sales, reminders, check-ins, updates)
- Add push notification preferences per notification type
- Add service worker for receiving push events
- Add usePushNotifications hook for client-side subscription management
- Add push utility library for server-side notifications
- Add API tests for notifications endpoints (104 tests total)

## 0.2.7 (2026-02-18)

- Add UI customization: custom logos, accent colors, text sizes
- Add Settings > Appearance page for dashboard personalization
- Move profile editing from /d/organizer to Settings > Profile
- Fix scanner sidebar to match dashboard design with mobile toolbar
- Add clickable Share/AirDrop button to scanner desktop view
- Remove glowing effect from Aftie button, hide when AI disabled
- Add API tests for user profile and preferences endpoints (85 tests total)

## 0.2.6 (2026-02-18)

- Fix React hydration errors with suppressHydrationWarning
- Move API keys to Security settings page
- Add API testing workflow to CI (68 tests, 84% coverage)

## 0.2.5 (2026-02-18)

- Fix ESLint errors, reduce warnings to 0
- Add Aftie production guard
- Improve accessibility (a11y) across components

## 0.2.4 (2026-02-18)

- Fix system settings page showing incorrect version by reading from package.json
- Fix E2E workflow to skip gracefully when secrets not configured

## 0.2.3 (2026-02-18)

- Add E2E testing infrastructure with Playwright
- Add System settings page with build info and changelog
- Remove Resources section from System settings
- Remove follower functionality and simplify profiles

## 0.2.2-beta (2026-02-18)

- Add superadmin feedback management system with status updates
- Expand Aftie AI updateEvent tool with full event fields (timing, location, design, lineup, FAQs)
- Add generateFlyer placeholder tool for future AI flyer generation
- Add Aftie image provider settings to OrganizerProfile schema
- Add Replicate image domains for AI-generated content
- Remove billing from settings nav (not yet implemented)

## 0.2.1-beta

- Fix AI SDK v6 tool definitions
- Redesign settings pages with bold aesthetics
- Fix Aftie visibility settings
- Rename dashboard to BASE, update logo and Aftie key naming
- Transform main sidebar when in settings section
