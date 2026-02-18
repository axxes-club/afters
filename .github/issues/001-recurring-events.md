# Feature: Recurring Events Support

## Summary

Add the ability for organizers to create **recurring events** — events that repeat on a schedule (weekly, biweekly, monthly, or custom) — from a single configuration. Currently every event in Afters is standalone; organizers who host regular nights must manually recreate events each time, duplicating titles, venues, lineups, themes, and ticket tiers.

## Motivation

Many underground music promoters run weekly or monthly residencies (e.g. "Techno Tuesdays every week" or "First Friday" series). Today they must:

1. Create a brand-new event each time
2. Re-enter all venue details, theme settings, ticket tiers, etc.
3. Manage each occurrence independently with no linkage

This is tedious and error-prone. A recurring events feature would dramatically reduce organizer friction and unlock series-based discovery for attendees.

## Current State

- The `Event` model (`prisma/schema.prisma`) has **no recurrence fields** — no pattern, parent/child links, or series identifiers.
- Event creation (`src/app/(dashboard)/d/events/new/page.tsx`) captures a single `startsAt` / `endsAt` pair with no repeat options.
- The API (`src/app/api/v1/events/route.ts`) creates one event per request.
- There is no concept of event series or templates anywhere in the codebase.

## Proposed Design

### Data Model Changes (Prisma)

Add a new `EventSeries` model and link it to `Event`:

```prisma
model EventSeries {
  id              String            @id @default(cuid())
  organizerId     String
  title           String            // Series name, e.g. "Techno Tuesdays"
  recurrenceRule  String            // RRULE string (RFC 5545), e.g. "FREQ=WEEKLY;BYDAY=TU"
  timezone        String            @default("America/New_York")
  templateData    Json?             // Shared defaults: venue, theme, lineup, ticket tiers, etc.
  startsAt        DateTime          // When the series begins
  endsAt          DateTime?         // Optional: when the series ends (null = indefinite)
  maxOccurrences  Int?              // Optional: max number of occurrences
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  organizer       OrganizerProfile  @relation(fields: [organizerId], references: [id])
  events          Event[]

  @@index([organizerId])
}
```

Add to `Event`:

```prisma
seriesId          String?
seriesOccurrence  Int?              // Which occurrence in the series (1, 2, 3...)
isSeriesOverride  Boolean           @default(false) // True if this occurrence was customized
series            EventSeries?      @relation(fields: [seriesId], references: [id])
```

### Recurrence Rule

Use [RFC 5545 RRULE](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10) format to define patterns. Use the [`rrule`](https://www.npmjs.com/package/rrule) npm package to parse/generate occurrences.

Supported patterns (at minimum):

| Pattern | RRULE Example | Description |
|---------|--------------|-------------|
| Weekly | `FREQ=WEEKLY;BYDAY=TU` | Same day every week |
| Biweekly | `FREQ=WEEKLY;INTERVAL=2;BYDAY=SA` | Every two weeks |
| Monthly (by day) | `FREQ=MONTHLY;BYDAY=1SA` | First Saturday of every month |
| Monthly (by date) | `FREQ=MONTHLY;BYMONTHDAY=15` | 15th of every month |
| Custom | N/A — use manual date picker | Specific dates picked manually |

### UI / UX

#### 1. Creation Form Enhancement

Add a "Repeat" section after the date/time picker in `src/app/(dashboard)/d/events/new/page.tsx`:

- **Repeat toggle**: None (default) / Weekly / Biweekly / Monthly / Custom
- When enabled, show:
  - Day-of-week selector (for weekly/biweekly)
  - "Which week" selector (for monthly: 1st, 2nd, 3rd, 4th, last)
  - End condition: "After N occurrences" or "Until date" or "No end date"
- Preview summary: e.g. _"Every Tuesday, 8 occurrences starting Feb 24"_

#### 2. Occurrence Generation

- On save, auto-generate the next N occurrences (e.g. 4–8 weeks ahead) as individual `Event` records linked to the series
- Each occurrence inherits all template data (venue, theme, lineup, ticket tiers, RSVP settings)
- Slug generation appends date: e.g. `techno-tuesdays-2026-02-24`, `techno-tuesdays-2026-03-03`

#### 3. Series Management Dashboard

New section in the event dashboard for series management:

- List all occurrences in a series with their status (upcoming, published, completed, cancelled)
- **Edit series template**: Changes propagate to all future occurrences that haven't been individually customized
- **Edit single occurrence**: Marks it as `isSeriesOverride = true`, detaching it from template updates
- **Cancel single occurrence**: Cancel one date without affecting the rest
- **Cancel entire series**: Cancel all future occurrences
- **Extend series**: Generate additional future occurrences

#### 4. Public Event Page

- Show "Part of _[Series Name]_" badge on the event page
- Link to upcoming occurrences in the series
- "Subscribe to series" — notify when new dates are announced

### Generation Strategy

- **Lazy/rolling generation**: A cron job or on-demand trigger creates future occurrences on a rolling basis (always keep at least 4 weeks of future events published)
- Each generated occurrence is a full `Event` record with its own tickets, check-in, analytics, scanners
- Template changes propagate only to occurrences where `isSeriesOverride = false`
- Generation must be **idempotent** — safe to re-run without creating duplicates

### API Changes

#### New Endpoints

- `POST /api/v1/event-series` — Create a new series with recurrence rule
- `GET /api/v1/event-series/:id` — Get series info and list occurrences
- `PATCH /api/v1/event-series/:id` — Update series template (propagates to future events)
- `DELETE /api/v1/event-series/:id` — Cancel series (all future occurrences)
- `POST /api/v1/event-series/:id/generate` — Manually trigger occurrence generation

#### Modified Endpoints

- `GET /api/v1/events` — Add `seriesId` filter parameter
- `GET /api/v1/events/:id` — Include series info in response when applicable

## Acceptance Criteria

- [ ] Organizers can create a recurring event with weekly, biweekly, or monthly frequency
- [ ] Future occurrences are auto-generated as linked `Event` records
- [ ] Series template changes propagate to unmodified future occurrences
- [ ] Individual occurrences can be customized or cancelled independently
- [ ] Customized occurrences are not overwritten by template updates
- [ ] Public event pages show series context and link to other occurrences
- [ ] Existing standalone events are unaffected (fully backwards compatible)
- [ ] Slug generation handles series with date suffixes
- [ ] Scanner codes, ticket tiers, and RSVP settings carry over to generated occurrences
- [ ] Dashboard shows series management with all occurrences listed
- [ ] Cron/generation job is idempotent and timezone-aware

## Technical Notes

- RRULE parsing: use [`rrule`](https://www.npmjs.com/package/rrule) npm package
- Timezone handling is critical — recurrence must respect the event's timezone (stored in `Event.timezone`), not UTC. A "weekly Tuesday 9 PM" event must always be Tuesday 9 PM local time, even across DST transitions.
- `templateData` JSON should mirror the Event creation payload structure for easy spreading
- Consider adding a `lastGeneratedAt` field to `EventSeries` to track generation state
- Index `seriesId` on Event for efficient series queries

## Labels

`feature`, `events`, `high-priority`
