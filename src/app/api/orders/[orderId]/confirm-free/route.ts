import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTicketPDF } from "@/lib/pdf-ticket"
import { sendEmail, generateTicketEmailHtml } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    const { orderId } = await params

    if (!userId || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            ticketTier: true,
          },
        },
        event: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Verify order is pending
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: "Order already processed" },
        { status: 400 }
      )
    }

    // Verify order total is $0 (free tickets only)
    if (order.total !== 0) {
      return NextResponse.json(
        { message: "This endpoint is only for free orders" },
        { status: 400 }
      )
    }

    // Update order to PAID status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
      include: {
        items: {
          include: {
            ticketTier: true,
          },
        },
        event: true,
        user: true,
      },
    })

    const createdTickets = []

    // Generate tickets for each order item
    for (const item of updatedOrder.items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            orderId: updatedOrder.id,
            eventId: updatedOrder.eventId,
            ticketTierId: item.ticketTierId,
            userId: updatedOrder.userId,
          },
        })

        createdTickets.push({
          ticketNumber: ticket.ticketNumber,
          ticketId: ticket.id,
          tierName: item.ticketTier.name,
          eventTitle: updatedOrder.event.title,
          eventDate: new Date(updatedOrder.event.startsAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          venueName: updatedOrder.event.venueName,
          venueAddress: `${updatedOrder.event.venueAddress}, ${updatedOrder.event.city}${updatedOrder.event.state ? `, ${updatedOrder.event.state}` : ''}`,
          holderName: updatedOrder.user.firstName && updatedOrder.user.lastName
            ? `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`
            : undefined,
          isTestTicket: false,
        })
      }

      // Update ticket tier sold count
      await prisma.ticketTier.update({
        where: { id: item.ticketTierId },
        data: {
          quantitySold: {
            increment: item.quantity,
          },
        },
      })
    }

    // Generate PDF and send email
    try {
      const pdfBuffer = await generateTicketPDF(createdTickets)

      const emailHtml = generateTicketEmailHtml({
        eventTitle: updatedOrder.event.title,
        eventDate: new Date(updatedOrder.event.startsAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        venueName: updatedOrder.event.venueName,
        venueAddress: `${updatedOrder.event.venueAddress}, ${updatedOrder.event.city}${updatedOrder.event.state ? `, ${updatedOrder.event.state}` : ''}`,
        ticketCount: createdTickets.length,
        orderNumber: updatedOrder.orderNumber,
      })

      await sendEmail({
        to: updatedOrder.email,
        subject: `Your Tickets for ${updatedOrder.event.title}`,
        html: emailHtml,
        attachments: [{
          filename: `tickets-${updatedOrder.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }],
      })

      console.log(`Sent ${createdTickets.length} free tickets to ${updatedOrder.email}`)
    } catch (emailError) {
      console.error('Failed to send ticket email:', emailError)
      // Don't fail the request - tickets are still created
    }

    return NextResponse.json({ success: true, orderId: updatedOrder.id })
  } catch (error) {
    console.error("Error confirming free order:", error)
    return NextResponse.json(
      { message: "Failed to confirm free order" },
      { status: 500 }
    )
  }
}
