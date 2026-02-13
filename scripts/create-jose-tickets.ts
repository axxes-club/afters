import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JOSE_USER_ID = 'user_38mrqnxm4e6AJkSYD6Wr5BVRwhS';
const JOSE_EMAIL = 'jose.viscasillas@gmail.com';

async function main() {
  console.log('🎟️ Creating tickets for Jose...\n');

  // Get AFTERS events with ticket tiers
  const events = await prisma.event.findMany({
    where: {
      ticketingType: 'AFTERS',
      status: 'PUBLISHED',
      isPublished: true,
    },
    include: {
      ticketTiers: true,
    },
    take: 5,
    orderBy: { startsAt: 'asc' }
  });

  if (events.length === 0) {
    console.log('❌ No AFTERS events found!');
    return;
  }

  console.log(`📊 Found ${events.length} AFTERS events\n`);

  for (const event of events) {
    console.log(`🎵 ${event.title}`);

    // Check if already has tickets
    const existingTickets = await prisma.ticket.count({
      where: {
        userId: JOSE_USER_ID,
        eventId: event.id
      }
    });

    if (existingTickets > 0) {
      console.log(`   ⏭️ Already has ${existingTickets} tickets`);
      continue;
    }

    // Get GA tier (prefer) or first tier
    const tier = event.ticketTiers.find(t => t.name.includes('General')) || event.ticketTiers[0];
    
    if (!tier) {
      console.log('   ⚠️ No ticket tier available');
      continue;
    }

    const ticketCount = Math.floor(Math.random() * 2) + 1; // 1-2 tickets
    const orderNumber = `AFT-${Date.now().toString(36).toUpperCase().substring(0, 6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: JOSE_USER_ID,
        eventId: event.id,
        email: JOSE_EMAIL,
        subtotal: tier.price * ticketCount,
        platformFee: Math.round(tier.price * ticketCount * 0.1) + 198,
        stripeFee: Math.round(tier.price * ticketCount * 0.029) + 30,
        total: Math.round(tier.price * ticketCount * 1.139) + 228,
        status: 'PAID',
        paidAt: new Date(),
        items: {
          create: {
            ticketTierId: tier.id,
            quantity: ticketCount,
            unitPrice: tier.price,
          }
        }
      }
    });

    console.log(`   📦 Created order: ${orderNumber}`);

    // Create tickets
    for (let i = 0; i < ticketCount; i++) {
      const ticketNumber = `AFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      await prisma.ticket.create({
        data: {
          ticketNumber,
          orderId: order.id,
          eventId: event.id,
          ticketTierId: tier.id,
          userId: JOSE_USER_ID,
          status: 'VALID',
        }
      });

      console.log(`   🎟️ Created ticket: ${ticketNumber}`);
    }

    // Update tier quantity sold
    await prisma.ticketTier.update({
      where: { id: tier.id },
      data: { quantitySold: { increment: ticketCount } }
    });
  }

  // Also save some events for Jose
  console.log('\n📌 Saving events for Jose...');
  
  const allEvents = await prisma.event.findMany({
    where: { state: 'NC', status: 'PUBLISHED' },
    take: 8,
    orderBy: { startsAt: 'asc' }
  });

  for (const event of allEvents.slice(0, 5)) {
    const existing = await prisma.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: JOSE_USER_ID,
          eventId: event.id
        }
      }
    });

    if (!existing) {
      await prisma.savedEvent.create({
        data: {
          userId: JOSE_USER_ID,
          eventId: event.id,
        }
      });
      console.log(`   💾 Saved: ${event.title}`);
    }
  }

  // Follow some organizers
  console.log('\n👥 Following organizers for Jose...');
  
  const organizers = await prisma.organizerProfile.findMany({ take: 3 });
  
  for (const org of organizers) {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: JOSE_USER_ID,
          followingId: org.id
        }
      }
    });

    if (!existing) {
      await prisma.follow.create({
        data: {
          followerId: JOSE_USER_ID,
          followingId: org.id,
        }
      });
      console.log(`   ➕ Following: ${org.displayName}`);
    }
  }

  // Final count
  const ticketCount = await prisma.ticket.count({ where: { userId: JOSE_USER_ID } });
  const savedCount = await prisma.savedEvent.count({ where: { userId: JOSE_USER_ID } });
  const followCount = await prisma.follow.count({ where: { followerId: JOSE_USER_ID } });

  console.log('\n' + '='.repeat(50));
  console.log('🎊 Jose Account Setup Complete!');
  console.log(`🎟️ Total tickets: ${ticketCount}`);
  console.log(`💾 Saved events: ${savedCount}`);
  console.log(`👥 Following: ${followCount}`);
  console.log('='.repeat(50));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
