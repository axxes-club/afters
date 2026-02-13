import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

interface TicketData {
  ticketNumber: string
  ticketId: string
  tierName: string
  eventTitle: string
  eventDate: string
  venueName: string
  venueAddress: string
  holderName?: string
  isTestTicket?: boolean
}

export async function generateTicketPDF(tickets: TicketData[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const ticket of tickets) {
    // Create a page for each ticket (A6-ish size, good for mobile)
    const page = pdfDoc.addPage([400, 600])
    const { width, height } = page.getSize()

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0, 0, 0),
    })

    // Hot pink accent bar at top
    page.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(1, 0.08, 0.58), // #ff1493
    })

    // Logo dot
    page.drawText(".", {
      x: 20,
      y: height - 42,
      size: 36,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Test ticket warning
    if (ticket.isTestTicket) {
      page.drawRectangle({
        x: 0,
        y: height - 90,
        width,
        height: 30,
        color: rgb(1, 0.55, 0), // orange
      })
      page.drawText("⚠ TEST TICKET - NOT VALID FOR ENTRY", {
        x: 60,
        y: height - 82,
        size: 11,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
    }

    // Event Title
    const titleY = ticket.isTestTicket ? height - 130 : height - 100
    page.drawText(ticket.eventTitle.substring(0, 30), {
      x: 20,
      y: titleY,
      size: 20,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })

    // Ticket Type
    page.drawText(ticket.tierName, {
      x: 20,
      y: titleY - 25,
      size: 14,
      font: helvetica,
      color: rgb(1, 0.08, 0.58),
    })

    // Event Details
    const detailsY = titleY - 60
    page.drawText("DATE", {
      x: 20,
      y: detailsY,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(ticket.eventDate, {
      x: 20,
      y: detailsY - 15,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })

    page.drawText("VENUE", {
      x: 20,
      y: detailsY - 45,
      size: 10,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(ticket.venueName.substring(0, 35), {
      x: 20,
      y: detailsY - 60,
      size: 12,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    })
    page.drawText(ticket.venueAddress.substring(0, 40), {
      x: 20,
      y: detailsY - 75,
      size: 10,
      font: helvetica,
      color: rgb(0.7, 0.7, 0.7),
    })

    // Holder name if available
    if (ticket.holderName) {
      page.drawText("ATTENDEE", {
        x: 20,
        y: detailsY - 105,
        size: 10,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
      page.drawText(ticket.holderName.substring(0, 30), {
        x: 20,
        y: detailsY - 120,
        size: 12,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      })
    }

    // Generate QR code
    const qrDataUrl = await QRCode.toDataURL(ticket.ticketId, {
      width: 180,
      margin: 0,
      color: {
        dark: "#ffffff",
        light: "#000000",
      },
    })

    // Embed QR code
    const qrImage = await pdfDoc.embedPng(qrDataUrl)
    const qrSize = 160
    page.drawImage(qrImage, {
      x: (width - qrSize) / 2,
      y: 100,
      width: qrSize,
      height: qrSize,
    })

    // Ticket number below QR
    page.drawText(`#${ticket.ticketNumber}`, {
      x: (width - helveticaBold.widthOfTextAtSize(`#${ticket.ticketNumber}`, 12)) / 2,
      y: 75,
      size: 12,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    })

    // Footer
    page.drawText("Scan QR code at the door", {
      x: (width - helvetica.widthOfTextAtSize("Scan QR code at the door", 10)) / 2,
      y: 40,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Dashed line (ticket tear line effect)
    const dashY = 280
    for (let x = 10; x < width - 10; x += 10) {
      page.drawLine({
        start: { x, y: dashY },
        end: { x: x + 5, y: dashY },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2),
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
