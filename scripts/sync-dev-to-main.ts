import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const utapi = new UTApi();

async function main() {
  const sourceUrl = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const destUrl = process.env.DATABASE_URL;

  if (!destUrl) {
    console.error('DATABASE_URL not set in .env');
    return;
  }

  console.log('🔗 Connecting to source (dev)...');
  const sourcePool = new Pool({ connectionString: sourceUrl });
  
  console.log('🔗 Connecting to destination (main)...');
  const destPool = new Pool({ connectionString: destUrl });
  const adapter = new PrismaPg(destPool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Fetch from source
    console.log('📥 Fetching events and organizers from source...');
    const organizersRes = await sourcePool.query('SELECT * FROM "OrganizerProfile"');
    const eventsRes = await sourcePool.query('SELECT * FROM "Event"');

    console.log(`Found ${organizersRes.rows.length} organizers and ${eventsRes.rows.length} events.`);

    // 2. Sync Organizers
    console.log('🔄 Syncing organizers...');
    for (const org of organizersRes.rows) {
      // Create user first if it doesn't exist (assuming minimal user data is enough)
      await prisma.user.upsert({
        where: { id: org.userId },
        update: {},
        create: {
          id: org.userId,
          email: `${org.slug}@placeholder.com`, // We might not have the real email here
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        }
      });

      await prisma.organizerProfile.upsert({
        where: { id: org.id },
        update: {
          displayName: org.displayName,
          slug: org.slug,
          bio: org.bio,
          logoUrl: org.logoUrl,
          stripeAccountId: org.stripeAccountId,
          stripeOnboardingComplete: org.stripeOnboardingComplete,
          stripeChargesEnabled: org.stripeChargesEnabled,
          stripePayoutsEnabled: org.stripePayoutsEnabled,
          updatedAt: org.updatedAt,
        },
        create: {
          id: org.id,
          userId: org.userId,
          displayName: org.displayName,
          slug: org.slug,
          bio: org.bio,
          logoUrl: org.logoUrl,
          stripeAccountId: org.stripeAccountId,
          stripeOnboardingComplete: org.stripeOnboardingComplete,
          stripeChargesEnabled: org.stripeChargesEnabled,
          stripePayoutsEnabled: org.stripePayoutsEnabled,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        }
      });
    }

    // 3. Sync Events
    console.log('🔄 Syncing events and migrating images...');
    for (const event of eventsRes.rows) {
      let finalFlyerUrl = event.flyerUrl;

      // Migrate to UploadThing if it's an external URL and not already on UploadThing
      if (finalFlyerUrl && 
          !finalFlyerUrl.includes('uploadthing') && 
          !finalFlyerUrl.includes('utfs.io') &&
          !finalFlyerUrl.includes('placehold.co')) {
        
        try {
          console.log(`  📸 Migrating flyer for: ${event.title}`);
          const response = await fetch(finalFlyerUrl);
          if (response.ok) {
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const buffer = await response.arrayBuffer();
            const blob = new Blob([buffer], { type: contentType });
            const ext = contentType.includes('png') ? 'png' : 'jpg';
            const filename = `event-${event.id}.${ext}`;
            const file = new File([blob], filename, { type: contentType });

            const uploadResult = await utapi.uploadFiles([file]);
            if (uploadResult[0]?.data?.ufsUrl) {
              finalFlyerUrl = uploadResult[0].data.ufsUrl;
            } else if (uploadResult[0]?.data?.url) {
              finalFlyerUrl = uploadResult[0].data.url;
            }
          }
        } catch (error) {
          console.error(`  ⚠️ Failed to migrate flyer for ${event.title}:`, error);
        }
      }

      await prisma.event.upsert({
        where: { id: event.id },
        update: {
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
          flyerUrl: finalFlyerUrl,
          status: event.status,
          isPublished: event.isPublished,
          ageRestriction: event.ageRestriction,
          updatedAt: event.updatedAt,
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
          flyerUrl: finalFlyerUrl,
          status: event.status,
          isPublished: event.isPublished,
          ageRestriction: event.ageRestriction,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        }
      });
    }

    console.log('✅ Sync complete!');

  } catch (err) {
    console.error('❌ Error during sync:', err);
  } finally {
    await sourcePool.end();
    await destPool.end();
  }
}

main();
