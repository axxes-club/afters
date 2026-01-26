import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateFees } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { eventId, items } = await req.json()

    if (!eventId || !items || items.length === 0) {
      return NextResponse.json(
        { message: "Event ID and items are required" },
        { status: 400 }
      )
    }

    // Get event and tiers
    const event = await prisma.event.findUnique({
      where: { id: eventId, isPublished: true },
      include: {
        ticketTiers: true,
        organizer: true,
      },
    })

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 })
    }

    type TierType = typeof event.ticketTiers[number]

    // Validate items and calculate totals
    let subtotal = 0
    let ticketCount = 0
    const orderItems: { ticketTierId: string; quantity: number; unitPrice: number }[] = []

    for (const item of items) {
      const tier = event.ticketTiers.find((t: TierType) => t.id === item.ticketTierId)
      if (!tier) {
        return NextResponse.json(
          { message: `Ticket tier ${item.ticketTierId} not found` },
          { status: 400 }
        )
      }

      const available = tier.quantity - tier.quantitySold
      if (item.quantity > available) {
        return NextResponse.json(
          { message: `Only ${available} tickets available for ${tier.name}` },
          { status: 400 }
        )
      }

      if (item.quantity > tier.maxPerOrder) {
        return NextResponse.json(
          { message: `Maximum ${tier.maxPerOrder} tickets per order for ${tier.name}` },
          { status: 400 }
        )
      }

      subtotal += tier.price * item.quantity
      ticketCount += item.quantity
      orderItems.push({
        ticketTierId: tier.id,
        quantity: item.quantity,
        unitPrice: tier.price,
      })
    }

    const fees = calculateFees(subtotal, ticketCount)

    // Generate order number
    const orderNumber = `AFT-${Date.now().toString(36).toUpperCase()}`

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        eventId,
        subtotal: fees.subtotal,
        platformFee: fees.platformFee,
        stripeFee: 0, // Will be calculated by Stripe
        total: fees.total,
        email: user.emailAddresses[0]?.emailAddress || "",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            ticketTier: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { message: "Failed to create order" },
      { status: 500 }
    )
  }
}
