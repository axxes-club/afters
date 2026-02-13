import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Find Jose's user
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'viscasillas' } }
  })

  if (!user) throw new Error('User not found')
  console.log('Found user:', user.email)

  // Find a published event
  const event = await prisma.event.findFirst({
    where: { isPublished: true, status: 'PUBLISHED' },
    include: { ticketTiers: true, organizer: true }
  })

  if (!event) throw new Error('No published event found')
  console.log('Found event:', event.title)

  // Get or create ticket tier
  let tier = event.ticketTiers[0]
  if (!tier) {
    tier = await prisma.ticketTier.create({
      data: {
        eventId: event.id,
        name: 'General Admission',
        price: 2500,
        quantity: 100,
        quantitySold: 0,
        minPerOrder: 1,
        maxPerOrder: 4,
        isVisible: true
      }
    })
    console.log('Created tier:', tier.name)
  }

  const orderNumber = `AFT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      eventId: event.id,
      email: user.email!,
      subtotal: tier.price * 2,
      platformFee: Math.round(tier.price * 2 * 0.1) + 198,
      stripeFee: Math.round((tier.price * 2) * 0.029) + 30,
      total: tier.price * 2 + Math.round(tier.price * 2 * 0.1) + 198,
      status: 'PAID',
      paidAt: new Date(),
      items: {
        create: {
          ticketTierId: tier.id,
          quantity: 2,
          unitPrice: tier.price
        }
      }
    }
  })

  console.log('Created order:', order.orderNumber)

  for (let i = 0; i < 2; i++) {
    const ticketNumber = `AFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        orderId: order.id,
        eventId: event.id,
        ticketTierId: tier.id,
        userId: user.id,
        status: 'VALID'
      }
    })
    console.log('Created ticket:', ticket.ticketNumber)
  }

  console.log('\n✅ Done! Check https://afters.netlify.app/my-tickets')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
