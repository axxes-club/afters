import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The feed takes guest photos, so "may this person do that" has to be decided
 * in one place and hold for every caller. These are the rules, pinned.
 */

const { mockEvent, mockStaff, mockTicket, mockRsvp, mockGuestlist, mockBan, mockCount } =
  vi.hoisted(() => ({
    mockEvent: { findUnique: vi.fn() },
    mockStaff: { findFirst: vi.fn() },
    mockTicket: { findFirst: vi.fn(), findUnique: vi.fn() },
    mockRsvp: { findFirst: vi.fn() },
    mockGuestlist: { findFirst: vi.fn() },
    mockBan: { findFirst: vi.fn(), findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
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
    vibezPost: { count: mockCount, findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    vibezReport: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

import {
  canModerate,
  canPost,
  postBudget,
  uploadBudget,
  vibezAccess,
  VIBEZ_MAX_POSTS_PER_EVENT,
  VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR,
  VIBEZ_POSTS_PER_HOUR,
} from "@/lib/vibez"

const EVENT = "event-1"
const USER = "user-1"
const EMAIL = "guest@example.com"

/** Nothing but the event exists, so every attendee lookup misses. */
function noAttendance() {
  mockEvent.findUnique.mockResolvedValue({ organizerId: "org-1" })
  mockStaff.findFirst.mockResolvedValue(null)
  mockTicket.findFirst.mockResolvedValue(null)
  mockTicket.findUnique.mockResolvedValue(null)
  mockRsvp.findFirst.mockResolvedValue(null)
  mockGuestlist.findFirst.mockResolvedValue(null)
  mockBan.findFirst.mockResolvedValue(null)
  mockBan.findUnique.mockResolvedValue(null)
}

describe("vibez access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("lets active staff moderate, and nobody else", async () => {
    mockStaff.findFirst.mockResolvedValue({ id: "s1" })
    const access = await vibezAccess(EVENT, USER, null)
    expect(access).toBe("staff")
    expect(canModerate(access)).toBe(true)
    expect(canPost(access)).toBe(true)
  })

  it("does not treat an inactive staff member as staff", async () => {
    // The query itself filters on status: ACTIVE, so a miss means not staff.
    mockStaff.findFirst.mockResolvedValue(null)
    expect(await vibezAccess(EVENT, USER, null)).toBe("none")
  })

  it("admits an attendee holding a ticket, matched by account", async () => {
    mockTicket.findFirst.mockResolvedValueOnce({ id: "t1" })
    const access = await vibezAccess(EVENT, USER, null)
    expect(access).toBe("attendee")
    expect(canPost(access)).toBe(true)
    expect(canModerate(access)).toBe(false)
  })

  it("admits a guest-checkout attendee matched by order email, case-insensitively", async () => {
    mockTicket.findFirst
      .mockResolvedValueOnce(null) // by userId
      .mockResolvedValueOnce({ id: "t2" }) // by order email
    expect(await vibezAccess(EVENT, USER, "Guest@Example.COM")).toBe("attendee")
  })

  it("admits a confirmed RSVP and a guestlist entry", async () => {
    mockRsvp.findFirst.mockResolvedValue({ id: "r1" })
    expect(await vibezAccess(EVENT, USER, EMAIL)).toBe("attendee")

    vi.clearAllMocks()
    noAttendance()
    mockGuestlist.findFirst.mockResolvedValue({ id: "g1" })
    expect(await vibezAccess(EVENT, USER, EMAIL)).toBe("attendee")
  })

  it("turns away someone with no claim on the event", async () => {
    expect(await vibezAccess(EVENT, USER, EMAIL)).toBe("none")
    expect(canPost("none")).toBe(false)
  })

  it("turns away an unknown event", async () => {
    mockEvent.findUnique.mockResolvedValue(null)
    expect(await vibezAccess("nope", USER, EMAIL)).toBe("none")
  })

  it("keeps a banned attendee out of a feed they may otherwise attend", async () => {
    mockTicket.findFirst.mockResolvedValue({ id: "t1" })
    mockBan.findFirst.mockResolvedValue({ id: "ban-1" })
    const access = await vibezAccess(EVENT, USER, null)
    expect(access).toBe("banned")
    // They can still *see* the event, but not post into the feed.
    expect(canPost(access)).toBe(false)
    expect(canModerate(access)).toBe(false)
  })

  it("does not let a ban strip someone's moderator powers", async () => {
    // Staff are checked first, so a stale ban row can't lock out an organizer.
    mockStaff.findFirst.mockResolvedValue({ id: "s1" })
    expect(await vibezAccess(EVENT, USER, null)).toBe("staff")
  })
})

describe("vibez upload ceilings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCount.mockResolvedValue(0)
  })

  it("allows a first upload", async () => {
    expect(await uploadBudget(EVENT, USER)).toEqual({ allowed: true })
  })

  it("stops one person after the hourly limit", async () => {
    // uploadBudget counts once: the caller's posts in the last hour.
    mockCount.mockResolvedValue(VIBEZ_POSTS_PER_HOUR)
    const result = await uploadBudget(EVENT, USER)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/later/i)
  })

  it("refuses once the event's feed is full", async () => {
    // postBudget counts twice (mine, everyone) then totals the live posts.
    mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(VIBEZ_MAX_POSTS_PER_EVENT)
    const result = await postBudget(EVENT, USER)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/full/i)
  })

  it("refuses when one person alone floods the event's hour", async () => {
    mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(VIBEZ_MAX_POSTS_PER_EVENT)
    const result = await postBudget(EVENT, USER)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/busy/i)
  })

  it("allows while under every ceiling", async () => {
    mockCount.mockResolvedValueOnce(1).mockResolvedValueOnce(3).mockResolvedValueOnce(10)
    expect(await postBudget(EVENT, USER)).toEqual({ allowed: true })
  })
})

describe("vibez guest access", () => {
  // The bug this pins: a guest who bought a ticket without an account was
  // treated as signed out, so the feed refused the people most likely to be
  // standing in the room. A redeemed ticket is now attendance.
  beforeEach(() => {
    vi.clearAllMocks()
    noAttendance()
  })

  it("admits a guest holding a valid redeemed ticket", async () => {
    mockTicket.findUnique.mockResolvedValue({
      id: "tkt-1",
      eventId: EVENT,
      status: "VALID",
    })
    const access = await vibezAccess(EVENT, null, null, "tkt_tkt-1")
    expect(access).toBe("attendee")
    expect(canPost(access)).toBe(true)
  })

  it("revokes a guest whose ticket was cancelled or refunded after redeeming", async () => {
    // The cookie still verifies — the signature is fine. The ticket is not, so
    // the access check has to re-read it rather than trust the cookie.
    for (const status of ["CANCELLED", "REFUNDED"]) {
      mockTicket.findUnique.mockResolvedValue({ id: "tkt-1", eventId: EVENT, status })
      expect(await vibezAccess(EVENT, null, null, "tkt_tkt-1")).toBe("none")
    }
  })

  it("will not honour a guest ticket that belongs to another event", async () => {
    mockTicket.findUnique.mockResolvedValue({
      id: "tkt-1",
      eventId: "some-other-event",
      status: "VALID",
    })
    expect(await vibezAccess(EVENT, null, null, "tkt_tkt-1")).toBe("none")
  })

  it("keeps a banned guest out", async () => {
    mockTicket.findUnique.mockResolvedValue({ id: "tkt-1", eventId: EVENT, status: "VALID" })
    mockBan.findFirst.mockResolvedValue({ id: "ban-1" })
    expect(await vibezAccess(EVENT, null, null, "tkt_tkt-1")).toBe("banned")
  })

  it("turns away a guest subject that points at no ticket at all", async () => {
    mockTicket.findUnique.mockResolvedValue(null)
    expect(await vibezAccess(EVENT, null, null, "tkt_made-up")).toBe("none")
  })
})

describe("vibez hourly room ceiling", () => {
  // Regression: the room's hourly post count was compared against the event's
  // *lifetime* ceiling. A popular event therefore refused everyone for the rest
  // of the night once it passed 500 posts in an hour, and never recovered.
  beforeEach(() => {
    // mockReset, not clearAllMocks: clearAllMocks does not drain the
    // `mockResolvedValueOnce` queue, so an unused value from the previous test
    // would become the next test's first answer and these would silently depend
    // on the order they run in.
    vi.resetAllMocks()
    noAttendance()
    mockCount.mockReset()
    mockCount.mockResolvedValue(0)
  })

  it("throttles a busy room without closing the feed for the night", async () => {
    mockCount
      .mockResolvedValueOnce(0) // mine this hour
      .mockResolvedValueOnce(VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR) // everyone this hour
      .mockResolvedValueOnce(10) // live posts on the event, far from the cap
    const result = await postBudget(EVENT, USER, USER)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/busy/i)
  })

  it("keeps accepting while the room is busy but the event is nowhere near full", async () => {
    mockCount
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(VIBEZ_MAX_POSTS_PER_EVENT_PER_HOUR - 1)
      .mockResolvedValueOnce(10)
    expect(await postBudget(EVENT, USER, USER)).toEqual({ allowed: true })
  })

  it("still refuses once the event has genuinely filled up", async () => {
    mockCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(VIBEZ_MAX_POSTS_PER_EVENT)
    const result = await postBudget(EVENT, USER, USER)
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/full/i)
  })
})
