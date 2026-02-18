# Feature: Rename Events and Update Their Dates

## Summary

Allow organizers to **rename events** (update the title) and **change event dates** (start/end times) after creation. Currently, updating an event's title should also update its URL slug, and changing dates requires careful handling of existing tickets, RSVPs, and scanner configurations.

## Motivation

Organizers frequently need to:

1. **Rename events** — Fix typos, rebrand an event, or update the name as details solidify (e.g. "TBD Party" → "Neon Nights Vol. 3")
2. **Change dates** — Reschedule due to venue conflicts, weather, artist cancellations, or other logistics

Currently, renaming an event may leave the URL slug out of sync with the title, and date changes need to properly notify affected attendees.

## Current State

### Title / Slug

- Events are created via `src/app/api/v1/events/route.ts` which generates a slug from the title using `generateUniqueSlug()` at creation time
- The slug is stored in the `Event.slug` field and is unique per organizer (`@@unique([organizerId, slug])`)
- Public event URLs use the slug: `/e/[slug]`
- **The slug is not updated when the title changes** — once created, the slug is static
- Event editing happens in `src/app/(dashboard)/d/events/[eventId]/page.tsx` and the update API at `src/app/api/events/[eventId]/route.ts`

### Dates

- `Event.startsAt` (required DateTime) and `Event.endsAt` (optional DateTime) store the event times
- `Event.timezone` stores the timezone (default: "America/New_York")
- The creation form validates: start date must be in the future, end date must be after start
- Date changes after ticket purchases or RSVPs have no special handling currently

## Proposed Changes

### 1. Title Rename with Slug Update

#### Slug Update Strategy

When an organizer renames an event:

1. **Generate a new slug** from the updated title using the existing `generateUniqueSlug()` logic
2. **Create a slug redirect** — Store the old slug so existing links still work
3. **Update the canonical slug** on the Event record

#### Data Model Changes

Add a slug history/redirect model:

```prisma
model EventSlugRedirect {
  id        String   @id @default(cuid())
  eventId   String
  oldSlug   String
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([eventId, oldSlug])
  @@index([oldSlug])
}
```

Add to `Event`:

```prisma
slugRedirects  EventSlugRedirect[]
```

#### Slug Resolution Changes

Update the public event page route (`src/app/(public)/e/[slug]/page.tsx`) to:

1. First try to find event by current slug
2. If not found, check `EventSlugRedirect` for the slug
3. If found in redirects, issue a 301 redirect to the current slug URL
4. If not found anywhere, return 404

#### UI Changes

- In the event edit form, when the title changes, show a preview of the new slug
- Add a confirmation dialog: _"Changing the title will update the event URL. Old links will automatically redirect. Continue?"_
- Optionally allow organizers to manually edit the slug (with validation for uniqueness)

### 2. Date Updates

#### Pre-Change Validation

Before allowing a date change, check and warn about:

- **Existing ticket purchases** — How many tickets have been sold
- **Existing RSVPs** — How many people have RSVP'd
- **Scanner configurations** — Active scanners and shifts
- **Published status** — Whether the event is already published and publicly visible

#### Date Change Flow

1. Organizer edits `startsAt` and/or `endsAt` in the event edit form
2. System validates:
   - New start date can be in the past only if event status is COMPLETED
   - End date must be after start date (if provided)
   - Timezone consistency
3. If the event has existing attendees (ticket holders or RSVPs), show a confirmation:
   _"This event has N ticket holders and M RSVPs. Changing the date will trigger notifications. Continue?"_
4. On confirmation, update the dates and trigger notifications

#### Attendee Notifications

When dates change on a published event with attendees:

- **Email notification** via Resend (`src/lib/email.ts`) to all ticket holders and RSVP'd users:
  - Subject: _"[Event Name] has been rescheduled"_
  - Body: Old date/time → New date/time, venue info, link to event page
- **Optional**: Allow organizers to include a custom message with the notification
- **Refund window**: For ticketed events, consider opening a refund request window (e.g. 48 hours) after a reschedule

#### Event Page Updates

- If an event was rescheduled, show a banner on the public event page: _"This event has been rescheduled from [old date] to [new date]"_
- Store the previous date for display purposes:

```prisma
// Add to Event model
previousStartsAt  DateTime?   // Set when date is changed, for "rescheduled" banner
previousEndsAt    DateTime?
rescheduledAt     DateTime?   // When the reschedule happened
```

### 3. Audit Trail

Track all title and date changes for organizer reference:

```prisma
model EventChangeLog {
  id        String   @id @default(cuid())
  eventId   String
  field     String   // "title", "startsAt", "endsAt", "slug"
  oldValue  String
  newValue  String
  changedBy String   // User ID
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
  @@index([createdAt])
}
```

## Acceptance Criteria

### Title / Rename

- [ ] Organizers can rename an event from the edit page
- [ ] Slug is automatically regenerated from the new title
- [ ] Old slugs redirect (301) to the new slug URL
- [ ] Existing shared links and bookmarks continue to work
- [ ] Slug uniqueness is enforced per organizer
- [ ] Optional: Organizers can manually customize the slug

### Date Updates

- [ ] Organizers can change `startsAt` and `endsAt` from the edit page
- [ ] Validation ensures dates are logically consistent
- [ ] Confirmation dialog shown when attendees exist
- [ ] Email notifications sent to ticket holders and RSVP'd users on date change
- [ ] Public event page shows "rescheduled" banner when applicable
- [ ] Scanner shifts and configurations are preserved (but organizers are warned)

### General

- [ ] All changes are logged in `EventChangeLog`
- [ ] API endpoints (`PATCH /api/events/:id`) handle both title and date updates
- [ ] Backwards compatible — no breaking changes to existing events
- [ ] i18n: All new user-facing strings added to message files (en, es-ES, es-LA, pt-BR)

## Technical Notes

- Slug redirect lookup should be indexed and cached for performance
- Email notifications should be queued (not blocking the API response) — consider using a background job or Resend's batch API
- The "rescheduled" banner should auto-hide after the event passes
- Consider rate-limiting date changes to prevent notification spam (e.g. max 3 reschedules per event)
- The `expiresAfter` field logic may need adjustment if dates change significantly

## Labels

`feature`, `events`, `medium-priority`
