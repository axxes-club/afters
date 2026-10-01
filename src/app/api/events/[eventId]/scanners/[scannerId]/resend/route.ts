import { getOrganizerContext } from "@/lib/organizer-context";
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { sendScannerCredentialsEmail } from "@/lib/email"

function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) + " at " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

// In-memory rate limiting for resend (max 3 per scanner per hour)
const resendRateLimits = new Map<string, { count: number; resetAt: number }>()
const MAX_RESENDS_PER_HOUR = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkResendRateLimit(scannerId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = resendRateLimits.get(scannerId)

  // Clean up expired records
  if (record && now > record.resetAt) {
    resendRateLimits.delete(scannerId)
  }

  const currentRecord = resendRateLimits.get(scannerId)

  if (!currentRecord) {
    resendRateLimits.set(scannerId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: MAX_RESENDS_PER_HOUR - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (currentRecord.count >= MAX_RESENDS_PER_HOUR) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: currentRecord.resetAt - now 
    }
  }

  currentRecord.count++
  return { 
    allowed: true, 
    remaining: MAX_RESENDS_PER_HOUR - currentRecord.count, 
    resetIn: currentRecord.resetAt - now 
  }
}

async function verifyScanner(
  eventId: string,
  scannerId: string,
  userId: string
) {
  const scanner = await prisma.eventScanner.findUnique({
    where: { id: scannerId },
    include: { event: { include: { organizer: true } } },
  })
  const workspace = await getOrganizerContext("staff.manage");
  if (
    !scanner ||
    workspace?.userId !== userId ||
    scanner.eventId !== eventId ||
    scanner.event.organizerId !== workspace?.profile.id
  ) {
    return null
  }
  return scanner
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; scannerId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId, scannerId } = await params
    const scanner = await verifyScanner(eventId, scannerId, userId)
    if (!scanner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if scanner has an email
    if (!scanner.email) {
      return NextResponse.json(
        { error: "Scanner does not have an email address" },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimit = checkResendRateLimit(scannerId)
    if (!rateLimit.allowed) {
      const resetInMinutes = Math.ceil(rateLimit.resetIn / 60000)
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. You can resend again in ${resetInMinutes} minute(s).`,
          resetIn: rateLimit.resetIn,
        },
        { status: 429 }
      )
    }

    // Send credentials email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://afters.am"
    const scanUrl = `${baseUrl}/scan/${eventId}`
    const eventDate = formatEventDate(scanner.event.startsAt)
    
    const result = await sendScannerCredentialsEmail({
      to: scanner.email,
      scannerName: scanner.name,
      eventTitle: scanner.event.title,
      eventDate,
      eventVenue: scanner.event.venueName,
      scannerCode: scanner.code,
      scanUrl,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      )
    }

    // Update scanner with emailSentAt timestamp
    const updated = await prisma.eventScanner.update({
      where: { id: scannerId },
      data: { emailSentAt: new Date() },
    })

    return NextResponse.json({ 
      success: true,
      scanner: updated,
      remaining: rateLimit.remaining,
    })
  } catch (error) {
    console.error("Resend scanner credentials error:", error)
    return NextResponse.json(
      { error: "Failed to resend credentials" },
      { status: 500 }
    )
  }
}
