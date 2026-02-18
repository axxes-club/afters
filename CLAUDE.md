# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm dev:lan          # Start with LAN access (--hostname 0.0.0.0)
pnpm build            # Build for production (runs prisma generate first)
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run vitest once
pnpm test:watch       # Run vitest in watch mode
pnpm test:ui          # Run vitest with UI
pnpm test:coverage    # Run with coverage

# Database
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
npx prisma studio     # Open Prisma Studio
```

## Architecture

**Afters** is a Next.js 16 event ticketing platform for underground music events. Uses App Router with route groups for organization.

### Route Groups
- `(public)` - Public pages: `/e/[slug]` (event pages), `/scan/[eventId]` (check-in scanner), `/beta`, `/events`
- `(dashboard)` - Authenticated dashboard at `/d/*`: events management, settings, analytics
- `(onboarding)` - User onboarding flow

### Key Paths
- `/e/[slug]` - Public event page with ticket purchase/RSVP
- `/d/events/[eventId]` - Event management (edit, check-in, analytics)
- `/scan/[eventId]` - QR code scanner for door check-in
- `/api/v1/*` - Public API endpoints (API key auth via `X-API-Key` header)

### Core Libraries
- **Prisma + Neon** - PostgreSQL database (`src/lib/prisma.ts`)
- **Clerk** - Authentication (`src/lib/auth-utils.ts`)
- **Stripe** - Payments and Connect for organizers (`src/lib/stripe.ts`, `src/lib/subscription.ts`)
- **UploadThing** - File uploads (`src/lib/uploadthing.ts`)
- **next-intl** - i18n with locales: en, es-ES, es-LA, pt-BR (messages in `/messages/*.json`)
- **Resend** - Transactional emails (`src/lib/email.ts`)

### User Roles & Profiles
Users have a `role` (USER, ORGANIZER, ARTIST, PERSONAL, SUPERADMIN) and corresponding profile models:
- `OrganizerProfile` - Event organizers with Stripe Connect
- `ArtistProfile` - DJs/producers
- `PersonalProfile` - Regular users

### Event System
Events support two modes:
- **Ticketed** - Paid tickets with tiers, Stripe checkout
- **RSVP** - Free events with capacity limits

Features: hidden addresses until purchase, lineup management, custom themes, guestlist, QR scanner check-in.

### Scanner Authentication
Events have `EventScanner` records with codes. Scanner auth uses JWT tokens (`src/lib/scanner-auth.ts`) - separate from Clerk user auth.

### Testing
Vitest with happy-dom. Test setup mocks Next.js navigation, Clerk, next-intl, and Prisma (`tests/setup.ts`). Run individual tests with:
```bash
pnpm test src/path/to/file.test.ts
```

## Path Alias
`@/*` maps to `./src/*`
