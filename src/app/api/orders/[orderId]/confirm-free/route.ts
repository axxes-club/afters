import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTicketPDF } from "@/lib/pdf-ticket"
import { sendEmail, generateTicketEmailHtml, generateOrganizerSaleEmailHtml } from "@/lib/email"
import { notifyTicketSale } from "@/lib/push"
import { waitUntil } from "@vercel/functions"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await req.json().catch(() => ({}))
    const { email: confirmEmail } = body

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            ticketTier: true,
          },
        },
        event: true,
        user: true, // May be null for guest orders
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Security: Require email confirmation to verify ownership
    // The caller must know the email associated with the order
    if (!confirmEmail || confirmEmail.toLowerCase() !== order.email.toLowerCase()) {
      return NextResponse.json(
        { message: "Invalid confirmation" },
        { status: 403 }
      )
    }

    // Security: Prevent confirmation of stale orders (older than 1 hour)
    const orderAge = Date.now() - new Date(order.createdAt).getTime()
    const ONE_HOUR = 60 * 60 * 1000
    if (orderAge > ONE_HOUR) {
      return NextResponse.json(
        { message: "Order has expired. Please create a new order." },
        { status: 400 }
      )
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

    const createdTickets: Array<{
      ticketNumber: string
      ticketId: string
      tierName: string
      eventTitle: string
      eventDate: string
      venueName: string
      venueAddress: string
      holderName?: string
      isTestTicket: boolean
    }> = []

    // Generate tickets for each order item
    for (const item of updatedOrder.items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = `AFT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

        const ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            orderId: updatedOrder.id,
            eventId: updatedOrder.eventId,
            ticketTierId: item.ticketTierId,
            userId: updatedOrder.userId || null, // null for guest orders
          },
        })

        // Determine holder name - use guest name or user name
        const holderName = updatedOrder.guestName
          || (updatedOrder.user?.firstName && updatedOrder.user?.lastName
            ? `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`
            : undefined)

        const venueAddress = `${updatedOrder.event.venueAddress}, ${updatedOrder.event.city}${updatedOrder.event.state ? `, ${updatedOrder.event.state}` : ''}`

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
          venueAddress,
          holderName,
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

    // Generate PDF and send email in background using waitUntil
    // This allows us to return a response immediately while the email sends
    const venueAddress = `${updatedOrder.event.venueAddress}, ${updatedOrder.event.city}${updatedOrder.event.state ? `, ${updatedOrder.event.state}` : ''}`
    
    waitUntil(
      (async () => {
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
            venueAddress,
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

          // Notify organizer of the RSVP (push + email)
          const organizer = await prisma.organizerProfile.findFirst({
            where: { userId: updatedOrder.event.organizerId },
            include: { user: true },
          })

          if (organizer?.user) {
            // Send push notification to organizer (amount is 0 for free)
            await notifyTicketSale(
              organizer.userId,
              updatedOrder.event.title,
              createdTickets.length,
              0
            )

            // Check if organizer wants email notifications for RSVPs/sales
            const prefs = await prisma.notificationPreference.findUnique({
              where: { userId: organizer.userId },
            })

            if (!prefs || prefs.emailTicketSales) {
              const saleEmailHtml = generateOrganizerSaleEmailHtml({
                eventTitle: updatedOrder.event.title,
                ticketCount: createdTickets.length,
                amount: 0, // Free RSVP
                buyerEmail: updatedOrder.email,
                orderNumber: updatedOrder.orderNumber,
              })

              await sendEmail({
                to: organizer.user.email,
                subject: `🎟️ ${createdTickets.length} RSVP${createdTickets.length > 1 ? 's' : ''} for ${updatedOrder.event.title}`,
                html: saleEmailHtml,
              })

              console.log(`Notified organizer ${organizer.user.email} of RSVP`)
            }
          }
        } catch (emailError) {
          console.error('Failed to send ticket email:', emailError)
        }
      })()
    )

    // Return immediately - email sends in background
    return NextResponse.json({ success: true, orderId: updatedOrder.id })
  } catch (error) {
    console.error("Error confirming free order:", error)
    return NextResponse.json(
      { message: "Failed to confirm free order" },
      { status: 500 }
    )
  }
}
