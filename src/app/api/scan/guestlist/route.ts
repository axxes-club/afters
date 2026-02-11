import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getScannerSession } from "@/lib/scanner-auth"

// GET - Search guestlist entries for scanner
export async function GET(req: NextRequest) {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const entries = await prisma.guestlistEntry.findMany({
      where: {
        eventId: session.eventId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: [
        { checkedInAt: "asc" }, // Unchecked first
        { name: "asc" },
      ],
      take: 50,
    })

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        plusOnes: e.plusOnes,
        notes: e.notes,
        checkedIn: !!e.checkedInAt,
        checkedInAt: e.checkedInAt,
      })),
    })
  } catch (error) {
    console.error("Failed to get guestlist:", error)
    return NextResponse.json(
      { error: "Failed to get guestlist" },
      { status: 500 }
    )
  }
}

// POST - Check in a guestlist entry
export async function POST(req: NextRequest) {
  try {
    const session = await getScannerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { entryId } = await req.json()

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID required", valid: false },
        { status: 400 }
      )
    }

    // Find the entry
    const entry = await prisma.guestlistEntry.findFirst({
      where: {
        id: entryId,
        eventId: session.eventId,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Guest not found", valid: false },
        { status: 404 }
      )
    }

    if (entry.checkedInAt) {
      return NextResponse.json({
        valid: false,
        result: "ALREADY_CHECKED_IN",
        error: "Already checked in",
        entry: {
          name: entry.name,
          plusOnes: entry.plusOnes,
          checkedInAt: entry.checkedInAt,
        },
      })
    }

    // Check them in
    const updated = await prisma.guestlistEntry.update({
      where: { id: entryId },
      data: {
        checkedInAt: new Date(),
        checkedInBy: session.scannerId,
      },
    })

    return NextResponse.json({
      valid: true,
      message: `${entry.name} checked in${entry.plusOnes > 0 ? ` (+${entry.plusOnes})` : ""}`,
      entry: {
        name: updated.name,
        plusOnes: updated.plusOnes,
        notes: updated.notes,
        checkedInAt: updated.checkedInAt,
      },
    })
  } catch (error) {
    console.error("Failed to check in guest:", error)
    return NextResponse.json(
      { error: "Check-in failed", valid: false },
      { status: 500 }
    )
  }
}
