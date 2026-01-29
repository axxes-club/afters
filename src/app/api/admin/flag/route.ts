import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth-utils"

// Flag or unflag an entity (event or user)
export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin()

    const body = await request.json()
    const { entityType, entityId, flag, reason } = body

    if (!entityType || !entityId || typeof flag !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (entityType === "event") {
      const event = await prisma.event.update({
        where: { id: entityId },
        data: {
          isFlagged: flag,
          flaggedAt: flag ? new Date() : null,
          flaggedBy: flag ? admin.id : null,
          flagReason: flag ? reason : null,
        }
      })
      return NextResponse.json({ success: true, event })
    }

    if (entityType === "user") {
      const user = await prisma.user.update({
        where: { id: entityId },
        data: {
          isFlagged: flag,
          flaggedAt: flag ? new Date() : null,
          flaggedBy: flag ? admin.id : null,
          flagReason: flag ? reason : null,
        }
      })
      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 })
  } catch (error) {
    console.error("Error flagging entity:", error)
    return NextResponse.json({ error: "Failed to flag entity" }, { status: 500 })
  }
}

// Get flagged items
export async function GET(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("type")

    if (entityType === "events") {
      const events = await prisma.event.findMany({
        where: { isFlagged: true },
        include: {
          organizer: {
            select: { displayName: true, slug: true }
          },
          _count: { select: { tickets: true } }
        },
        orderBy: { flaggedAt: "desc" }
      })
      return NextResponse.json({ events })
    }

    if (entityType === "users") {
      const users = await prisma.user.findMany({
        where: { isFlagged: true },
        include: {
          organizerProfile: true,
          artistProfile: true,
          personalProfile: true,
        },
        orderBy: { flaggedAt: "desc" }
      })
      return NextResponse.json({ users })
    }

    // Return both
    const [events, users] = await Promise.all([
      prisma.event.findMany({
        where: { isFlagged: true },
        include: {
          organizer: { select: { displayName: true, slug: true } },
          _count: { select: { tickets: true } }
        },
        orderBy: { flaggedAt: "desc" }
      }),
      prisma.user.findMany({
        where: { isFlagged: true },
        include: {
          organizerProfile: true,
          artistProfile: true,
          personalProfile: true,
        },
        orderBy: { flaggedAt: "desc" }
      })
    ])

    return NextResponse.json({ events, users })
  } catch (error) {
    console.error("Error fetching flagged items:", error)
    return NextResponse.json({ error: "Failed to fetch flagged items" }, { status: 500 })
  }
}
