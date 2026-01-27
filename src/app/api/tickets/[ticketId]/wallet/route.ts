import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { PKPass } from "passkit-generator"
import path from "path"
import fs from "fs"

// Apple Wallet pass generation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params

    // Fetch ticket with related data
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            organizer: true,
          },
        },
        ticketTier: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Verify ownership
    if (ticket.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (ticket.status !== "VALID") {
      return NextResponse.json(
        { error: "Ticket is not valid for wallet" },
        { status: 400 }
      )
    }

    // Check for Apple certificates
    const certsPath = path.join(process.cwd(), "certs")
    const signerCert = path.join(certsPath, "signerCert.pem")
    const signerKey = path.join(certsPath, "signerKey.pem")
    const wwdr = path.join(certsPath, "wwdr.pem")

    if (!fs.existsSync(signerCert) || !fs.existsSync(signerKey) || !fs.existsSync(wwdr)) {
      return NextResponse.json(
        { 
          error: "Apple Wallet certificates not configured",
          setup: "Place signerCert.pem, signerKey.pem, and wwdr.pem in /certs folder"
        }, 
        { status: 501 }
      )
    }

    const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID
    const teamIdentifier = process.env.APPLE_TEAM_ID

    if (!passTypeIdentifier || !teamIdentifier) {
      return NextResponse.json(
        { 
          error: "Missing APPLE_PASS_TYPE_ID or APPLE_TEAM_ID env vars"
        }, 
        { status: 501 }
      )
    }

    const eventDate = new Date(ticket.event.startsAt)

    // Create the pass
    const pass = new PKPass(
      {},
      {
        signerCert: fs.readFileSync(signerCert),
        signerKey: fs.readFileSync(signerKey),
        wwdr: fs.readFileSync(wwdr),
        signerKeyPassphrase: process.env.APPLE_CERT_PASSWORD || "",
      },
      {
        formatVersion: 1,
        serialNumber: ticket.id,
        passTypeIdentifier,
        teamIdentifier,
        organizationName: ticket.event.organizer.displayName,
        description: `Ticket for ${ticket.event.title}`,
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(236, 72, 153)", // pink-500
        labelColor: "rgb(255, 255, 255)",
        
        eventTicket: {
          primaryFields: [
            {
              key: "event",
              label: "EVENT",
              value: ticket.event.title,
            },
          ],
          secondaryFields: [
            {
              key: "date",
              label: "DATE",
              value: eventDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
            },
            {
              key: "time",
              label: "TIME",
              value: eventDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }),
            },
          ],
          auxiliaryFields: [
            {
              key: "tier",
              label: "TICKET TYPE",
              value: ticket.ticketTier.name,
            },
            {
              key: "venue",
              label: "VENUE",
              value: ticket.event.venueName,
            },
          ],
          backFields: [
            {
              key: "ticketNumber",
              label: "Ticket Number",
              value: ticket.ticketNumber,
            },
            {
              key: "address",
              label: "Address",
              value: `${ticket.event.venueName}\n${ticket.event.city}`,
            },
            {
              key: "terms",
              label: "Terms",
              value: "This ticket is non-transferable. Present QR code at entry.",
            },
          ],
        },

        barcode: {
          format: "PKBarcodeFormatQR",
          message: ticket.id,
          messageEncoding: "iso-8859-1",
        },

        barcodes: [
          {
            format: "PKBarcodeFormatQR",
            message: ticket.id,
            messageEncoding: "iso-8859-1",
          },
        ],

        relevantDate: ticket.event.startsAt.toISOString(),
      }
    )

    // Add icon (required)
    const iconPath = path.join(process.cwd(), "public", "icon.png")
    if (fs.existsSync(iconPath)) {
      pass.addBuffer("icon.png", fs.readFileSync(iconPath))
      pass.addBuffer("icon@2x.png", fs.readFileSync(iconPath))
    } else {
      // Create a simple 1x1 pink pixel as fallback
      const pinkPixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64"
      )
      pass.addBuffer("icon.png", pinkPixel)
      pass.addBuffer("icon@2x.png", pinkPixel)
    }

    // Generate the .pkpass file
    const buffer = pass.getAsBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${ticket.ticketNumber}.pkpass"`,
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
