import { describe, it, expect, beforeEach, afterAll, vi } from "vitest"

// UTApi refuses to construct outside a server runtime; the key parsing is
// what these tests are about, so stub the client out.
vi.mock("uploadthing/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("uploadthing/server")>()
  return { ...actual, UTApi: class MockUTApi { deleteFiles = vi.fn() } }
})

import { mintTicket, verifyTicket } from "@/lib/vibez-ticket"
import { fileKeyFromUrl } from "@/lib/vibez-storage"

const SECRET = "test-secret-for-tickets"
beforeEach(() => {
  process.env.VIBEZ_UPLOAD_SECRET = SECRET
})
afterAll(() => {
  delete process.env.VIBEZ_UPLOAD_SECRET
})

const USER = "user-1"
const EVENT = "event-1"

describe("vibez upload tickets", () => {
  it("accepts a ticket it just minted, for the same person and event", () => {
    const ticket = mintTicket(USER, EVENT)
    expect(verifyTicket(ticket, USER, EVENT)).toBe(true)
  })

  it("mints a different ticket every time, so one can't be replayed", () => {
    expect(mintTicket(USER, EVENT)).not.toBe(mintTicket(USER, EVENT))
  })

  it("refuses a ticket presented by someone else", () => {
    const ticket = mintTicket(USER, EVENT)
    expect(verifyTicket(ticket, "user-2", EVENT)).toBe(false)
  })

  it("refuses a ticket at a different event", () => {
    // A ticket is for one event; it must not travel to the next one.
    const ticket = mintTicket(USER, EVENT)
    expect(verifyTicket(ticket, USER, "event-2")).toBe(false)
  })

  it("refuses a tampered ticket", () => {
    const ticket = mintTicket(USER, EVENT)
    const parts = Buffer.from(ticket, "base64url").toString("utf8").split(".")
    parts[2] = "user-2" // swap the person, keep the old signature
    const forged = Buffer.from(parts.join(".")).toString("base64url")
    expect(verifyTicket(forged, "user-2", EVENT)).toBe(false)
  })

  it("refuses a ticket signed with a different secret", () => {
    const ticket = mintTicket(USER, EVENT)
    process.env.VIBEZ_UPLOAD_SECRET = "a-different-secret"
    expect(verifyTicket(ticket, USER, EVENT)).toBe(false)
  })

  it("refuses an expired ticket", () => {
    const ticket = mintTicket(USER, EVENT)
    // Travel past the five-minute life without waiting five minutes.
    const realNow = Date.now
    Date.now = () => realNow() + 6 * 60 * 1000
    try {
      expect(verifyTicket(ticket, USER, EVENT)).toBe(false)
    } finally {
      Date.now = realNow
    }
  })

  it("refuses nonsense without throwing", () => {
    for (const bad of ["", "not-a-ticket", "a.b.c", "!!!", Buffer.from("x.y.z.w.q").toString("base64url")]) {
      expect(verifyTicket(bad, USER, EVENT)).toBe(false)
    }
  })
})

describe("vibez storage keys", () => {
  it("reads the file key out of an UploadThing URL", () => {
    expect(fileKeyFromUrl("https://abc123.ufs.sh/f/xyz_image.jpg")).toBe("xyz_image.jpg")
    expect(fileKeyFromUrl("https://utfs.io/f/abc/photo.png")).toBe("abc/photo.png")
  })

  it("refuses to guess at a key from someone else's host", () => {
    // Deleting a key we mis-parsed could remove another account's file.
    expect(fileKeyFromUrl("https://evil.example.com/f/xyz.jpg")).toBeNull()
    expect(fileKeyFromUrl("https://notufs.sh.attacker.net/f/xyz.jpg")).toBeNull()
    expect(fileKeyFromUrl("not a url")).toBeNull()
    expect(fileKeyFromUrl("https://abc.ufs.sh/")).toBeNull()
  })
})
