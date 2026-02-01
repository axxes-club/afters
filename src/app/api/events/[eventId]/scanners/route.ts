import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getEffectiveUserId } from "@/lib/auth-utils"
import { generateScannerCode } from "@/lib/scanner-auth"

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

    const { name } = await req.json()
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Scanner name must be at least 2 characters" },
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

    const scanner = await prisma.eventScanner.create({
      data: { eventId, name: name.trim(), code },
    })

    return NextResponse.json({ scanner })
  } catch (error) {
    console.error("Create scanner error:", error)
    return NextResponse.json(
      { error: "Failed to create scanner" },
      { status: 500 }
    )
  }
}
