# Event Page Template Generator Skill

This skill generates new event page templates for the AFTERS platform. It creates all required components: the template definition, preview card, live editor entry, and full page implementation.

**To install**: Copy this file to `.claude/skills/event-template/SKILL.md` or `.agents/skills/event-template/SKILL.md`

---

## When to Use

Use this skill when:
- Creating a new event page template/theme
- The user asks for a new page design style
- Adding visual variety to the template options

## Template System Overview

Templates must be added to **4 locations**:

| Location | File | What to Add |
|----------|------|-------------|
| 1. Definition | `EventDesignTab.tsx` | TEMPLATES array entry |
| 2. Preview Card | `EventDesignTab.tsx` | renderTemplatePreview() case |
| 3. Live Editor | `EditDesignButton.tsx` | TEMPLATES array entry |
| 4. Full Page | `e/[slug]/page.tsx` | Complete template implementation |

## File Paths

```
src/components/dashboard/EventDesignTab.tsx    # Preview cards + definitions
src/components/public/EditDesignButton.tsx     # Live editor dropdown
src/app/(public)/e/[slug]/page.tsx             # Full page templates
```

## Implementation Steps

### Step 1: Add Template Definition

In `EventDesignTab.tsx`, add to TEMPLATES array (around line 23):

```typescript
{
  id: "your-template-id",
  name: "DISPLAY NAME",
  description: "Brief description of the style",
},
```

### Step 2: Add Preview Card

In `EventDesignTab.tsx`, add case to `renderTemplatePreview()` switch (around line 340):

```typescript
case "your-template-id":
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Preview is ~200x220px - create a miniature representation */}
      {/* Use accentColor variable for highlights */}
      {/* Use typographyClass for text styling */}

      {/* Typical structure: */}
      {/* - Background effects (gradients, patterns) */}
      {/* - Mini flyer placeholder area */}
      {/* - Title text (text-[10px] to text-[12px]) */}
      {/* - Date hint (text-[6px] to text-[8px]) */}
      {/* - CTA button */}
    </div>
  )
```

**Preview Card Guidelines:**
- Size: ~200x220px (handled by parent container)
- Show miniature version of full template aesthetic
- Use `accentColor` variable for colored elements
- Use `typographyClass` for text styling
- Keep text tiny (text-[6px] to text-[11px])

### Step 3: Add Live Editor Entry

In `EditDesignButton.tsx`, add to TEMPLATES array (around line 27):

```typescript
{ id: 'your-template-id', name: 'DISPLAY NAME', icon: '◇' },
```

Choose a unique Unicode icon that represents the template's aesthetic.

### Step 4: Add Full Page Template

In `e/[slug]/page.tsx`, add before the editorial default template return (search for "EDITORIAL TEMPLATE"):

```typescript
// ============================================
// YOUR TEMPLATE NAME - Brief description
// ============================================
if (pageTheme === 'your-template-id') {
  return (
    <div className="min-h-screen bg-[background-color] text-white">
      <ViewTracker eventId={event.id} />

      {/* Background effects */}

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero with flyer */}
        <section>
          {event.flyerUrl ? (
            <Image src={event.flyerUrl} ... />
          ) : (
            <div>Fallback placeholder</div>
          )}
        </section>

        {/* Event info */}
        <section>
          <h1>{event.title}</h1>
          <p>{dayStr} · {dateStr} · {timeStr}</p>
          {/* Location (use showLocation conditional) */}
        </section>

        {/* Lineup (if lineup.length > 0) */}
        {lineup.length > 0 && (
          <section>
            {lineup.map((artist, i) => (...))}
          </section>
        )}

        {/* Tickets/RSVP */}
        {!isRsvpEvent && availableTiers.length > 0 && (...)}

        {/* Map (if showMap && mapEmbedUrl) */}
        {showMap && mapEmbedUrl && (
          <iframe src={mapEmbedUrl} ... />
        )}

        {/* Info sections */}
        <EventInfoSections
          about={event.about}
          refundPolicy={event.refundPolicy}
          faqs={event.faqs}
          variant="default"
          accentColor={accentColor}
        />

        {/* Footer */}
        <footer>...</footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 ...">
        {hasAvailability ? (
          <Link href={ctaUrl}>{ctaText}</Link>
        ) : (
          <div>Sold Out / Full</div>
        )}
      </div>
    </div>
  )
}
```

## Available Variables in Templates

```typescript
// Colors & Typography
accentColor        // Hex string, e.g., "#ff1493"
typographyClass    // "font-mono" | "font-headline" | "font-serif" | "font-sans"

// Event Data
event.title
event.description
event.flyerUrl     // May be null
event.venueName
event.venueAddress
event.city
event.state        // May be null
event.organizer.displayName
event.organizer.logoUrl  // May be null

// Computed Values
dayStr             // "Saturday"
dateStr            // "JAN 15"
timeStr            // "10:00 PM"
lineup             // Array of { name, role?, imageUrl?, socialUrl?, showtime? }
availableTiers     // Array of ticket tiers
lowestPrice        // Number in cents
totalAvailable     // Total tickets remaining

// Booleans
isRsvpEvent        // true if RSVP-only event
hasAvailability    // true if tickets/spots available
showLocation       // true if location should be shown
showMap            // true if map should be shown

// URLs
ctaUrl             // Checkout or RSVP URL
ctaText            // "GET TICKETS" or "RSVP"
mapUrl             // Google Maps link
mapEmbedUrl        // Google Maps embed URL
```

## Design Requirements

### Must Have Different Aesthetics
Existing templates:
- **Brutalist** - Raw, grid-exposed, harsh borders
- **Neon** - Glowing accents, atmospheric, centered
- **Minimal** - Clean, subtle gradients, elegant spacing
- **Tilt** - Chaotic, rotated elements, high energy
- **Lush** - Warm, luxurious, two-column layout
- **Nice** - Sticky sidebar, modern, blurred backgrounds
- **Editorial** - Magazine-style, sophisticated typography
- **Card** - Floating cards, depth, rounded corners
- **Vapor** - Retro-futuristic, synthwave, scan lines

New templates should NOT duplicate existing aesthetics.

### Technical Requirements
All templates must:
- Use the `accentColor` prop for highlights, buttons, borders, glows
- Use the `typographyClass` for headings
- Be fully responsive (mobile + desktop)
- Include mobile sticky CTA bar
- Support all event features: flyer, lineup, tickets/RSVP, location, map, FAQs, about
- Handle missing data gracefully (no flyer, no lineup, hidden location, etc.)

## Testing Checklist

After implementing a new template:

- [ ] Template appears in dashboard Design tab carousel
- [ ] Preview card displays correctly with accent color
- [ ] Template appears in live editor dropdown
- [ ] Full page renders on public event page
- [ ] Accent color applies to all highlighted elements
- [ ] Typography selection affects headings
- [ ] Responsive on mobile and desktop
- [ ] Mobile sticky CTA appears and works
- [ ] Handles event with no flyer gracefully
- [ ] Handles event with no lineup gracefully
- [ ] Handles hidden location correctly
- [ ] RSVP events display correctly
- [ ] Ticketed events display correctly
- [ ] Map displays when enabled
- [ ] Info sections (about, FAQs) render correctly

## Example: Creating "GLITCH" Template

### 1. Add Definition (EventDesignTab.tsx)
```typescript
{
  id: "glitch",
  name: "GLITCH",
  description: "Digital artifacts, corrupted aesthetic",
},
```

### 2. Add Preview Card (EventDesignTab.tsx)
```typescript
case "glitch":
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Glitch lines */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 right-0 h-2 bg-red-500/30 translate-x-1" />
        <div className="absolute top-1/3 left-0 right-0 h-1 bg-cyan-500/30 -translate-x-2" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-3 flex flex-col items-center justify-center">
        <div
          className={`text-[12px] font-bold ${typographyClass}`}
          style={{ color: accentColor, textShadow: `2px 0 #ff0000, -2px 0 #00ffff` }}
        >
          EVENT
        </div>
        <div className="text-[7px] text-white/50 mt-2">JAN 15 · 10PM</div>
        <div
          className="mt-3 px-3 py-1 text-[6px] font-bold text-black"
          style={{ backgroundColor: accentColor }}
        >
          ENTER
        </div>
      </div>
    </div>
  )
```

### 3. Add Editor Entry (EditDesignButton.tsx)
```typescript
{ id: 'glitch', name: 'GLITCH', icon: '▓' },
```

### 4. Add Full Template (e/[slug]/page.tsx)
Full implementation with RGB split effects, scan lines, digital noise, distortion effects, etc.
