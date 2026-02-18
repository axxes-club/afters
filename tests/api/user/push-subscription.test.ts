import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockPrisma = {
    pushSubscription: {
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

import { POST, DELETE } from "@/app/api/user/notifications/push-subscription/route"

describe("Push Subscription API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
  })

  describe("POST /api/user/notifications/push-subscription", () => {
    it("should create a new push subscription", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.pushSubscription.upsert.mockResolvedValue({
        id: "sub-123",
        userId: "user-123",
        endpoint: "https://push.example.com/abc123",
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
      })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
            keys: {
              p256dh: "test-p256dh-key",
              auth: "test-auth-key",
            },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.subscriptionId).toBe("sub-123")
      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: "https://push.example.com/abc123" },
        create: {
          userId: "user-123",
          endpoint: "https://push.example.com/abc123",
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
        update: {
          userId: "user-123",
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      })
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
            keys: {
              p256dh: "test-p256dh-key",
              auth: "test-auth-key",
            },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should return 400 for missing endpoint", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keys: {
              p256dh: "test-p256dh-key",
              auth: "test-auth-key",
            },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid push subscription data")
    })

    it("should return 400 for missing keys", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid push subscription data")
    })

    it("should return 400 for missing p256dh key", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
            keys: {
              auth: "test-auth-key",
            },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid push subscription data")
    })

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.pushSubscription.upsert.mockRejectedValue(new Error("DB error"))

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
            keys: {
              p256dh: "test-p256dh-key",
              auth: "test-auth-key",
            },
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to save push subscription")
    })
  })

  describe("DELETE /api/user/notifications/push-subscription", () => {
    it("should delete a push subscription", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
          }),
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          endpoint: "https://push.example.com/abc123",
        },
      })
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
          }),
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })

    it("should return 400 for missing endpoint", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Endpoint required")
    })

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.pushSubscription.deleteMany.mockRejectedValue(new Error("DB error"))

      const request = new Request(
        "http://localhost:3000/api/user/notifications/push-subscription",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "https://push.example.com/abc123",
          }),
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Failed to delete push subscription")
    })
  })
})
