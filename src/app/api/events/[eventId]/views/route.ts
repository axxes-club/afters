import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import crypto from "crypto"
import { checkViewRateLimit } from "@/lib/view-rate-limit"

// POST /api/events/[eventId]/views - Track event page view
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const headersList = await headers()

    // Get visitor info
    const userAgent = headersList.get("user-agent") || ""
    const referrer = headersList.get("referer") || undefined

    // Extract IP for rate limiting and fingerprinting
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown"

    // Rate limit by IP
    if (!checkViewRateLimit(ip)) {
      return NextResponse.json(
        { tracked: false, reason: "rate_limited" },
        { status: 429 }
      )
    }

    // Server-side fingerprint: hash IP + user-agent for dedup
    const visitorId = crypto
      .createHash("sha256")
      .update(`${ip}:${userAgent}`)
      .digest("hex")

    // Verify event exists and is published
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        isPublished: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check for duplicate views from same visitor in last hour
    const recentView = await prisma.eventView.findFirst({
      where: {
        eventId,
        visitorId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    })

    if (recentView) {
      return NextResponse.json({ tracked: false, reason: "duplicate" })
    }

    // Create view record
    await prisma.eventView.create({
      data: {
        eventId,
        visitorId,
        userAgent: userAgent || undefined,
        referrer,
      },
    })

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error("View tracking error:", error)
    // Silently fail - don't break the page for analytics
    return NextResponse.json({ tracked: false, error: "Failed to track" })
  }
}
