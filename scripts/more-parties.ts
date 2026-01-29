import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const utapi = new UTApi();

interface PartyEvent {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  venueName: string;
  venueAddress: string;
  city: string;
  state?: string;
  country: string;
  flyerUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isPublished: boolean;
  organizerId: string;
  timezone: string;
  ticketingType?: 'AFTERS' | 'POSH' | 'DICE' | 'TICKETMASTER' | 'LIVENATION' | 'EVENTBRITE' | 'OTHER';
  externalTicketingUrl?: string;
}

/**
 * MORE_PARTIES Skill Script
 * Handles crawling (placeholder), image migration to UploadThing, 
 * and syncing across Main, Vercel-Dev, and Local databases.
 */
async function syncEventToDb(prisma: PrismaClient, event: PartyEvent) {
  return prisma.event.upsert({
    where: { 
      organizerId_slug: {
        organizerId: event.organizerId,
        slug: event.slug
      }
    },
    update: {
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timezone: event.timezone,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      city: event.city,
      state: event.state,
      country: event.country,
      flyerUrl: event.flyerUrl,
      status: event.status,
      isPublished: event.isPublished,
      ticketingType: event.ticketingType,
      externalTicketingUrl: event.externalTicketingUrl,
    },
    create: {
      id: event.id,
      organizerId: event.organizerId,
      title: event.title,
      slug: event.slug,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timezone: event.timezone,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      city: event.city,
      state: event.state,
      country: event.country,
      flyerUrl: event.flyerUrl,
      status: event.status,
      isPublished: event.isPublished,
      ticketingType: event.ticketingType || 'AFTERS',
      externalTicketingUrl: event.externalTicketingUrl,
    }
  });
}

async function migrateFlyer(url: string, eventId: string): Promise<string | null> {
  if (!url || url.includes('uploadthing') || url.includes('utfs.io') || url.includes('placehold.co')) {
    return url;
  }

  try {
    console.log(`  📸 Uploading flyer to UploadThing: ${url}`);
    const response = await fetch(url);
    if (!response.ok) return url;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: contentType });
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `party-${eventId || Date.now()}.${ext}`;
    const file = new File([blob], filename, { type: contentType });

    const uploadResult = await utapi.uploadFiles([file]);
    return uploadResult[0]?.data?.ufsUrl || uploadResult[0]?.data?.url || url;
  } catch (error: any) {
    console.error(`  ⚠️ Failed to migrate flyer:`, error);
    return url;
  }
}

async function main() {
  const dbUrls = [
    { name: 'Vercel-Dev', url: process.env.DATABASE_URL },
    { name: 'Branch-Empty-Tooth', url: process.env.BRANCH_EMPTY_TOOTH_DATABASE_URL },
    { name: 'Branch-Red-Haze', url: process.env.BRANCH_RED_HAZE_DATABASE_URL },
    { name: 'Local', url: process.env.LOCAL_DATABASE_URL }
  ].filter(db => db.url);

  console.log(`🚀 Starting MORE_PARTIES sync across ${dbUrls.length} databases...\n`);

  const fs = require('fs');
  const path = require('path');
  const crawledPath = path.join(__dirname, '..', 'data', 'more-parties-crawled.json');
  
  if (!fs.existsSync(crawledPath)) {
    console.error('❌ Crawled data file not found!');
    return;
  }

  const events = JSON.parse(fs.readFileSync(crawledPath, 'utf8'));
  console.log(`📊 Found ${events.length} new events to process.`);

  for (const event of events) {
    console.log(`\nProcessing: ${event.title}`);
    
    // 1. Ensure organizer exists in target DBs
    // 2. Migrate image
    const newFlyerUrl = await migrateFlyer(event.flyerUrl, event.id || event.slug);
    event.flyerUrl = newFlyerUrl;

    // 3. Sync to all target DBs
    for (const db of dbUrls) {
      try {
        const pool = new Pool({ connectionString: db.url });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });
        
        // Ensure user exists
        await prisma.user.upsert({
          where: { id: 'user_seed_123' },
          update: {},
          create: {
            id: 'user_seed_123',
            email: 'seed@afters.xxx',
            firstName: 'Seed',
            lastName: 'User',
          }
        });

        // Ensure organizer exists
        await prisma.organizerProfile.upsert({
          where: { id: event.organizerId },
          update: {},
          create: {
            id: event.organizerId,
            userId: 'user_seed_123',
            displayName: 'Afters Curated',
            slug: 'afters-curated',
          }
        });

        await syncEventToDb(prisma, {
          ...event,
          startsAt: new Date(event.startsAt),
          endsAt: event.endsAt ? new Date(event.endsAt) : undefined
        });
        console.log(`  ✅ Synced to ${db.name}`);
        
        await pool.end();
      } catch (e: any) {
        console.error(`  ❌ Failed to sync to ${db.name}:`, e.message);
      }
    }
  }

  console.log('\n✨ MORE_PARTIES run complete!');
}

main();
