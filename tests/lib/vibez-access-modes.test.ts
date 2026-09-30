import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The new access surface: accessMode, and the QR spot as a credential.
 *
 * These rules decide who is standing in the room. The pre-existing tests in
 * vibez.test.ts pin the ticket half; this file pins the half that is new here,
 * and in particular the interactions — a spot that grants under ticket_or_qr but
 * not under ticket, a ticket that grants under ticket_or_qr but not under qr, and
 * a spot id for another event granting nothing at all.
 */

const {
  mockEvent,
  mockStaff,
  mockTicket,
  mockRsvp,
  mockGuestlist,
  mockBan,
  mockSpot,
  mockCount,
} = vi.hoisted(() => ({
  mockEvent: { findUnique: vi.fn() },
  mockStaff: { findFirst: vi.fn() },
  mockTicket: { findFirst: vi.fn(), findUnique: vi.fn() },
  mockRsvp: { findFirst: vi.fn() },
  mockGuestlist: { findFirst: vi.fn() },
  mockBan: { findFirst: vi.fn() },
  mockSpot: { findFirst: vi.fn() },
  mockCount: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: mockEvent,
    staffMember: mockStaff,
    ticket: mockTicket,
    rsvp: mockRsvp,
    guestlistEntry: mockGuestlist,
    vibezBan: mockBan,
    vibezSpot: mockSpot,
    vibezPost: { count: mockCount },
  },
}))

import {
  canPost,
  canView,
  distanceM,
  geofenceToleranceM,
  postBudget,
  vibezAccess,
  withinGeofence,
} from "@/lib/vibez"

const EVENT = "event-1"
const USER = "user-1"
const TICKET_SUBJECT = "tkt_ticket-1"

function noAttendance() {
  mockEvent.findUnique.mockResolvedValue({ organizerId: "org-1" })
  mockStaff.findFirst.mockResolvedValue(null)
  mockTicket.findFirst.mockResolvedValue(null)
  mockTicket.findUnique.mockResolvedValue(null)
  mockRsvp.findFirst.mockResolvedValue(null)
  mockGuestlist.findFirst.mockResolvedValue(null)
  mockBan.findFirst.mockResolvedValue(null)
  mockSpot.findFirst.mockResolvedValue(null)
}

describe("accessMode: ticket", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("refuses a scanned spot on its own — anyone can photograph a sticker", async () => {
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    const access = await vibezAccess(EVENT, null, null, TICKET_SUBJECT, ["spot-1"], "ticket")
    expect(access).not.toBe("attendee")
  })

  it("still admits somebody holding a real ticket", async () => {
    mockTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      eventId: EVENT,
      status: "VALID",
    })
    expect(await vibezAccess(EVENT, null, null, TICKET_SUBJECT, [], "ticket")).toBe("attendee")
  })
})

describe("accessMode: qr", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("admits a guest holding a scanned spot", async () => {
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    expect(await vibezAccess(EVENT, null, null, TICKET_SUBJECT, ["spot-1"], "qr")).toBe(
      "attendee"
    )
  })

  it("refuses a guest whose ticket is valid but who scanned nothing", async () => {
    // The setting says "the room, not the ticket". A ticket bought in March and
    // forwarded to somebody at home must not get in.
    mockTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      eventId: EVENT,
      status: "VALID",
    })
    expect(await vibezAccess(EVENT, null, null, TICKET_SUBJECT, [], "qr")).toBe("none")
  })


describe("accessMode: ticket_or_qr (the default)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("treats a scanned spot as exactly as good as a ticket", async () => {
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    expect(
      await vibezAccess(EVENT, null, null, TICKET_SUBJECT, ["spot-1"], "ticket_or_qr")
    ).toBe("attendee")
  })

  it("still admits a ticket holder who scanned nothing", async () => {
    mockTicket.findUnique.mockResolvedValue({
      id: "ticket-1",
      eventId: EVENT,
      status: "VALID",
    })
    expect(await vibezAccess(EVENT, null, null, TICKET_SUBJECT, [], "ticket_or_qr")).toBe(
      "attendee"
    )
  })

  it("ignores a stale spot cookie once the sticker is taken down", async () => {
    mockSpot.findFirst.mockResolvedValue(null)
    expect(
      await vibezAccess(EVENT, null, null, TICKET_SUBJECT, ["spot-gone"], "ticket_or_qr")
    ).toBe("none")
  })
})

describe("accessMode: link", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("lets an anonymous visitor see the feed", async () => {
    expect(await vibezAccess(EVENT, null, null, null, [], "link")).toBe("public")
  })

  it("still honours a ban — an open feed is not an unmoderated one", async () => {
    mockBan.findFirst.mockResolvedValue({ id: "ban-1" })
    expect(await vibezAccess(EVENT, USER, null, null, [], "link")).toBe("banned")
    expect(canView("banned")).toBe(false)
  })

  it("never lets an anonymous visitor post", async () => {
    expect(canPost(await vibezAccess(EVENT, null, null, null, [], "link"))).toBe(false)
  })
})

describe("per-event limits", () => {
  beforeEach(() => {
    // resetAllMocks, not clearAllMocks: clearAllMocks does not drain the
    // mockResolvedValueOnce queue, so an unused value would leak into the next
    // test and these would silently depend on run order.
    vi.resetAllMocks()
    noAttendance()
    mockCount.mockReset()
    mockCount.mockResolvedValue(0)
  })

  it("uses the organizer's own numbers rather than the hard-coded defaults", async () => {
    // An organizer who sets 1/hour should be refused on their second post, even
    // though the exported constant says 10.
    mockCount.mockResolvedValue(1)
    expect((await postBudget(EVENT, USER, USER, { perGuestPerHour: 1 })).allowed).toBe(false)
  })

  it("allows a higher ceiling than the default", async () => {
    mockCount
      .mockResolvedValueOnce(10) // mine this hour
      .mockResolvedValueOnce(0) // everyone this hour
      .mockResolvedValueOnce(10) // total
    expect(await postBudget(EVENT, USER, USER, { perGuestPerHour: 25 })).toEqual({
      allowed: true,
    })
  })

  it("honours a room-wide hourly ceiling below the default", async () => {
    mockCount
      .mockResolvedValueOnce(0) // mine
      .mockResolvedValueOnce(50) // everyone this hour, over a limit of 20
    expect((await postBudget(EVENT, USER, USER, { perHour: 20 })).allowed).toBe(false)
  })
})

describe("geofencing", () => {
  // Berlin — a venue somebody would actually point a phone at.
  const VENUE = { lat: 52.52, lng: 13.405 }

  it("measures a known distance correctly", () => {
    expect(distanceM(VENUE, { lat: 53.52, lng: 13.405 })).toBeGreaterThan(110_000)
    expect(distanceM(VENUE, { lat: 53.52, lng: 13.405 })).toBeLessThan(112_000)
    expect(distanceM(VENUE, VENUE)).toBe(0)
  })

  it("admits somebody standing on the venue pin", () => {
    expect(withinGeofence(VENUE, { ...VENUE, radiusM: 300 }).ok).toBe(true)
  })

  it("admits somebody inside the radius", () => {
    // ~0.0009 degrees of latitude is about 100m.
    expect(withinGeofence({ lat: 52.52 + 0.0009, lng: 13.405 }, { ...VENUE, radiusM: 300 }).ok).toBe(
      true
    )
  })

  it("refuses somebody in another city, and says so", () => {
    const result = withinGeofence({ lat: 48.8566, lng: 2.3522 }, { ...VENUE, radiusM: 300 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/location/i)
      expect(result.distanceM).toBeGreaterThan(1000)
    }
  })

  it("tolerates GPS error, so a phone in a basement is not turned away", () => {
    // ~60m off the pin, outside a 30m radius but inside radius + tolerance.
    const drift = { lat: 52.52 + 0.00054, lng: 13.405 }
    expect(withinGeofence(drift, { ...VENUE, radiusM: 30 }).ok).toBe(true)
    expect(withinGeofence(drift, { ...VENUE, radiusM: 10 }).ok).toBe(true)
    expect(geofenceToleranceM()).toBeGreaterThan(0)
  })
})

  it("refuses a signed-in account holding a ticket, because the mode is about the room", async () => {
    // The gate sits above *every* ticket branch, so the setting means the same
    // thing whether or not the person has an account.
    mockTicket.findFirst.mockResolvedValue({ id: "ticket-1" })
    expect(await vibezAccess(EVENT, USER, "user@example.com", null, [], "qr")).toBe("none")
  })

  it("never honours a spot belonging to another event", async () => {
    // The cookie is signed, but the id still has to exist on *this* event.
    mockSpot.findFirst.mockResolvedValue(null)
    expect(
      await vibezAccess(EVENT, null, null, TICKET_SUBJECT, ["spot-of-another-event"], "qr")
    ).toBe("none")
  })

  it("gives a spot-only guest no posting rights until they have an identity", async () => {
    // No subject means nothing to key authorship, self-removal or bans on.
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    const access = await vibezAccess(EVENT, null, null, null, ["spot-1"], "qr")
    expect(access).toBe("public")
    expect(canView(access)).toBe(true)
    expect(canPost(access)).toBe(false)
  })
})
