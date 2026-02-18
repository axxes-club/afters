import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
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

async function verifyScanner(
  eventId: string,
  scannerId: string,
  userId: string
) {
  const scanner = await prisma.eventScanner.findUnique({
    where: { id: scannerId },
    include: { event: { include: { organizer: true } } },
  })
  if (
    !scanner ||
    scanner.eventId !== eventId ||
    scanner.event.organizer.userId !== userId
  ) {
    return null
  }
  return scanner
}

export async function PATCH(
  req: NextRequest,
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

    const { isActive, name, email, sendEmail: shouldSendEmail } = await req.json()

    // Validate email format if provided
    let trimmedEmail: string | null | undefined = undefined
    if (email !== undefined) {
      trimmedEmail = email?.trim() || null
      if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.eventScanner.update({
      where: { id: scannerId },
      data: {
        ...(typeof isActive === "boolean" && { isActive }),
        ...(name && { name: name.trim() }),
        ...(trimmedEmail !== undefined && { email: trimmedEmail }),
      },
    })

    // Send credentials email if email changed and sendEmail is true
    let emailSent = false
    let emailError: string | undefined

    if (trimmedEmail && shouldSendEmail === true) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://afters.am"
      const scanUrl = `${baseUrl}/scan/${eventId}`
      const eventDate = formatEventDate(scanner.event.startsAt)
      
      const result = await sendScannerCredentialsEmail({
        to: trimmedEmail,
        scannerName: updated.name,
        eventTitle: scanner.event.title,
        eventDate,
        eventVenue: scanner.event.venueName,
        scannerCode: updated.code,
        scanUrl,
      })

      if (result.success) {
        emailSent = true
        // Update scanner with emailSentAt timestamp
        await prisma.eventScanner.update({
          where: { id: scannerId },
          data: { emailSentAt: new Date() },
        })
      } else {
        emailError = "Failed to send email"
        console.error("Failed to send scanner credentials email:", result.error)
      }
    }

    return NextResponse.json({ 
      scanner: {
        ...updated,
        emailSentAt: emailSent ? new Date() : updated.emailSentAt,
      },
      emailSent,
      emailError,
    })
  } catch (error) {
    console.error("Update scanner error:", error)
    return NextResponse.json(
      { error: "Failed to update scanner" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.eventScanner.delete({ where: { id: scannerId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete scanner error:", error)
    return NextResponse.json(
      { error: "Failed to delete scanner" },
      { status: 500 }
    )
  }
}
