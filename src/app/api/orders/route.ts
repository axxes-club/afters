import {securityRateLimit} from "@/lib/security-rate-limit";
import {securityClientKey} from "@/lib/security-client-key";
import { getUserId, currentUser } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createOrderAccessToken } from "@/lib/order-access"
import { calculateFees, stripe } from "@/lib/stripe"
import { randomUUID } from "node:crypto"

export async function POST(req: Request) {
  try {
    // Try to get authenticated user, but don't require it
    const userId = await getUserId()
    const user = userId ? await currentUser() : null

    const { eventId, items, email: guestEmail, guestName } = await req.json()

    if (typeof eventId !== "string" || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json(
        { message: "Event ID and items are required" },
        { status: 400 }
      )
    }

    // Always use the email provided in checkout (guestEmail)
    // This is what the customer entered, regardless of auth status
    const email = guestEmail || user?.email

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    // For guest checkout, guestName is required
    if (!userId && !guestName) {
      return NextResponse.json(
        { message: "Name is required for guest checkout" },
        { status: 400 }
      )
    }

    // Validate before totals: negative quantities could turn a paid order into
    // a free one, and repeated tier IDs bypass availability and per-order limits.
    const seenTiers = new Set<string>()
    for (const item of items) {
      if (!item || typeof item.ticketTierId !== "string" ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seenTiers.has(item.ticketTierId)) {
        return NextResponse.json({ message: "Use each ticket tier once with a positive whole quantity" }, { status: 400 })
      }
      seenTiers.add(item.ticketTierId)
    }

    if(!(await securityRateLimit("orders-global",600,60000)).allowed)return NextResponse.json({message:"Too many reservations. Try again later."},{status:429});
    const admission=await securityRateLimit(`order:${userId??securityClientKey(req)}:${eventId}`,5,60000);
    const buyer=await securityRateLimit(`buyer:${userId??String(email).toLowerCase()}:${eventId}`,10,3600000);
    if(!admission.allowed || !buyer.allowed)return NextResponse.json({message:"Too many reservations. Try again later."},{status:429});
    return await prisma.$transaction(async (tx) => {
      // Serialize reservations for this event. Pending orders hold inventory until
      // paid or cancelled; the checkout endpoint enforces a one-hour lifetime.
      await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`
      // Get event and tiers
      const event = await tx.event.findUnique({
        where: { id: eventId, isPublished: true },
        include: {
          ticketTiers: true,
          organizer: true,
        },
      })

      if (!event) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 })
      }

      // Release stale reservations only after Stripe confirms their payment can
      // no longer complete. Succeeded/processing payments keep their tickets until
      // the webhook fulfils them; Stripe failures leave the reservation intact.
      const expired = await tx.order.findMany({
        where: { eventId, status: "PENDING", createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
        select: { id: true, stripePaymentIntentId: true }, take: 10,
      })
      for (const old of expired) {
        if (old.stripePaymentIntentId) {
          if (!event.organizer.stripeAccountId) continue
          try {
            const options = { stripeAccount: event.organizer.stripeAccountId }
            const payment = await stripe.paymentIntents.retrieve(old.stripePaymentIntentId, {}, options)
            if (["succeeded", "processing", "requires_capture"].includes(payment.status)) continue
            if (payment.status !== "canceled") await stripe.paymentIntents.cancel(payment.id, {}, options)
          } catch {
            console.warn("Could not release expired ticket order", old.id)
            continue
          }
        }
        await tx.order.updateMany({
          where: { id: old.id, status: "PENDING", stripePaymentIntentId: old.stripePaymentIntentId },
          data: { status: "CANCELLED" },
        })
      }
      const reservations = await tx.orderItem.groupBy({
        by: ["ticketTierId"],
        where: { order: { eventId, status: "PENDING" } },
        _sum: { quantity: true },
      })
      const reserved = new Map(reservations.map(row => [row.ticketTierId, row._sum.quantity ?? 0]))

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

        const available = Math.max(0, tier.quantity - tier.quantitySold - (reserved.get(tier.id) ?? 0))
        if (item.quantity > available) {
          return NextResponse.json(
            { message: `Only ${available} tickets available for ${tier.name}` },
            { status: 400 }
          )
        }

        if (!tier.isVisible || (tier.salesStartAt && tier.salesStartAt > new Date()) ||
            (tier.salesEndAt && tier.salesEndAt < new Date()) || item.quantity < tier.minPerOrder) {
          return NextResponse.json({ message: `Tickets are not available in this quantity for ${tier.name}` }, { status: 400 })
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
      const orderNumber = `AFT-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`

      // Create order - userId is optional for guest checkout
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          eventId,
          subtotal: fees.subtotal,
          platformFee: fees.platformFee,
          stripeFee: 0, // Will be calculated by Stripe
          total: fees.total,
          email,
          guestName: userId ? null : guestName, // Only set for guest orders
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

      return NextResponse.json({ ...order, accessToken: createOrderAccessToken(order.id) })
    }, { maxWait: 10000, timeout: 30000 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { message: "Failed to create order" },
      { status: 500 }
    )
  }
}
