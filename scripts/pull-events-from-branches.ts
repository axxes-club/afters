import { Pool } from 'pg';
import 'dotenv/config';

/**
 * Script to pull events from two Neon branches and prepare them for local development
 *
 * Branches:
 * - br-empty-tooth-ae7bu8w7 (empty tooth branch)
 * - br-red-haze-ae35av1e (red haze branch)
 */

async function getEventsFromBranch(connectionString: string) {
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

    console.log(`Found ${result.rows.length} events in branch`);

    await pool.end();

    return result.rows;
  } catch (error) {
    console.error('Error fetching events from branch:', error);
    await pool.end();
    return [];
  }
}

async function main() {
  // Connection strings for the two branches
  // Note: These are inferred from the Neon URL patterns
  // You may need to update these with actual connection strings

  const branch1ConnectionString = process.env.BRANCH_EMPTY_TOOTH_DATABASE_URL;
  const branch2ConnectionString = process.env.BRANCH_RED_HAZE_DATABASE_URL;

  if (!branch1ConnectionString || !branch2ConnectionString) {
    console.error('Missing connection strings for branches. Please set BRANCH_EMPTY_TOOTH_DATABASE_URL and BRANCH_RED_HAZE_DATABASE_URL in your environment.');
    console.log('Current DATABASE_URL:', process.env.DATABASE_URL);
    console.log('BRANCH_EMPTY_TOOTH_DATABASE_URL:', process.env.BRANCH_EMPTY_TOOTH_DATABASE_URL);
    console.log('BRANCH_RED_HAZE_DATABASE_URL:', process.env.BRANCH_RED_HAZE_DATABASE_URL);
    return;
  }

  console.log('Fetching events from branch 1 (empty-tooth)...');
  const branch1Events = await getEventsFromBranch(branch1ConnectionString);

  console.log('Fetching events from branch 2 (red-haze)...');
  const branch2Events = await getEventsFromBranch(branch2ConnectionString);

  // Combine events from both branches
  const allEvents = [...branch1Events, ...branch2Events];

  console.log(`\nSummary:`);
  console.log(`- Branch 1 (empty-tooth): ${branch1Events.length} events`);
  console.log(`- Branch 2 (red-haze): ${branch2Events.length} events`);
  console.log(`- Total events to import: ${allEvents.length}`);

  // Save events to a JSON file for later use
  const fs = require('fs');
  const path = require('path');

  const outputPath = path.join(__dirname, '..', 'data', 'events-from-branches.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(allEvents, null, 2));
  console.log(`\nEvents saved to: ${outputPath}`);

  // Also create a simplified version for seeding
  const simplifiedEvents = allEvents.map(event => ({
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
    organizer: event.organizer
  }));

  const simplifiedOutputPath = path.join(__dirname, '..', 'data', 'simplified-events-from-branches.json');
  fs.writeFileSync(simplifiedOutputPath, JSON.stringify(simplifiedEvents, null, 2));
  console.log(`Simplified events saved to: ${simplifiedOutputPath}`);
}

main().catch(console.error);