import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function checkEventCount() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const eventCount = await prisma.event.count();
    console.log(`Total events in database: ${eventCount}`);
    
    // Also get a few sample events to verify they exist
    const sampleEvents = await prisma.event.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        startsAt: true,
        venueName: true
      },
      orderBy: { startsAt: 'asc' }
    });
    
    console.log('\nSample events:');
    sampleEvents.forEach(event => {
      console.log(`- ${event.title} (${event.venueName}) on ${event.startsAt.toLocaleDateString()}`);
    });
  } catch (error) {
    console.error('Error checking event count:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkEventCount();