import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import QRCodeStyling from "qr-code-styling"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const { searchParams } = new URL(req.url)
    const size = parseInt(searchParams.get("size") || "300")

    // Get ticket to check if it's a test ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, isTestTicket: true },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
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

    return new NextResponse(buffer, {
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
