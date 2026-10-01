import { describe, it, expect, vi, beforeEach } from "vitest"
import { UploadThingError } from "@/lib/gcs/router.mjs"

// Hoist mocks before any imports
const { mockAuth, mockRequireOrganizer } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRequireOrganizer: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }))
vi.mock("@/lib/auth-utils", () => ({ requireOrganizer: mockRequireOrganizer }))
// Stub UTApi to avoid build-time errors in test env
vi.mock("uploadthing/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("uploadthing/server")>()
  return { ...actual, UTApi: class MockUTApi {} }
})

import { organizerMiddleware, authMiddleware } from "@/lib/uploadthing"

describe("UploadThing auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("organizerMiddleware", () => {
    it("returns userId for an organizer", async () => {
      mockRequireOrganizer.mockResolvedValue({ id: "org-1", role: "ORGANIZER" })

      const result = await organizerMiddleware()

      expect(result).toEqual({ userId: "org-1" })
    })

    it("returns userId for a superadmin (also passes requireOrganizer)", async () => {
      mockRequireOrganizer.mockResolvedValue({ id: "admin-1", role: "SUPERADMIN" })

      const result = await organizerMiddleware()

      expect(result).toEqual({ userId: "admin-1" })
    })

    it("throws UploadThingError when user is not authenticated", async () => {
      mockRequireOrganizer.mockRejectedValue(new Error("Unauthorized"))

      await expect(organizerMiddleware()).rejects.toBeInstanceOf(UploadThingError)
    })

    it("throws UploadThingError with 'Unauthorized' message for non-organizer", async () => {
      mockRequireOrganizer.mockRejectedValue(
        new Error("Unauthorized: Organizer access required")
      )

      await expect(organizerMiddleware()).rejects.toThrow("Unauthorized")
    })

    it("lets non-auth errors (e.g. DB failures) bubble through unwrapped", async () => {
      const dbError = new Error("Connection refused")
      mockRequireOrganizer.mockRejectedValue(dbError)

      const err = await organizerMiddleware().catch((e) => e)

      expect(err).toBe(dbError)
      expect(err).not.toBeInstanceOf(UploadThingError)
    })
  })

  describe("authMiddleware", () => {
    it("returns userId for any authenticated user", async () => {
      mockAuth.mockResolvedValue({ userId: "user-42" })

      const result = await authMiddleware()

      expect(result).toEqual({ userId: "user-42" })
    })

    it("throws UploadThingError when userId is null (unauthenticated)", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      await expect(authMiddleware()).rejects.toBeInstanceOf(UploadThingError)
    })

    it("throws UploadThingError when userId is undefined", async () => {
      mockAuth.mockResolvedValue({ userId: undefined })

      await expect(authMiddleware()).rejects.toBeInstanceOf(UploadThingError)
    })

    it("throws with 'Unauthorized' message", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      await expect(authMiddleware()).rejects.toThrow("Unauthorized")
    })

    it("does not call requireOrganizer — any role passes", async () => {
      mockAuth.mockResolvedValue({ userId: "regular-user" })

      await authMiddleware()

      expect(mockRequireOrganizer).not.toHaveBeenCalled()
    })
  })
})
