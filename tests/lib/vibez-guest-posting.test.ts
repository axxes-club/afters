import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Anonymous guests posting to VIBEZ, end to end through the guest token.
 *
 * The access-mode tests pass a ready-made `tkt_` subject into vibezAccess, which
 * hid two failures in how the subject was built from the token:
 * - a guestlist guest was minted as `gl_<id>` and read back as `tkt_gl_<id>`,
 *   matching neither the ticket nor the guestlist check;
 * - a guest who only scanned a sticker got no token at all, so no subject.
 * Here the subject comes from verifyGuestToken, exactly as the routes get it.
 */

const { mockEvent, mockStaff, mockTicket, mockGuestlist, mockBan, mockSpot } = vi.hoisted(() => ({
  mockEvent: { findUnique: vi.fn() },
  mockStaff: { findFirst: vi.fn() },
  mockTicket: { findFirst: vi.fn(), findUnique: vi.fn() },
  mockGuestlist: { findFirst: vi.fn() },
  mockBan: { findFirst: vi.fn() },
  mockSpot: { findFirst: vi.fn() },
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: mockEvent,
    staffMember: mockStaff,
    ticket: mockTicket,
    rsvp: { findFirst: vi.fn().mockResolvedValue(null) },
    guestlistEntry: mockGuestlist,
    vibezBan: mockBan,
    vibezSpot: mockSpot,
    vibezPost: { count: vi.fn() },
  },
}))

import { canPost, vibezAccess } from "@/lib/vibez"
import { guestSubject, mintGuestToken, newSpotGuestRef, verifyGuestToken } from "@/lib/vibez-guest"

const EVENT = "event-1"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.VIBEZ_UPLOAD_SECRET = "test-secret"
  mockEvent.findUnique.mockResolvedValue({ organizerId: "org-1" })
  mockStaff.findFirst.mockResolvedValue(null)
  mockTicket.findFirst.mockResolvedValue(null)
  mockTicket.findUnique.mockResolvedValue(null)
  mockGuestlist.findFirst.mockResolvedValue(null)
  mockBan.findFirst.mockResolvedValue(null)
  mockSpot.findFirst.mockResolvedValue(null)
})

function subjectOf(ref: string) {
  const token = verifyGuestToken(mintGuestToken(ref, EVENT), EVENT)
  expect(token).not.toBeNull()
  return token!.subject
}

describe("guest subjects", () => {
  it("keeps a bought ticket as tkt_<id>", () => {
    expect(guestSubject("ticket-1")).toBe("tkt_ticket-1")
  })

  it("keeps a guestlist line as gl_<id>, not tkt_gl_<id>", () => {
    expect(subjectOf("gl_entry-1")).toBe("gl_entry-1")
  })

  it("gives a sticker scanner an opaque spot_ identity that survives the token", () => {
    const ref = newSpotGuestRef()
    expect(ref).toMatch(/^spot_[0-9a-f]{32}$/)
    expect(subjectOf(ref)).toBe(ref)
  })
})

describe("posting", () => {
  it("lets a guestlist guest post under ticket_or_qr", async () => {
    mockGuestlist.findFirst.mockResolvedValue({ id: "entry-1" })
    const access = await vibezAccess(EVENT, null, null, subjectOf("gl_entry-1"), [], "ticket_or_qr")
    expect(access).toBe("attendee")
    expect(canPost(access)).toBe(true)
  })

  it("lets an anonymous sticker scanner post under ticket_or_qr", async () => {
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    const access = await vibezAccess(EVENT, null, null, subjectOf(newSpotGuestRef()), ["spot-1"], "ticket_or_qr")
    expect(canPost(access)).toBe(true)
  })

  it("still refuses a sticker scanner under ticket mode", async () => {
    mockSpot.findFirst.mockResolvedValue({ id: "spot-1" })
    const access = await vibezAccess(EVENT, null, null, subjectOf(newSpotGuestRef()), ["spot-1"], "ticket")
    expect(canPost(access)).toBe(false)
  })

  it("refuses a spot_ identity whose sticker cookie is gone", async () => {
    const access = await vibezAccess(EVENT, null, null, subjectOf(newSpotGuestRef()), [], "ticket_or_qr")
    expect(canPost(access)).toBe(false)
  })
})
