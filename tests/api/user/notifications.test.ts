import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockPrisma = {
    notificationPreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    pushSubscription: {
      count: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
  return { mockAuth, mockPrisma }
})

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}))

import { GET, PUT } from "@/app/api/user/notifications/route"

describe("User Notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
  })

  describe("GET /api/user/notifications", () => {
    it("should return existing notification preferences", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        id: "pref-123",
        userId: "user-123",
        emailTicketSales: true,
        emailEventReminders: true,
        emailCheckInSummaries: false,
        emailProductUpdates: false,
        pushTicketSales: true,
        pushEventReminders: true,
        pushCheckInSummaries: false,
        pushProductUpdates: false,
      })
      mockPrisma.pushSubscription.count.mockResolvedValue(1)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.emailTicketSales).toBe(true)
      expect(data.pushTicketSales).toBe(true)
      expect(data.hasPushSubscription).toBe(true)
    })

    it("should create default preferences if none exist", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(null)
      mockPrisma.notificationPreference.create.mockResolvedValue({
        id: "pref-123",
        userId: "user-123",
        emailTicketSales: true,
        emailEventReminders: true,
        emailCheckInSummaries: false,
        emailProductUpdates: false,
        pushTicketSales: true,
        pushEventReminders: true,
        pushCheckInSummaries: false,
        pushProductUpdates: false,
      })
      mockPrisma.pushSubscription.count.mockResolvedValue(0)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.notificationPreference.create).toHaveBeenCalled()
      expect(data.emailTicketSales).toBe(true)
      expect(data.hasPushSubscription).toBe(false)
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.findUnique.mockRejectedValue(new Error("DB error"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to fetch notification preferences")
    })
  })

  describe("PUT /api/user/notifications", () => {
    it("should update notification preferences", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        id: "pref-123",
        userId: "user-123",
        emailTicketSales: false,
        emailEventReminders: true,
        emailCheckInSummaries: true,
        emailProductUpdates: false,
        pushTicketSales: true,
        pushEventReminders: true,
        pushCheckInSummaries: false,
        pushProductUpdates: false,
      })
      mockPrisma.pushSubscription.count.mockResolvedValue(0)

      const request = new Request(
        "http://localhost:3000/api/user/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailTicketSales: false,
            emailCheckInSummaries: true,
          }),
        }
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.emailTicketSales).toBe(false)
      expect(data.emailCheckInSummaries).toBe(true)
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new Request(
        "http://localhost:3000/api/user/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailTicketSales: false,
          }),
        }
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should return 400 for invalid boolean value", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })

      const request = new Request(
        "http://localhost:3000/api/user/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailTicketSales: "invalid",
          }),
        }
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid value for emailTicketSales")
    })

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.upsert.mockRejectedValue(new Error("DB error"))

      const request = new Request(
        "http://localhost:3000/api/user/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailTicketSales: false,
          }),
        }
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to update notification preferences")
    })

    it("should update all preference fields", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.notificationPreference.upsert.mockResolvedValue({
        id: "pref-123",
        userId: "user-123",
        emailTicketSales: false,
        emailEventReminders: false,
        emailCheckInSummaries: true,
        emailProductUpdates: true,
        pushTicketSales: false,
        pushEventReminders: false,
        pushCheckInSummaries: true,
        pushProductUpdates: true,
      })
      mockPrisma.pushSubscription.count.mockResolvedValue(1)

      const request = new Request(
        "http://localhost:3000/api/user/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailTicketSales: false,
            emailEventReminders: false,
            emailCheckInSummaries: true,
            emailProductUpdates: true,
            pushTicketSales: false,
            pushEventReminders: false,
            pushCheckInSummaries: true,
            pushProductUpdates: true,
          }),
        }
      )

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.emailTicketSales).toBe(false)
      expect(data.emailEventReminders).toBe(false)
      expect(data.emailCheckInSummaries).toBe(true)
      expect(data.emailProductUpdates).toBe(true)
      expect(data.pushTicketSales).toBe(false)
      expect(data.pushEventReminders).toBe(false)
      expect(data.pushCheckInSummaries).toBe(true)
      expect(data.pushProductUpdates).toBe(true)
      expect(data.hasPushSubscription).toBe(true)
    })
  })
})
