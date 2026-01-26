import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ message: "Order ID required" }, { status: 400 })
    }

    // Get order with event and organizer
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        event: {
          include: {
            organizer: true,
          },
        },
        items: {
          include: {
            ticketTier: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: "Order already processed" },
        { status: 400 }
      )
    }

    const stripeAccountId = order.event.organizer.stripeAccountId

    if (!stripeAccountId) {
      return NextResponse.json(
        { message: "Organizer payment setup incomplete" },
        { status: 400 }
      )
    }

    // Create payment intent with marketplace split
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total,
      currency: "usd",
      application_fee_amount: order.platformFee,
      transfer_data: {
        destination: stripeAccountId,
      },
      metadata: {
        orderId: order.id,
        eventId: order.eventId,
        userId: order.userId,
      },
      description: `Tickets for ${order.event.title}`,
    })

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { message: "Failed to create payment" },
      { status: 500 }
    )
  }
}
