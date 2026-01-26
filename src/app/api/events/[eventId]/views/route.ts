import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// POST /api/events/[eventId]/views - Track event page view
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const headersList = await headers()
    
    // Get visitor info
    const userAgent = headersList.get("user-agent") || undefined
    const referrer = headersList.get("referer") || undefined
    
    // Get visitor ID from request body (client-side fingerprint)
    let visitorId: string | undefined
    try {
      const body = await request.json()
      visitorId = body.visitorId
    } catch {
      // No body or invalid JSON - that's fine
    }
    
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
    // This prevents refresh spam
    if (visitorId) {
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
        // Already tracked this visitor recently
        return NextResponse.json({ tracked: false, reason: "duplicate" })
      }
    }
    
    // Create view record
    await prisma.eventView.create({
      data: {
        eventId,
        visitorId,
        userAgent,
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
