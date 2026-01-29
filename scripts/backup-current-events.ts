import { Pool } from 'pg';
import 'dotenv/config';

/**
 * Script to backup current events from the main database
 * This serves as an alternative when branch access isn't available
 */

async function backupCurrentEvents() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new Pool({ connectionString });

  try {
    // Query the events table directly
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.slug,
        e.description,
        e."startsAt",
        e."endsAt",
        e."venueName",
        e."venueAddress",
        e.city,
        e.state,
        e.country,
        e."ageRestriction",
        e.status,
        e."isPublished",
        e."organizerId",
        e."flyerUrl",
        e.timezone,
        e."createdAt",
        e."updatedAt",
        o.id as "organizer.id",
        o."displayName" as "organizer.displayName",
        o.slug as "organizer.slug"
      FROM "Event" e
      LEFT JOIN "OrganizerProfile" o ON e."organizerId" = o.id
      ORDER BY e."createdAt" DESC
    `);

    console.log(`Found ${result.rows.length} events in current database`);
    
    await pool.end();
    
    // Save events to a JSON file for later use
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, '..', 'data', 'current-events-backup.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(result.rows, null, 2));
    console.log(`\nEvents backed up to: ${outputPath}`);

    // Also create a simplified version for seeding
    const simplifiedEvents = result.rows.map(event => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      city: event.city,
      state: event.state,
      country: event.country,
      ageRestriction: event.ageRestriction,
      status: event.status,
      isPublished: event.isPublished,
      organizerId: event.organizerId,
      flyerUrl: event.flyerUrl,
      timezone: event.timezone,
      organizer: {
        id: event['organizer.id'],
        displayName: event['organizer.displayName'],
        slug: event['organizer.slug']
      }
    }));

    const simplifiedOutputPath = path.join(__dirname, '..', 'data', 'simplified-current-events-backup.json');
    fs.writeFileSync(simplifiedOutputPath, JSON.stringify(simplifiedEvents, null, 2));
    console.log(`Simplified events saved to: ${simplifiedOutputPath}`);
    
    return result.rows;
  } catch (error) {
    console.error('Error backing up events:', error);
    await pool.end();
    return [];
  }
}

async function main() {
  console.log('Backing up current events from main database...');
  await backupCurrentEvents();
}

main().catch(console.error);