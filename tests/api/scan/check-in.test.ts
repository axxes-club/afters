import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Hoist mocks to avoid initialization errors
const { mockPrisma, mockGetScannerSession, mockCookies } = vi.hoisted(() => {
  const mockPrisma = {
    eventScanner: {
      findUnique: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    scanLog: {
      create: vi.fn(),
    },
  }
  const mockGetScannerSession = vi.fn()
  const mockCookies = vi.fn()
  return { mockPrisma, mockGetScannerSession, mockCookies }
})

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/scanner-auth", () => ({
  getScannerSession: mockGetScannerSession,
}))

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}))

import { POST } from "@/app/api/scan/check-in/route"

describe("Scanner Check-in API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies.mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    })
  })

  const mockSession = {
    scannerId: "scanner-123",
    eventId: "event-123",
    name: "Door Scanner",
  }

  const mockTicket = {
    id: "ticket-123",
    ticketNumber: "TK-ABC123",
    eventId: "event-123",
    status: "ACTIVE",
    checkedInAt: null,
    isTestTicket: false,
    event: {
      id: "event-123",
      title: "Test Event",
    },
    ticketTier: {
      id: "tier-1",
      name: "General Admission",
    },
    order: {
      guestName: "Test Guest",
      email: "guest@example.com",
    },
    user: null,
  }

  describe("POST /api/scan/check-in", () => {
    it("should check in a valid ticket", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket)
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      })
      mockPrisma.scanLog.create.mockResolvedValue({})

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.result).toBe("SUCCESS")
      expect(data.message).toBe("Check-in successful!")
      expect(data.ticket.ticketNumber).toBe("TK-ABC123")
      expect(data.ticket.tierName).toBe("General Admission")
    })

    it("should return 401 if scanner session expired", async () => {
      mockGetScannerSession.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
      expect(data.error).toContain("session expired")
    })

    it("should return 403 if scanner deactivated", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: false,
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.valid).toBe(false)
      expect(data.error).toContain("deactivated")
    })

    it("should return 400 if ticketId missing", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe("Ticket ID required")
    })

    it("should return 404 if ticket not found", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "nonexistent" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.valid).toBe(false)
      expect(data.result).toBe("INVALID_TICKET")
    })

    it("should return 403 if ticket is for wrong event", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        eventId: "different-event",
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.valid).toBe(false)
      expect(data.result).toBe("WRONG_EVENT")
    })

    it("should return already checked in status", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        status: "CHECKED_IN",
        checkedInAt: new Date("2025-01-15T20:00:00Z"),
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(false)
      expect(data.result).toBe("ALREADY_CHECKED_IN")
      expect(data.ticket.checkedInAt).toBeDefined()
    })

    it("should reject cancelled ticket", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        status: "CANCELLED",
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(false)
      expect(data.result).toBe("CANCELLED_TICKET")
    })

    it("should reject refunded ticket", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        status: "REFUNDED",
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(false)
      expect(data.result).toBe("CANCELLED_TICKET")
    })

    it("should handle demo tickets", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "demo-123456" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.result).toBe("SUCCESS")
      expect(data.message).toBe("Demo check-in successful!")
      expect(data.ticket.isTestTicket).toBe(true)
    })

    it("should show test ticket warning on check-in", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        isTestTicket: true,
      })
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        isTestTicket: true,
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.message).toContain("TEST TICKET")
      expect(data.ticket.isTestTicket).toBe(true)
    })

    it("should skip scanner validation for organizer sessions", async () => {
      mockGetScannerSession.mockResolvedValue({
        ...mockSession,
        scannerId: "organizer-user-123",
      })
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket)
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      // Scanner validation should be skipped for organizer sessions
      expect(mockPrisma.eventScanner.findUnique).not.toHaveBeenCalled()
    })

    it("should log scan attempts", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue(mockTicket)
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      })
      mockPrisma.scanLog.create.mockResolvedValue({})

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      await POST(request)

      expect(mockPrisma.scanLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scannerId: "scanner-123",
          eventId: "event-123",
          ticketId: "ticket-123",
          result: "SUCCESS",
        }),
      })
    })

    it("should return holder name from user if available", async () => {
      mockGetScannerSession.mockResolvedValue(mockSession)
      mockPrisma.eventScanner.findUnique.mockResolvedValue({
        id: "scanner-123",
        isActive: true,
      })
      mockPrisma.ticket.findUnique.mockResolvedValue({
        ...mockTicket,
        user: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      })
      mockPrisma.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      })

      const request = new NextRequest("http://localhost:3000/api/scan/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: "ticket-123" }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.ticket.holderName).toBe("John Doe")
    })
  })
})
