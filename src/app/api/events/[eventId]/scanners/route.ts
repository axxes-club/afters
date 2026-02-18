import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { generateScannerCode } from "@/lib/scanner-auth"
import { sendScannerCredentialsEmail } from "@/lib/email"

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

async function verifyEventOwnership(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true },
  })
  if (!event || event.organizer.userId !== userId) return null
  return event
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const event = await verifyEventOwnership(eventId, userId)
    if (!event) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const scanners = await prisma.eventScanner.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { scanLogs: true, shifts: true },
        },
      },
    })

    return NextResponse.json({ scanners })
  } catch (error) {
    console.error("Get scanners error:", error)
    return NextResponse.json(
      { error: "Failed to fetch scanners" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const userId = await getEffectiveUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params
    const event = await verifyEventOwnership(eventId, userId)
    if (!event) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { name, email, sendEmail: shouldSendEmail } = await req.json()
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Scanner name must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Validate email format if provided
    const trimmedEmail = email?.trim() || null
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Generate unique code with retry
    let code: string = ""
    let attempts = 0
    do {
      code = generateScannerCode()
      const existing = await prisma.eventScanner.findUnique({
        where: { eventId_code: { eventId, code } },
      })
      if (!existing) break
      attempts++
    } while (attempts < 10)

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique code. Please try again." },
        { status: 500 }
      )
    }

    // Create scanner with optional email
    const scanner = await prisma.eventScanner.create({
      data: { 
        eventId, 
        name: name.trim(), 
        code,
        email: trimmedEmail,
        emailSentAt: null,
      },
    })

    // Send credentials email if email provided and sendEmail is true
    let emailSent = false
    let emailError: string | undefined

    if (trimmedEmail && shouldSendEmail !== false) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://afters.am"
      const scanUrl = `${baseUrl}/scan/${eventId}`
      const eventDate = formatEventDate(event.startsAt)
      
      const result = await sendScannerCredentialsEmail({
        to: trimmedEmail,
        scannerName: name.trim(),
        eventTitle: event.title,
        eventDate,
        eventVenue: event.venueName,
        scannerCode: code,
        scanUrl,
      })

      if (result.success) {
        emailSent = true
        // Update scanner with emailSentAt timestamp
        await prisma.eventScanner.update({
          where: { id: scanner.id },
          data: { emailSentAt: new Date() },
        })
      } else {
        emailError = "Failed to send email, but scanner was created"
        console.error("Failed to send scanner credentials email:", result.error)
      }
    }

    return NextResponse.json({ 
      scanner: {
        ...scanner,
        emailSentAt: emailSent ? new Date() : null,
      },
      emailSent,
      emailError,
    })
  } catch (error) {
    console.error("Create scanner error:", error)
    return NextResponse.json(
      { error: "Failed to create scanner" },
      { status: 500 }
    )
  }
}
