/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mocks to avoid initialization errors
const { mockPrisma, mockVerifyTurnstile, mockResend } = vi.hoisted(() => {
  const mockPrisma = {
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    rsvp: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  const mockVerifyTurnstile = vi.fn()
  const mockResend = {
    emails: {
      send: vi.fn(),
    },
  }
  return { mockPrisma, mockVerifyTurnstile, mockResend }
})

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/components/Turnstile", () => ({
  verifyTurnstileToken: mockVerifyTurnstile,
}))

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = mockResend.emails
  },
}))

import { POST } from "@/app/api/events/[eventId]/rsvp/route"

describe("RSVP API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyTurnstile.mockResolvedValue(true)
    mockResend.emails.send.mockResolvedValue({ id: "email-1" })
  })

  const mockEvent = {
    id: "event-123",
    title: "Test Event",
    slug: "test-event",
    isRsvpOnly: true,
    isPublished: true,
    rsvpCapacity: 100,
    rsvpCount: 50,
    rsvpAllowPlusOnes: true,
    rsvpMaxPlusOnes: 2,
    startsAt: new Date("2025-06-01T20:00:00Z"),
    venueName: "Test Venue",
    city: "Test City",
    accentColor: "#ff1493",
    organizer: {
      displayName: "Test Organizer",
    },
  }

  const validRsvpData = {
    name: "Test Guest",
    email: "guest@example.com",
    turnstileToken: "valid-token",
  }

  it("should create RSVP for valid request", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
    mockPrisma.rsvp.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        rsvp: {
          create: vi.fn().mockResolvedValue({
            id: "rsvp-123",
            eventId: "event-123",
            name: "Test Guest",
            email: "guest@example.com",
          }),
        },
        event: {
          update: vi.fn().mockResolvedValue({}),
        },
      })
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("RSVP confirmed")
    expect(data.id).toBeDefined()
  })

  it("should return 400 for missing name or email", async () => {
    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnstileToken: "valid" }),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Name and email are required")
  })

  it("should return 400 for failed Turnstile verification", async () => {
    mockVerifyTurnstile.mockResolvedValue(false)

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toContain("Verification failed")
  })

  it("should return 404 for non-existent event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.message).toBe("Event not found")
  })

  it("should return 400 for non-RSVP event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...mockEvent,
      isRsvpOnly: false,
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("This event does not accept RSVPs")
  })

  it("should return 400 for unpublished event", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...mockEvent,
      isPublished: false,
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Event is not published")
  })

  it("should return 400 when plus ones not allowed", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...mockEvent,
      rsvpAllowPlusOnes: false,
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validRsvpData, plusOnes: 1 }),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Plus ones are not allowed for this event")
  })

  it("should return 400 when plus ones exceed max", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validRsvpData, plusOnes: 5 }), // Max is 2
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Maximum 2 plus ones allowed")
  })

  it("should return 400 when at capacity", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...mockEvent,
      rsvpCapacity: 100,
      rsvpCount: 100, // Already at capacity
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Event is at capacity")
  })

  it("should return 400 for duplicate RSVP", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
    mockPrisma.rsvp.findUnique.mockResolvedValue({
      id: "existing-rsvp",
      email: "guest@example.com",
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRsvpData),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("You have already RSVPd to this event")
  })

  it("should correctly calculate total guests with plus ones", async () => {
    mockPrisma.event.findUnique.mockResolvedValue({
      ...mockEvent,
      rsvpCapacity: 100,
      rsvpCount: 98, // Only 2 spots left
    })
    mockPrisma.rsvp.findUnique.mockResolvedValue(null)

    // Request with 2 plus ones (3 total) should fail
    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validRsvpData, plusOnes: 2 }),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Event is at capacity")
  })

  it("should allow RSVP without Turnstile token", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
    mockPrisma.rsvp.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        rsvp: {
          create: vi.fn().mockResolvedValue({ id: "rsvp-123" }),
        },
        event: {
          update: vi.fn().mockResolvedValue({}),
        },
      })
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Guest",
        email: "guest@example.com",
        // No turnstileToken
      }),
    })

    const response = await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })

    expect(response.status).toBe(200)
    expect(mockVerifyTurnstile).not.toHaveBeenCalled()
  })

  it("should normalize email to lowercase", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(mockEvent)
    mockPrisma.rsvp.findUnique.mockResolvedValue(null)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const mockTx = {
        rsvp: {
          create: vi.fn().mockResolvedValue({ id: "rsvp-123" }),
        },
        event: {
          update: vi.fn().mockResolvedValue({}),
        },
      }
      return fn(mockTx)
    })

    const request = new Request("http://localhost:3000/api/events/event-123/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validRsvpData,
        email: "GUEST@Example.COM",
      }),
    })

    await POST(request, { params: Promise.resolve({ eventId: "event-123" }) })

    // Check the rsvp.findUnique was called with lowercase email
    expect(mockPrisma.rsvp.findUnique).toHaveBeenCalledWith({
      where: {
        eventId_email: {
          eventId: "event-123",
          email: "guest@example.com",
        },
      },
    })
  })
})
