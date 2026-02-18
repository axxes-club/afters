import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withApiAuth, apiError, type ApiContext } from "@/lib/api-middleware"

type RouteParams = { params: Promise<{ eventId: string }> }

// GET /api/v1/events/[eventId]/guestlist - List guestlist entries
async function getGuestlist(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params
  const { searchParams } = new URL(req.url)
  
  const status = searchParams.get("status") // pending, checked_in
  const search = searchParams.get("search")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const offset = parseInt(searchParams.get("offset") || "0")

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    select: { id: true, title: true },
  })

  if (!event) {
    return apiError("Event not found", 404)
  }

  // Build filters
  const statusFilter =
    status === "checked_in"
      ? { checkedInAt: { not: null } }
      : status === "pending"
        ? { checkedInAt: null }
        : {}

  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [entries, total] = await Promise.all([
    prisma.guestlistEntry.findMany({
      where: {
        eventId,
        ...statusFilter,
        ...searchFilter,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plusOnes: true,
        notes: true,
        addedBy: true,
        checkedInAt: true,
        checkedInBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.guestlistEntry.count({
      where: {
        eventId,
        ...statusFilter,
        ...searchFilter,
      },
    }),
  ])

  // Format entries
  const formattedEntries = entries.map((entry) => ({
    ...entry,
    status: entry.checkedInAt ? "checked_in" : "pending",
  }))

  return NextResponse.json({
    guestlist: formattedEntries,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + entries.length < total,
    },
  })
}

// POST /api/v1/events/[eventId]/guestlist - Add to guestlist
async function addToGuestlist(
  req: NextRequest,
  ctx: ApiContext,
  routeParams: RouteParams
) {
  const { eventId } = await routeParams.params

  const profile = await prisma.organizerProfile.findUnique({
    where: { userId: ctx.userId },
  })

  if (!profile) {
    return apiError("Organizer profile not found", 404)
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId: profile.id,
    },
    select: { id: true, title: true },
  })

  if (!event) {
    return apiError("Event not found", 404)
  }

  const body = await req.json()
  const { name, email, phone, plusOnes, notes } = body

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return apiError("Name is required")
  }

  // Check for duplicates by email if email is provided
  if (email) {
    const existing = await prisma.guestlistEntry.findFirst({
      where: {
        eventId,
        email: email.toLowerCase(),
      },
    })

    if (existing) {
      return apiError("A guest with this email is already on the guestlist", 409)
    }
  }

  const entry = await prisma.guestlistEntry.create({
    data: {
      eventId,
      name: name.trim(),
      email: email?.toLowerCase() || null,
      phone: phone || null,
      plusOnes: Math.max(0, parseInt(plusOnes) || 0),
      notes: notes || null,
      addedBy: ctx.authType === "api_key" ? "API" : "DASHBOARD",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      plusOnes: true,
      notes: true,
      addedBy: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    {
      ...entry,
      status: "pending",
    },
    { status: 201 }
  )
}

export async function GET(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => getGuestlist(r, ctx, routeParams),
    { requiredScopes: ["guestlist:read"], allowSession: true }
  )
  return handler(req)
}

export async function POST(req: NextRequest, routeParams: RouteParams) {
  const handler = withApiAuth(
    (r, ctx) => addToGuestlist(r, ctx, routeParams),
    { requiredScopes: ["guestlist:write"], allowSession: true }
  )
  return handler(req)
}
