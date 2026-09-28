import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import {
  buildTicketPass,
  getAppleWalletConfig,
  PKPASS_CONTENT_TYPE,
  verifyWalletToken,
} from "@/lib/apple-wallet"

// Apple Wallet pass download.
// Access: a signed `token` (emailed / shown on the order page, works for guest checkout)
// or a signed-in user who owns the ticket.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const token = request.nextUrl.searchParams.get("token")

    const config = getAppleWalletConfig()
    if (!config) {
      return NextResponse.json(
        { error: "Apple Wallet is not configured" },
        { status: 501 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketTier: { select: { name: true } },
        order: { select: { orderNumber: true, guestName: true, userId: true, status: true } },
        event: {
          select: {
            title: true,
            slug: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            venueName: true,
            venueAddress: true,
            city: true,
            state: true,
            accentColor: true,
            ageRestriction: true,
            mapLat: true,
            mapLng: true,
            organizer: { select: { displayName: true } },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    let authorized = verifyWalletToken(ticket.id, token)
    if (!authorized) {
      const { userId } = await auth()
      authorized = !!userId && (ticket.userId === userId || ticket.order.userId === userId)
    }
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (ticket.status !== "VALID" || ticket.order.status !== "PAID") {
      return NextResponse.json(
        { error: "Ticket is not valid for wallet" },
        { status: 400 }
      )
    }

    const buffer = buildTicketPass(ticket, config)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": PKPASS_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${ticket.ticketNumber}.pkpass"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("Wallet pass generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate wallet pass" },
      { status: 500 }
    )
  }
}
