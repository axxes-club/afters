import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

/**
 * Script to import events from external sources into the local development database
 * 
 * This script assumes you have already exported events from your Neon branches
 * to the data/events-from-branches.json file
 */

async function importEventsToDevDb() {
  // Read the events from the file
  const fs = require('fs');
  const path = require('path');
  
  const eventsFilePath = path.join(__dirname, '..', 'data', 'simplified-events-from-branches.json');
  
  if (!fs.existsSync(eventsFilePath)) {
    console.log(`Events file not found at: ${eventsFilePath}`);
    console.log('Please run the pull script first or manually create the file with events data.');
    return;
  }
  
  const eventsData = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));
  console.log(`Found ${eventsData.length} events to import`);

  // Connect to the local database (using the DATABASE_URL from .env)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Check if we have an organizer profile to assign events to
    // If not, we'll need to create one or use an existing one
    let organizer = await prisma.organizerProfile.findFirst();
    
    if (!organizer) {
      console.log('No organizer found. Creating a default organizer for imported events...');
      
      // We need a user first - check if we have any users
      let user = await prisma.user.findFirst();
      
      if (!user) {
        console.log('No users found. Creating a default user...');
        user = await prisma.user.create({
          data: {
            id: 'user_imported_events',
            email: 'import@afters.xxx',
            firstName: 'Imported',
            lastName: 'Events',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }
      
      organizer = await prisma.organizerProfile.create({
        data: {
          id: 'org_imported_events',
          userId: user.id,
          displayName: 'Imported Events',
          slug: 'imported-events',
          bio: 'Events imported from production branches',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      console.log(`Created organizer: ${organizer.displayName}`);
    }

    console.log(`Using organizer: ${organizer.displayName} (${organizer.id}) for importing events`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const eventData of eventsData) {
      // Check if event already exists (by slug)
      const existingEvent = await prisma.event.findFirst({
        where: {
          slug: eventData.slug,
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
            id: eventData.id || undefined, // Let Prisma auto-generate if not provided
            title: eventData.title,
            slug: eventData.slug,
            description: eventData.description,
            startsAt: new Date(eventData.startsAt),
            endsAt: eventData.endsAt ? new Date(eventData.endsAt) : null,
            venueName: eventData.venueName,
            venueAddress: eventData.venueAddress,
            city: eventData.city,
            state: eventData.state,
            country: eventData.country || 'US',
            ageRestriction: eventData.ageRestriction,
            status: eventData.status || 'PUBLISHED',
            isPublished: eventData.isPublished ?? true,
            organizerId: organizer.id, // Use the local organizer
            flyerUrl: eventData.flyerUrl,
            timezone: eventData.timezone || 'America/New_York',
          }
        });

        console.log(`✅ Imported: ${eventData.title}`);
        importedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to import ${eventData.title}:`, error.message);
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`- Imported: ${importedCount} events`);
    console.log(`- Skipped: ${skippedCount} events`);
    console.log(`- Total events in DB now: ${await prisma.event.count({ where: { organizerId: organizer.id } })}`);

  } catch (error: any) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  console.log('Starting event import process...\n');
  
  await importEventsToDevDb();
}

main().catch(console.error);