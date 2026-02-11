import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

// Generate a test ticket for an event
export async function generateTestTicket(eventId: string, userId: string) {
  // Find or create a test tier for this event
  let testTier = await prisma.ticketTier.findFirst({
    where: {
      eventId,
      name: "Test Ticket",
    },
  })

  if (!testTier) {
    testTier = await prisma.ticketTier.create({
      data: {
        eventId,
        name: "Test Ticket",
        description: "For testing check-in flow",
        price: 0,
        quantity: 999,
        quantitySold: 0,
      },
    })
  }

  // Create a test order
  const orderNumber = `TEST-${nanoid(8).toUpperCase()}`
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      eventId,
      subtotal: 0,
      platformFee: 0,
      stripeFee: 0,
      total: 0,
      status: "PAID",
      email: "test@afters.am",
      paidAt: new Date(),
    },
  })

  // Create an order item
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      ticketTierId: testTier.id,
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  })

  // Create the test ticket
  const ticketNumber = `T-${nanoid(8).toUpperCase()}`
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      orderId: order.id,
      eventId,
      ticketTierId: testTier.id,
      userId,
      isTestTicket: true,
      status: "VALID",
    },
  })

  return ticket
}

// Check if an event already has a test ticket
export async function hasTestTicket(eventId: string): Promise<boolean> {
  const count = await prisma.ticket.count({
    where: {
      eventId,
      isTestTicket: true,
    },
  })
  return count > 0
}
