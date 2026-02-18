import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import QRCodeStyling from "qr-code-styling"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { userId } = await auth()
    const { ticketId } = await params
    const { searchParams } = new URL(req.url)
    const size = parseInt(searchParams.get("size") || "300")

    // Get ticket with order info to verify ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        isTestTicket: true,
        userId: true,
        order: {
          select: {
            email: true,
            userId: true,
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Security: Verify ticket ownership
    // Allow if: logged in user owns the ticket, or matches order userId
    const isOwner = userId && (
      ticket.userId === userId ||
      ticket.order?.userId === userId
    )

    // For test tickets, also allow event organizers (they need to test scanning)
    // For non-test tickets, only the owner can access the QR
    if (!isOwner && !ticket.isTestTicket) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isTest = ticket.isTestTicket

    // Generate branded QR code
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: ticketId,
      dotsOptions: {
        color: isTest ? "#ff8c00" : "#ffffff", // Orange for test, white for real
        type: "rounded",
      },
      cornersSquareOptions: {
        color: "#ff1493", // Hot pink corners
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#ff1493",
        type: "dot",
      },
      backgroundOptions: {
        color: "#000000", // Black background
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10,
      },
    })

    const rawData = await qrCode.getRawData("png")
    if (!rawData) {
      return NextResponse.json(
        { error: "Failed to generate QR code" },
        { status: 500 }
      )
    }

    // Handle both Blob and Buffer types
    let buffer: Buffer
    if (Buffer.isBuffer(rawData)) {
      buffer = rawData
    } else {
      // It's a Blob
      const blob = rawData as Blob
      buffer = Buffer.from(await blob.arrayBuffer())
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("QR generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    )
  }
}
