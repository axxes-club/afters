import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Target user ID
const TARGET_USER_ID = 'user_38mrqnxm4e6AJkSYD6Wr5BVRwhS';

// Posh event slugs to import
const poshEventSlugs = [
  'aepi-st-paddys',
  'back-2-2016',
  'bamsee-at-pianos',
  'electrix-vintage-fillabag-sale-day-one-5',
  'maison-chrom-friends-presents-friday-the-13th-underground-mayhem',
  'march-madness-40',
  'music-matcha-3',
  'praise-the-disco-ball-1',
  'rnbashment-20',
  'rompe-reggaeton-latin-tech-house-free-rsvp-1',
  'saint-anthony-hall-presents-woodstock',
  'shabbat-club-purim',
  'spring-breal-after-dark',
  'st-paddys-day-bar-fest-lower-east-side',
  'the-impeachment-party',
  'unrivaled-watch-party-semi-finals',
  'were-celebrating-creativity-innovation-and-collaboration-helping-creators-turn-their-passion-into-purpose-and-sustainable-success',
  'west-village-st-paddys-day-bar-fest',
  'winter-jazz-w-vanisha-gould',
  'yung-bleu-live-at-lotus-rooftop',
];

interface PoshEventData {
  name: string;
  url: string;
  flyer: string;
  start: string;
  end: string;
  venueName: string;
  venueAddress: string;
  location?: { lat: number; lng: number };
  timezone: string;
  shortDescription?: string;
  description?: string;
  minPriceWithFees?: number;
  groupData?: {
    groupName: string;
    groupUrl: string;
  };
}

async function fetchPoshEvent(slug: string): Promise<PoshEventData | null> {
  try {
    const response = await fetch(`https://posh.vip/e/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    const html = await response.text();
    
    // Extract event data from the JSON-LD script or embedded data
    // The event data is embedded in the page's React props
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    
    if (jsonLdMatch) {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      
      // Also try to extract from the page's embedded data
      const eventDataMatch = html.match(/"eventData":\{[^}]*"eventId":"[^"]+","url":"([^"]+)"/);
      const groupDataMatch = html.match(/"groupData":\{"groupId":"[^"]+","groupName":"([^"]+)"/);
      
      return {
        name: jsonData.name || slug,
        url: slug,
        flyer: jsonData.image?.[0] || '',
        start: jsonData.startDate,
        end: jsonData.endDate,
        venueName: jsonData.location?.name || 'TBD',
        venueAddress: jsonData.location?.address?.streetAddress || jsonData.location?.name || 'New York, NY',
        location: jsonData.location?.geo,
        timezone: 'America/New_York',
        shortDescription: jsonData.description,
        description: jsonData.description,
        minPriceWithFees: jsonData.offers?.price,
        groupData: groupDataMatch ? {
          groupName: groupDataMatch[1],
          groupUrl: '',
        } : undefined,
      };
    }
    
    // Fallback: Try to extract from the page's title and meta tags
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    
    if (titleMatch) {
      const titleParts = titleMatch[1].split(' | ');
      return {
        name: titleParts[0] || slug,
        url: slug,
        flyer: ogImageMatch ? ogImageMatch[1] : '',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        venueName: 'New York',
        venueAddress: 'New York, NY',
        timezone: 'America/New_York',
        shortDescription: descMatch ? descMatch[1] : '',
        description: descMatch ? descMatch[1] : '',
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${slug}:`, error);
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

async function main() {
  console.log('🎵 Posh Events Import\n');
  console.log(`Target User ID: ${TARGET_USER_ID}\n`);

  // Check if user exists and get/create their organizer profile
  const user = await prisma.user.findUnique({
    where: { id: TARGET_USER_ID },
    include: { organizerProfile: true },
  });

  if (!user) {
    console.error(`❌ User ${TARGET_USER_ID} not found!`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email}`);

  // Get or create organizer profile
  let organizerProfile = user.organizerProfile;
  
  if (!organizerProfile) {
    console.log('Creating organizer profile for user...');
    organizerProfile = await prisma.organizerProfile.create({
      data: {
        userId: user.id,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username || 'Posh Import',
        slug: user.username || `user-${user.id.substring(0, 8)}`,
        bio: 'Events imported from Posh',
      },
    });
    console.log(`✅ Created organizer profile: ${organizerProfile.displayName}`);
  } else {
    console.log(`✅ Found organizer profile: ${organizerProfile.displayName}`);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const slug of poshEventSlugs) {
    console.log(`\n📅 Fetching: ${slug}`);
    
    const eventData = await fetchPoshEvent(slug);
    
    if (!eventData) {
      console.log(`   ⚠️ Could not fetch event data, skipping`);
      skipped++;
      continue;
    }

    const baseSlug = slugify(eventData.name);
    const dateStr = eventData.start ? new Date(eventData.start).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const eventSlug = `${baseSlug}-${dateStr}`;

    console.log(`   📌 ${eventData.name}`);
    console.log(`   📍 ${eventData.venueName}`);

    // Check if event already exists
    const existing = await prisma.event.findFirst({
      where: {
        organizerId: organizerProfile.id,
        slug: eventSlug,
      },
    });

    const eventDate = new Date(eventData.start);
    const endDate = eventData.end ? new Date(eventData.end) : new Date(eventDate.getTime() + 4 * 60 * 60 * 1000);

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: eventData.name,
          description: eventData.description || eventData.shortDescription,
          startsAt: eventDate,
          endsAt: endDate,
          venueName: eventData.venueName,
          venueAddress: eventData.venueAddress,
          city: 'New York',
          state: 'NY',
          country: 'US',
          status: 'PUBLISHED',
          isPublished: true,
          timezone: eventData.timezone || 'America/New_York',
          flyerUrl: eventData.flyer,
          ticketingType: 'POSH',
          externalTicketingUrl: `https://posh.vip/e/${slug}`,
        },
      });
      updated++;
      console.log(`   📝 Updated`);
    } else {
      await prisma.event.create({
        data: {
          organizerId: organizerProfile.id,
          title: eventData.name,
          slug: eventSlug,
          description: eventData.description || eventData.shortDescription,
          startsAt: eventDate,
          endsAt: endDate,
          venueName: eventData.venueName,
          venueAddress: eventData.venueAddress,
          city: 'New York',
          state: 'NY',
          country: 'US',
          status: 'PUBLISHED',
          isPublished: true,
          timezone: eventData.timezone || 'America/New_York',
          flyerUrl: eventData.flyer,
          ticketingType: 'POSH',
          externalTicketingUrl: `https://posh.vip/e/${slug}`,
        },
      });
      created++;
      console.log(`   ✅ Created`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎵 Posh Events Import Complete!');
  console.log(`📊 Created: ${created}`);
  console.log(`📝 Updated: ${updated}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });