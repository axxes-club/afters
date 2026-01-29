import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

/**
 * Script to duplicate current events to simulate having events from multiple branches
 * This creates additional events with modified slugs to avoid conflicts
 */

async function duplicateEvents() {
  // Read the current events from the backup
  const fs = require('fs');
  const path = require('path');
  
  const eventsFilePath = path.join(__dirname, '..', 'data', 'simplified-current-events-backup.json');
  
  if (!fs.existsSync(eventsFilePath)) {
    console.log(`Events file not found at: ${eventsFilePath}`);
    return;
  }
  
  const eventsData = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));
  console.log(`Found ${eventsData.length} events to duplicate`);

  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Get an organizer to assign duplicated events to
    const organizer = await prisma.organizerProfile.findFirst();
    if (!organizer) {
      console.log('No organizer found. Cannot duplicate events.');
      return;
    }

    console.log(`Using organizer: ${organizer.displayName} (${organizer.id}) for duplicated events`);

    let duplicatedCount = 0;
    let skippedCount = 0;

    // Duplicate first 20 events to simulate branch events
    const eventsToDuplicate = eventsData.slice(0, 20);
    
    for (const eventData of eventsToDuplicate) {
      // Modify the slug to avoid conflicts
      const newSlug = `${eventData.slug}-duplicate-${Math.floor(Math.random() * 1000)}`;
      
      // Check if event with new slug already exists
      const existingEvent = await prisma.event.findFirst({
        where: {
          slug: newSlug,
          organizerId: organizer.id
        }
      });

      if (existingEvent) {
        console.log(`Skipping duplicate: ${eventData.title}`);
        skippedCount++;
        continue;
      }

      try {
        await prisma.event.create({
          data: {
            id: undefined, // Let Prisma auto-generate
            title: `${eventData.title} (Dup)`, // Indicate this is a duplicate
            slug: newSlug,
            description: eventData.description,
            startsAt: new Date(eventData.startsAt),
            endsAt: eventData.endsAt ? new Date(eventData.endsAt) : null,
            venueName: eventData.venueName,
            venueAddress: eventData.venueAddress,
            city: eventData.city,
            state: eventData.state,
            country: eventData.country,
            ageRestriction: eventData.ageRestriction,
            status: eventData.status,
            isPublished: eventData.isPublished,
            organizerId: organizer.id, // Use the same organizer
            flyerUrl: eventData.flyerUrl,
            timezone: eventData.timezone,
          }
        });

        console.log(`✅ Duplicated: ${eventData.title}`);
        duplicatedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to duplicate ${eventData.title}:`, error.message);
      }
    }

    console.log('\n🎉 Duplication completed!');
    console.log(`- Duplicated: ${duplicatedCount} events`);
    console.log(`- Skipped: ${skippedCount} events`);
    console.log(`- Total events in DB now: ${await prisma.event.count()}`);

  } catch (error) {
    console.error('Error during duplication:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  console.log('Starting event duplication process...\n');
  
  await duplicateEvents();
}

main().catch(console.error);