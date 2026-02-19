import { describe, it, expect, vi, beforeEach } from "vitest"
import { headers } from "next/headers"

// Hoist local prisma mock — global setup lacks event.findFirst and eventView
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    event: { findFirst: vi.fn() },
    eventView: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  }
  return { mockPrisma }
})

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { POST, viewRateLimitMap } from "@/app/api/events/[eventId]/views/route"

const mockEvent = { id: "event-123", isPublished: true }

function setHeaders(ip = "1.2.3.4", ua = "TestAgent/1.0", referer?: string) {
  const map: Record<string, string | null> = {
    "x-forwarded-for": ip,
    "user-agent": ua,
    referer: referer ?? null,
  }
  vi.mocked(headers).mockResolvedValue({ get: (k: string) => map[k] ?? null } as Awaited<ReturnType<typeof headers>>)
}

function makeRequest(body?: object) {
  return new Request("http://localhost/api/events/event-123/views", {
    method: "POST",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  })
}

describe("View tracking API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    viewRateLimitMap.clear()
    setHeaders()
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent)
    mockPrisma.eventView.findFirst.mockResolvedValue(null)
    mockPrisma.eventView.create.mockResolvedValue({})
  })

  const params = { params: Promise.resolve({ eventId: "event-123" }) }

  it("tracks a view for a published event", async () => {
    const res = await POST(makeRequest(), params)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tracked).toBe(true)
    expect(mockPrisma.eventView.create).toHaveBeenCalledOnce()
  })

  it("returns 404 for non-existent or unpublished event", async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null)

    const res = await POST(makeRequest(), params)

    expect(res.status).toBe(404)
    expect(mockPrisma.eventView.create).not.toHaveBeenCalled()
  })

  it("deduplicates — returns tracked:false when same fingerprint viewed in last hour", async () => {
    mockPrisma.eventView.findFirst.mockResolvedValue({ id: "view-1" })

    const res = await POST(makeRequest(), params)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tracked).toBe(false)
    expect(data.reason).toBe("duplicate")
    expect(mockPrisma.eventView.create).not.toHaveBeenCalled()
  })

  it("uses a server-generated SHA-256 fingerprint, not the client-supplied visitorId", async () => {
    await POST(makeRequest({ visitorId: "client-supplied-id-xyz" }), params)

    const callArg = mockPrisma.eventView.create.mock.calls[0][0]
    expect(callArg.data.visitorId).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    expect(callArg.data.visitorId).not.toBe("client-supplied-id-xyz")
  })

  it("produces the same fingerprint for repeated requests from the same IP+UA", async () => {
    await POST(makeRequest(), params)
    const first = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    vi.clearAllMocks()
    viewRateLimitMap.clear()
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent)
    mockPrisma.eventView.findFirst.mockResolvedValue(null)
    mockPrisma.eventView.create.mockResolvedValue({})

    await POST(makeRequest(), params)
    const second = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    expect(first).toBe(second)
  })

  it("produces different fingerprints for different IPs", async () => {
    setHeaders("1.1.1.1")
    await POST(makeRequest(), params)
    const first = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    vi.clearAllMocks()
    viewRateLimitMap.clear()
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent)
    mockPrisma.eventView.findFirst.mockResolvedValue(null)
    mockPrisma.eventView.create.mockResolvedValue({})

    setHeaders("2.2.2.2")
    await POST(makeRequest(), params)
    const second = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    expect(first).not.toBe(second)
  })

  it("produces different fingerprints for different user-agents", async () => {
    setHeaders("1.2.3.4", "Chrome/120")
    await POST(makeRequest(), params)
    const first = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    vi.clearAllMocks()
    viewRateLimitMap.clear()
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent)
    mockPrisma.eventView.findFirst.mockResolvedValue(null)
    mockPrisma.eventView.create.mockResolvedValue({})

    setHeaders("1.2.3.4", "Firefox/121")
    await POST(makeRequest(), params)
    const second = mockPrisma.eventView.create.mock.calls[0][0].data.visitorId

    expect(first).not.toBe(second)
  })

  it("rate limits at 5 requests/IP/minute — 6th returns 429", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest(), params)
      expect(res.status).not.toBe(429)
    }

    const res = await POST(makeRequest(), params)
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.reason).toBe("rate_limited")
  })

  it("rate limits per IP — a different IP is not affected by another's limit", async () => {
    setHeaders("10.0.0.1")
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest(), params)
    }

    setHeaders("10.0.0.2")
    const res = await POST(makeRequest(), params)

    expect(res.status).not.toBe(429)
  })

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (k: string) => {
        if (k === "x-real-ip") return "5.5.5.5"
        if (k === "user-agent") return "TestAgent/1.0"
        return null
      },
    } as Awaited<ReturnType<typeof headers>>)

    const res = await POST(makeRequest(), params)
    expect(res.status).toBe(200)
    expect(mockPrisma.eventView.create).toHaveBeenCalledOnce()
  })

  it("stores referrer from request headers", async () => {
    setHeaders("1.2.3.4", "TestAgent/1.0", "https://instagram.com")

    await POST(makeRequest(), params)

    expect(mockPrisma.eventView.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ referrer: "https://instagram.com" }),
      })
    )
  })
})
