import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The feed takes guest photos, so "may this person do that" has to be decided
 * in one place and hold for every caller. These are the rules, pinned.
 */

const { mockEvent, mockStaff, mockTicket, mockRsvp, mockGuestlist, mockBan, mockCount } =
  vi.hoisted(() => ({
    mockEvent: { findUnique: vi.fn() },
    mockStaff: { findFirst: vi.fn() },
    mockTicket: { findFirst: vi.fn() },
    mockRsvp: { findFirst: vi.fn() },
    mockGuestlist: { findFirst: vi.fn() },
    mockBan: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
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
  mockRsvp.findFirst.mockResolvedValue(null)
  mockGuestlist.findFirst.mockResolvedValue(null)
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
    mockBan.findUnique.mockResolvedValue({ id: "ban-1" })
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
