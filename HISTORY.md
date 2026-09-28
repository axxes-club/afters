# Changelog

## 0.2.21 (2026-09-28)

- Fix guest buyers getting a 404 on their order confirmation page after checkout
  - /orders was behind Clerk auth since launch; guests now reach it via a signed token from checkout
  - Signed-in buyers can still view their own orders without a token
- Fix /demo and /developers returning 404 (the /d dashboard matcher also matched any path starting with /d)

## 0.2.20 (2026-09-27)

- Add Apple Wallet passes for tickets
  - "Add to Apple Wallet" button per ticket on the order confirmation page (hidden on Android)
  - Wallet buttons in ticket confirmation emails (paid and free orders)
  - Signed download links, so guest-checkout buyers can add passes without an account
  - Passes show event, date/doors in the event's timezone, tier, venue; QR works with the door scanner
  - Passes surface on the lock screen near the venue and expire after the event
  - Certificates load from env vars (APPLE_* in .env.example); the feature stays hidden until they are set
- Fix ticket email and PDF event times being shown in UTC instead of the event's timezone

## 0.2.19 (2026-02-22)

- Add Docker containerization support for development and production
  - Production Dockerfile with multi-stage build for optimized images
  - Development Dockerfile.dev with hot-reload support
  - docker-compose.yml with PostgreSQL, App, and optional MCP server
  - docker-compose.test.yml for E2E testing with Playwright
  - Docker convenience scripts in package.json (docker:dev, docker:build, etc.)
- Add API documentation pages (/api-docs, /developers/api-access-info)
- Fix SSR/localStorage hydration mismatch in useResizableSidebar hook
- Fix useEffect optimization in dashboard layout (only close menu when open)
- Fix Clerk auth race condition when webhook hasn't fired yet
- Add standalone output for Docker production builds in next.config.ts
- Update README with Docker quick start as recommended option

## 0.2.18 (2026-02-19)

- Add "Afters 3X Logo" option for larger sidebar branding
- Make Afters 3X Logo the default for all users
- New appearance setting to choose between standard and 3X logo sizes
- Desktop sidebar: text-4xl when 3X selected, text-2xl otherwise
- Mobile header: text-2xl when 3X selected, text-xl otherwise

## 0.2.17 (2026-02-19)

- Fix collapsed sidebar styling (logo, nav items, event thumbnails) (PR #56)
- Add keyboard accessibility to event creation form
- Tonight/Tomorrow buttons now keyboard accessible with Enter/Space
- LATE/SET TIME toggle now keyboard accessible
- RecurrenceSelector toggle and end type buttons now keyboard accessible
- LINEUP/STYLE expandable sections now keyboard accessible
- Added explicit tabIndex, onKeyDown handlers, and ARIA attributes

## 0.2.16 (2026-02-18)

- Apply organizer's UI accent color to event create/edit pages (Issue #40, PR #41)
- Add useAccentColor hook for accessing accent color from Settings > Appearance
- Dashboard layout sets --accent-color CSS variable for child components
- Primary buttons, tabs, and section cards now respect custom accent color
- Fix compact sidebar: Now shows only icons with 64px width
- Fix font size setting: Applies small/normal/large scaling to dashboard content
- Smooth transitions on sidebar width changes
- Tooltips on nav items in compact mode

## 0.2.15 (2026-02-18)

- Add optional email for event scanners (Issue #33, PR #36)
- Scanners can receive credentials via email automatically on creation
- Email includes scanner code, event details, and direct link to scanner page
- Add resend credentials button with rate limiting (max 3/hour)
- New Checkbox UI component using Radix UI
- i18n support for scanner email strings (en, es-ES, es-LA, pt-BR)

## 0.2.14 (2026-02-18)

- Add ticket/RSVP status indicators to events dashboard (Issue #37, PR #38)
- New "MY TICKETS & RSVPs" section showing events user is attending
- Display ticket tier name, RSVP status, plus-ones count
- Show check-in status and valid/pending/cancelled states
- Color-coded badges: pink for tickets, cyan for RSVPs

## 0.2.12 (2026-02-18)

- Add recurring events support (Issue #31, PR #34)
- New EventSeries model for recurring event configurations
- Support RRULE patterns: weekly, biweekly, monthly (by day or date)
- Add templateData JSON for shared defaults (venue, theme, lineup, ticket tiers)
- Series template changes propagate to unmodified future occurrences
- Add RecurrenceSelector component for event creation form
- Add SeriesBadge component showing series context on event pages
- Add SeriesList dashboard component for series management
- New API endpoints: `/api/v1/event-series` (CRUD + generate occurrences)
- Event model extended with seriesId, seriesOccurrence, isSeriesOverride fields
- Date-suffixed slug generation for series occurrences

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
