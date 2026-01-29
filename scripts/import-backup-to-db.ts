import {
  PrismaClient
} from '@prisma/client';
import {
  Pool
} from 'pg';
import {
  PrismaPg
} from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

/**
 * Script to import events and organizers from a JSON backup file into the database.
 * This is useful for migrating data from an old site to a new production environment.
 */

async function importBackupToDb() {
  const backupFilePath = path.join(__dirname, '..', 'data', 'current-events-backup.json');
  
  if (!fs.existsSync(backupFilePath)) {
    console.error(`Backup file not found at: ${backupFilePath}`);
    return;
  }
  
  const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  console.log(`📂 Found ${backupData.length} events in backup file.`);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  console.log('🔗 Connecting to database...');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Get or create a default user and organizer if needed
    // The backup data has organizerId, but we might not have the organizer in the new DB.
    // For simplicity, we'll try to keep the same IDs if possible.
    
    console.log('🔄 Importing data...');
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const event of backupData) {
      try {
        // Ensure organizer exists
        // We might need to fetch the organizer from another backup or create a placeholder
        // In this case, we'll check if the organizer exists, if not, create a default one
        
        const organizerId = event.organizerId || 'default-organizer';
        
        let organizer = await prisma.organizerProfile.findUnique({
          where: { id: organizerId }
        });

        if (!organizer) {
          // Create a unique user for this organizer
          const userId = `user_${organizerId}`;
          
          let user = await prisma.user.findUnique({
            where: { id: userId }
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                id: userId,
                email: `${organizerId}@migration.afters.xxx`,
                firstName: 'Migration',
                lastName: organizerId,
              }
            });
          }

          organizer = await prisma.organizerProfile.create({
            data: {
              id: organizerId,
              userId: user.id,
              displayName: 'Imported Organizer',
              slug: `imported-${organizerId.substring(0, 8)}-${Math.random().toString(36).substring(2, 5)}`,
            }
          });
        }

        // Upsert the event
        await prisma.event.upsert({
          where: { id: event.id },
          update: {
            title: event.title,
            slug: event.slug,
            description: event.description,
            startsAt: new Date(event.startsAt),
            endsAt: event.endsAt ? new Date(event.endsAt) : null,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            city: event.city,
            state: event.state,
            country: event.country || 'US',
            flyerUrl: event.flyerUrl,
            status: event.status,
            isPublished: event.isPublished,
            ageRestriction: event.ageRestriction,
            timezone: event.timezone || 'America/New_York',
            updatedAt: new Date(),
          },
          create: {
            id: event.id,
            organizerId: organizer.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            startsAt: new Date(event.startsAt),
            endsAt: event.endsAt ? new Date(event.endsAt) : null,
            venueName: event.venueName,
            venueAddress: event.venueAddress,
            city: event.city,
            state: event.state,
            country: event.country || 'US',
            flyerUrl: event.flyerUrl,
            status: event.status,
            isPublished: event.isPublished,
            ageRestriction: event.ageRestriction,
            timezone: event.timezone || 'America/New_York',
            createdAt: new Date(event.createdAt || Date.now()),
            updatedAt: new Date(),
          }
        });

        importedCount++;
        if (importedCount % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error: any) {
        console.error(`
❌ Failed to import event ${event.title}:`, error.message);
        errorCount++;
      }
    }

    console.log(`

✅ Import complete!`);
    console.log(`- Imported/Updated: ${importedCount}`);
    console.log(`- Errors: ${errorCount}`);

  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

importBackupToDb().catch(console.error);
