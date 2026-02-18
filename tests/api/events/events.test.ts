import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockPrisma = {
    organizerProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
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

import { GET, POST } from "@/app/api/events/route"

describe("Events API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: null })
  })

  describe("GET /api/events", () => {
    it("should return published events for unauthenticated users", async () => {
      mockPrisma.event.findMany.mockResolvedValue([
        {
          id: "event-1",
          title: "Public Event",
          slug: "public-event",
          startsAt: new Date("2025-06-01T20:00:00Z"),
          isPublished: true,
          status: "PUBLISHED",
          organizer: { displayName: "Test Organizer", slug: "test-org" },
          ticketTiers: [{ id: "tier-1", price: 2000 }],
        },
      ])

      const request = new Request("http://localhost:3000/api/events")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].title).toBe("Public Event")
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            status: "PUBLISHED",
          }),
        })
      )
    })

    it("should return single event by slug", async () => {
      mockPrisma.event.findFirst.mockResolvedValue({
        id: "event-1",
        title: "Specific Event",
        slug: "specific-event",
        isPublished: true,
        isRsvpOnly: false,
        rsvpCapacity: null,
        rsvpAllowPlusOnes: false,
        rsvpMaxPlusOnes: 1,
        rsvpCount: 0,
        organizer: {
          displayName: "Test Organizer",
          slug: "test-org",
          stripeChargesEnabled: true,
        },
        ticketTiers: [],
      })

      const request = new Request(
        "http://localhost:3000/api/events?slug=specific-event"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].title).toBe("Specific Event")
    })

    it("should return empty array when slug not found", async () => {
      mockPrisma.event.findFirst.mockResolvedValue(null)
      mockPrisma.organizerProfile.findMany.mockResolvedValue([])

      const request = new Request(
        "http://localhost:3000/api/events?slug=nonexistent"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it("should filter by city", async () => {
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new Request(
        "http://localhost:3000/api/events?city=Miami"
      )

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: "Miami",
          }),
        })
      )
    })

    it("should filter by organizerId", async () => {
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new Request(
        "http://localhost:3000/api/events?organizerId=org-123"
      )

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizerId: "org-123",
          }),
        })
      )
    })

    it("should only return future events", async () => {
      mockPrisma.event.findMany.mockResolvedValue([])

      const request = new Request("http://localhost:3000/api/events")

      await GET(request)

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startsAt: { gte: expect.any(Date) },
          }),
        })
      )
    })

    it("should handle combined organizer-event slug", async () => {
      mockPrisma.event.findFirst.mockResolvedValueOnce(null) // First exact match fails
      mockPrisma.organizerProfile.findMany.mockResolvedValue([
        { slug: "test-org", id: "org-123" },
      ])
      mockPrisma.event.findFirst.mockResolvedValueOnce({
        id: "event-1",
        title: "Combined Slug Event",
        slug: "party",
        isPublished: true,
        isRsvpOnly: false,
        rsvpCapacity: null,
        rsvpAllowPlusOnes: false,
        rsvpMaxPlusOnes: 1,
        rsvpCount: 0,
        organizer: { displayName: "Test Org", slug: "test-org", stripeChargesEnabled: true },
        ticketTiers: [],
      })

      const request = new Request(
        "http://localhost:3000/api/events?slug=test-org-party"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].title).toBe("Combined Slug Event")
    })
  })

  describe("POST /api/events", () => {
    const validEventData = {
      title: "New Event",
      startsAt: "2025-06-01T20:00:00Z",
      venueName: "Test Venue",
      venueAddress: "123 Test St",
      city: "Test City",
    }

    it("should create event for authenticated organizer", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findFirst.mockResolvedValue(null) // No slug conflict
      mockPrisma.event.create.mockResolvedValue({
        id: "event-new",
        title: "New Event",
        slug: "new-event",
        organizerId: "org-123",
      })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("New Event")
    })

    it("should return 401 for unauthenticated users", async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe("Unauthorized")
    })

    it("should return 400 for user without organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null)

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Organizer profile required")
    })

    it("should return 400 for missing required fields", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Incomplete" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Missing required fields")
    })

    it("should generate unique slug on conflict", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findFirst
        .mockResolvedValueOnce({ slug: "new-event" }) // First slug exists
        .mockResolvedValueOnce(null) // new-event-1 available
      mockPrisma.event.create.mockResolvedValue({
        id: "event-new",
        title: "New Event",
        slug: "new-event-1",
        organizerId: "org-123",
      })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validEventData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slug).toBe("new-event-1")
    })

    it("should normalize external ticketing URL", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findFirst.mockResolvedValue(null)
      mockPrisma.event.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          id: "event-new",
        })
      })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEventData,
          ticketingType: "EXTERNAL",
          externalTicketingUrl: "example.com/tickets",
        }),
      })

      await POST(request)

      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            externalTicketingUrl: "https://example.com/tickets",
          }),
        })
      )
    })

    it("should set RSVP settings correctly", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" })
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "org-123",
        userId: "user-123",
      })
      mockPrisma.event.findFirst.mockResolvedValue(null)
      mockPrisma.event.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          id: "event-new",
        })
      })

      const request = new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEventData,
          isRsvpOnly: true,
          rsvpCapacity: "100",
          rsvpAllowPlusOnes: true,
          rsvpMaxPlusOnes: "2",
        }),
      })

      await POST(request)

      expect(mockPrisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isRsvpOnly: true,
            rsvpCapacity: 100,
            rsvpAllowPlusOnes: true,
            rsvpMaxPlusOnes: 2,
          }),
        })
      )
    })
  })
})
