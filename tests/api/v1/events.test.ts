import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma, mockValidateApiKey, mockCheckApiRateLimit } =
  vi.hoisted(() => {
    const mockAuth = vi.fn()
    const mockValidateApiKey = vi.fn()
    const mockCheckApiRateLimit = vi.fn()
    const mockPrisma = {
      organizerProfile: {
        findUnique: vi.fn(),
      },
      event: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
    }
    return { mockAuth, mockPrisma, mockValidateApiKey, mockCheckApiRateLimit }
  })

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}))

vi.mock("@/lib/api-keys", () => ({
  validateApiKey: mockValidateApiKey,
  checkApiRateLimit: mockCheckApiRateLimit,
  hasScope: (scopes: string[], scope: string) => scopes.includes(scope),
}))

import { GET, POST } from "@/app/api/v1/events/route"

describe("Public API v1 Events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
  })

  describe("GET /api/v1/events", () => {
    it("should return events with valid API key", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findMany.mockResolvedValue([
        {
          id: "event-1",
          title: "Test Event",
          slug: "test-event",
          startsAt: new Date(),
          isPublished: true,
          ticketTiers: [],
          _count: { orders: 0, tickets: 0, views: 10 },
        },
      ])
      mockPrisma.event.count.mockResolvedValue(1)

      const request = new Request("http://localhost:3000/api/v1/events", {
        headers: { "X-API-Key": "aftr_test123456789012345678901234" },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].title).toBe("Test Event")
      expect(data.pagination).toBeDefined()
      expect(data.pagination.total).toBe(1)
    })

    it("should return 401 without API key", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: false,
        error: "Invalid API key format",
      })

      const request = new Request("http://localhost:3000/api/v1/events")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain("Authentication required")
    })

    it("should return 403 without required scope", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["orders:read"], // Wrong scope
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        headers: { "X-API-Key": "aftr_test123456789012345678901234" },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain("Missing required scope")
    })

    it("should return 429 when rate limited", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        headers: { "X-API-Key": "aftr_test123456789012345678901234" },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toContain("Rate limit")
    })

    it("should return 404 if organizer profile not found", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null)

      const request = new Request("http://localhost:3000/api/v1/events", {
        headers: { "X-API-Key": "aftr_test123456789012345678901234" },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain("Organizer profile not found")
    })

    it("should filter by status parameter", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(0)

      const request = new Request(
        "http://localhost:3000/api/v1/events?status=published",
        {
          headers: { "X-API-Key": "aftr_test123456789012345678901234" },
        }
      )

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
          }),
        })
      )
    })

    it("should respect limit and offset parameters", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(50)

      const request = new Request(
        "http://localhost:3000/api/v1/events?limit=10&offset=20",
        {
          headers: { "X-API-Key": "aftr_test123456789012345678901234" },
        }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      )
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.offset).toBe(20)
    })

    it("should allow session auth when enabled", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findMany.mockResolvedValue([])
      mockPrisma.event.count.mockResolvedValue(0)

      // No API key provided, but session auth should work
      const request = new Request("http://localhost:3000/api/v1/events")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toEqual([])
    })
  })

  describe("POST /api/v1/events", () => {
    const validEventData = {
      title: "New Event",
      startsAt: "2025-06-01T20:00:00Z",
      venueName: "Test Venue",
      venueAddress: "123 Test St",
      city: "Test City",
    }

    it("should create an event with valid API key", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:write"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findFirst.mockResolvedValue(null) // No slug conflict
      mockPrisma.event.create.mockResolvedValue({
        id: "event-new",
        title: "New Event",
        slug: "new-event",
        startsAt: new Date("2025-06-01T20:00:00Z"),
        status: "DRAFT",
        createdAt: new Date(),
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          "X-API-Key": "aftr_test123456789012345678901234",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe("New Event")
      expect(data.slug).toBe("new-event")
    })

    it("should return 400 for missing required fields", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:write"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          "X-API-Key": "aftr_test123456789012345678901234",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Incomplete Event",
          // Missing required fields
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain("Missing required fields")
    })

    it("should return 403 without events:write scope", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:read"], // Wrong scope
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          "X-API-Key": "aftr_test123456789012345678901234",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain("Missing required scope")
    })

    it("should generate unique slug when conflict exists", async () => {
      mockValidateApiKey.mockResolvedValue({
        valid: true,
        userId: "user-123",
        scopes: ["events:write"],
        keyId: "key-123",
      })
      mockCheckApiRateLimit.mockReturnValue({
        allowed: true,
        remaining: 99,
        resetAt: Date.now() + 60000,
      })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      // First call returns existing event, second returns null
      mockPrisma.event.findFirst
        .mockResolvedValueOnce({ id: "existing", slug: "new-event" })
        .mockResolvedValueOnce(null)
      mockPrisma.event.create.mockResolvedValue({
        id: "event-new",
        title: "New Event",
        slug: "new-event-1",
        startsAt: new Date("2025-06-01T20:00:00Z"),
        status: "DRAFT",
        createdAt: new Date(),
      })

      const request = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          "X-API-Key": "aftr_test123456789012345678901234",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.slug).toBe("new-event-1")
    })
  })
})
