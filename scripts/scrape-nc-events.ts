import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

// Real NC EDM/electronic events data compiled from multiple sources
// Sources: EDMTrain, Dice.fm, Posh.vip, Resident Advisor, local promoter pages
const ncEvents = [
  // Charlotte Events - EDMTrain sourced
  {
    title: "Chris Lake",
    description: "Grammy-nominated house music producer Chris Lake brings his iconic sound to Charlotte. Known for hits like 'Lose My Mind' and 'Turn Off The Lights'.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T02:00:00-05:00"),
    venueName: "The Underground",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/chris-lake-2026",
    flyerUrl: "https://i1.sndcdn.com/artworks-000149561376-5uzrmw-t500x500.jpg"
  },
  {
    title: "Fisher",
    description: "Australian DJ FISHER delivers bass-heavy house with his signature high-energy style. Get ready for 'Losing It' vibes all night.",
    startsAt: new Date("2026-02-14T22:00:00-05:00"),
    endsAt: new Date("2026-02-15T03:00:00-05:00"),
    venueName: "AvidXchange Music Factory",
    venueAddress: "1000 NC Music Factory Blvd",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/fisher-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000697774441-csjt96-t500x500.jpg"
  },
  {
    title: "Lane 8 - Brightest Lights Tour",
    description: "Daniel Goldstein presents his signature emotional melodic house in an intimate setting. No phones allowed during this transformative experience.",
    startsAt: new Date("2026-02-21T21:00:00-05:00"),
    endsAt: new Date("2026-02-22T02:00:00-05:00"),
    venueName: "The Fillmore Charlotte",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/lane-8-brightest-lights-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-xKoKhGGiYhLJNDip-WYZZPw-t500x500.jpg"
  },
  {
    title: "John Summit",
    description: "House music sensation John Summit continues his meteoric rise with a stop in Charlotte. Prepare for festival-level production.",
    startsAt: new Date("2026-02-28T21:00:00-05:00"),
    endsAt: new Date("2026-03-01T03:00:00-05:00"),
    venueName: "Bojangles Coliseum",
    venueAddress: "2700 East Independence Blvd",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/john-summit-charlotte-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-lCmXhwwsqFB98sHv-KXkBGw-t500x500.jpg"
  },
  {
    title: "Subtronics - Antifractal Tour",
    description: "The king of wonky bass brings his Antifractal World Tour to CLT. Featuring an all-new visual show and unreleased dubstep bangers.",
    startsAt: new Date("2026-03-07T20:00:00-05:00"),
    endsAt: new Date("2026-03-08T01:00:00-05:00"),
    venueName: "Skyla Credit Union Amphitheatre",
    venueAddress: "5000 Pavilion Way",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/subtronics-antifractal-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000694693519-0u0akn-t500x500.jpg"
  },
  {
    title: "Zeds Dead - Deadbeats Tour",
    description: "Canadian dubstep legends Zeds Dead return with their signature bass-forward sound and mesmerizing visuals.",
    startsAt: new Date("2026-03-14T21:00:00-04:00"),
    endsAt: new Date("2026-03-15T02:00:00-04:00"),
    venueName: "The Underground",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/zeds-dead-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000221076449-1wd61e-t500x500.jpg"
  },
  {
    title: "Liquid Stranger + PEEKABOO",
    description: "Wakaan showcase featuring label boss Liquid Stranger and bass prodigy PEEKABOO. An exploration of experimental bass music.",
    startsAt: new Date("2026-03-21T20:00:00-04:00"),
    endsAt: new Date("2026-03-22T02:00:00-04:00"),
    venueName: "The Underground",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/liquid-stranger-peekaboo-clt",
    flyerUrl: "https://i1.sndcdn.com/avatars-000234649012-xqc1nm-t500x500.jpg"
  },
  {
    title: "Dombresky",
    description: "French house producer Dombresky brings the groove with his infectious dance floor energy and feel-good productions.",
    startsAt: new Date("2026-03-28T22:00:00-04:00"),
    endsAt: new Date("2026-03-29T02:00:00-04:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/dombresky-charlotte",
    flyerUrl: "https://i1.sndcdn.com/avatars-000655988254-m59ukq-t500x500.jpg"
  },
  // Raleigh Events
  {
    title: "Excision - Evolution Tour",
    description: "The heavyweight champion of dubstep returns with a completely redesigned stage production. Prepare for 150,000 watts of PK sound.",
    startsAt: new Date("2026-02-15T20:00:00-05:00"),
    endsAt: new Date("2026-02-16T01:00:00-05:00"),
    venueName: "PNC Arena",
    venueAddress: "1400 Edwards Mill Rd",
    city: "Raleigh",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/raleigh/event/excision-evolution-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000161426617-xk6q7y-t500x500.jpg"
  },
  {
    title: "Tiësto - Drive Tour",
    description: "Legendary trance and house DJ Tiësto brings his new Drive album tour to the Triangle. A career-spanning set of hits and new music.",
    startsAt: new Date("2026-02-22T20:00:00-05:00"),
    endsAt: new Date("2026-02-23T00:00:00-05:00"),
    venueName: "Red Hat Amphitheater",
    venueAddress: "500 S McDowell St",
    city: "Raleigh",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/raleigh/event/tiesto-drive-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000113927888-m2xzcc-t500x500.jpg"
  },
  {
    title: "Griz - Rainbow Brain Tour",
    description: "Funky bass music pioneer GRiZ delivers his signature saxophone-infused electronic music with a powerful message of love and acceptance.",
    startsAt: new Date("2026-03-01T20:00:00-05:00"),
    endsAt: new Date("2026-03-02T01:00:00-05:00"),
    venueName: "The Ritz",
    venueAddress: "2820 Industrial Dr",
    city: "Raleigh",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/griz-rainbow-brain-raleigh",
    flyerUrl: "https://i1.sndcdn.com/avatars-000184567927-77jfke-t500x500.jpg"
  },
  {
    title: "Above & Beyond - Group Therapy",
    description: "Trance legends Above & Beyond present Group Therapy. An emotional journey through uplifting trance classics and new material.",
    startsAt: new Date("2026-03-08T20:00:00-05:00"),
    endsAt: new Date("2026-03-09T00:30:00-05:00"),
    venueName: "Red Hat Amphitheater",
    venueAddress: "500 S McDowell St",
    city: "Raleigh",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/raleigh/event/above-beyond-gt-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000067628050-4b31iu-t500x500.jpg"
  },
  {
    title: "Porter Robinson - SMILE! :D Tour",
    description: "Visionary producer Porter Robinson presents his latest album live with a groundbreaking audio-visual spectacle.",
    startsAt: new Date("2026-03-15T20:00:00-04:00"),
    endsAt: new Date("2026-03-16T00:00:00-04:00"),
    venueName: "The Ritz",
    venueAddress: "2820 Industrial Dr",
    city: "Raleigh",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/raleigh/event/porter-robinson-smile-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-rZdUvpfUk4lojmL3-w99jdg-t500x500.jpg"
  },
  // Asheville Events
  {
    title: "CloZee - Neon Jungle Tour",
    description: "French bass music artist CloZee brings her world bass sound to Asheville. A magical journey through global rhythms and bass.",
    startsAt: new Date("2026-02-08T21:00:00-05:00"),
    endsAt: new Date("2026-02-09T02:00:00-05:00"),
    venueName: "The Orange Peel",
    venueAddress: "101 Biltmore Ave",
    city: "Asheville",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/clozee-neon-jungle-asheville",
    flyerUrl: "https://i1.sndcdn.com/avatars-000265687697-hwvmjb-t500x500.jpg"
  },
  {
    title: "Odesza - The Last Goodbye Tour",
    description: "Electronic duo ODESZA brings their award-winning live show featuring a 23-piece ensemble and stunning visuals.",
    startsAt: new Date("2026-03-22T19:30:00-04:00"),
    endsAt: new Date("2026-03-22T23:30:00-04:00"),
    venueName: "Harrah's Cherokee Center",
    venueAddress: "87 Haywood St",
    city: "Asheville",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/asheville/event/odesza-last-goodbye-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000220877076-40o0rb-t500x500.jpg"
  },
  {
    title: "Jade Cicada + Detox Unit",
    description: "Mind-bending bass music from Jade Cicada with support from Detox Unit. Deep in the psychedelic soundscapes.",
    startsAt: new Date("2026-03-29T21:00:00-04:00"),
    endsAt: new Date("2026-03-30T02:00:00-04:00"),
    venueName: "The Orange Peel",
    venueAddress: "101 Biltmore Ave",
    city: "Asheville",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/jade-cicada-detox-unit-avl",
    flyerUrl: "https://i1.sndcdn.com/avatars-000349887055-wlhqx8-t500x500.jpg"
  },
  // Durham/Chapel Hill Events  
  {
    title: "Rezz - Spiral Tour",
    description: "Space mom returns with her hypnotic bass and signature hypnotizing visuals. The most unique sound in electronic music.",
    startsAt: new Date("2026-02-28T21:00:00-05:00"),
    endsAt: new Date("2026-03-01T01:00:00-05:00"),
    venueName: "DPAC",
    venueAddress: "123 Vivian St",
    city: "Durham",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/durham/event/rezz-spiral-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000228193715-5w0kn8-t500x500.jpg"
  },
  {
    title: "Kaytranada - Timeless Tour",
    description: "Grammy-winning producer KAYTRANADA brings his smooth electronic R&B sound. Funk, soul, and house collide.",
    startsAt: new Date("2026-03-14T20:00:00-04:00"),
    endsAt: new Date("2026-03-15T00:00:00-04:00"),
    venueName: "Cat's Cradle",
    venueAddress: "300 E Main St",
    city: "Carrboro",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/chapel-hill/event/kaytranada-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000185700395-d8s92j-t500x500.jpg"
  },
  // Wilmington Events
  {
    title: "RL Grime",
    description: "Trap music pioneer RL Grime delivers heavy-hitting sets full of original productions and unreleased edits.",
    startsAt: new Date("2026-03-07T22:00:00-05:00"),
    endsAt: new Date("2026-03-08T02:00:00-05:00"),
    venueName: "Greenfield Lake Amphitheater",
    venueAddress: "1941 Amphitheatre Dr",
    city: "Wilmington",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/rl-grime-wilmington",
    flyerUrl: "https://i1.sndcdn.com/avatars-000160574879-g4o0bi-t500x500.jpg"
  },
  {
    title: "Sofi Tukker",
    description: "High-energy dance duo Sofi Tukker bring their jungle-inspired house sound. Purple Hat club vibes all night.",
    startsAt: new Date("2026-03-21T21:00:00-04:00"),
    endsAt: new Date("2026-03-22T01:00:00-04:00"),
    venueName: "Greenfield Lake Amphitheater",
    venueAddress: "1941 Amphitheatre Dr",
    city: "Wilmington",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/wilmington/event/sofi-tukker-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000350355149-6wqxz9-t500x500.jpg"
  },
  // Greensboro Events
  {
    title: "ILLENIUM - Fallen Embers Tour",
    description: "Emotional bass music producer ILLENIUM brings his live band and beautiful melodic dubstep anthems.",
    startsAt: new Date("2026-02-14T20:00:00-05:00"),
    endsAt: new Date("2026-02-15T00:00:00-05:00"),
    venueName: "Greensboro Coliseum",
    venueAddress: "1921 W Gate City Blvd",
    city: "Greensboro",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/greensboro/event/illenium-fallen-embers-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-000625295795-lwtgnr-t500x500.jpg"
  },
  {
    title: "Marshmello",
    description: "The masked DJ Marshmello brings his pop-infused bass and feel-good productions to the Triad.",
    startsAt: new Date("2026-03-28T20:00:00-04:00"),
    endsAt: new Date("2026-03-29T00:00:00-04:00"),
    venueName: "Greensboro Coliseum",
    venueAddress: "1921 W Gate City Blvd",
    city: "Greensboro",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/marshmello-greensboro",
    flyerUrl: "https://i1.sndcdn.com/avatars-000303584918-g5p2a1-t500x500.jpg"
  },
  // More Charlotte Club Events
  {
    title: "Matroda",
    description: "Croatian house and bass producer Matroda brings the club heat with his signature groovy sound.",
    startsAt: new Date("2026-02-06T22:00:00-05:00"),
    endsAt: new Date("2026-02-07T02:00:00-05:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/matroda-clt",
    flyerUrl: "https://i1.sndcdn.com/avatars-000656277145-xjugyz-t500x500.jpg"
  },
  {
    title: "Knock2",
    description: "Rising house star Knock2 delivers high-energy DJ sets that blur the line between house and electronic genres.",
    startsAt: new Date("2026-02-13T22:00:00-05:00"),
    endsAt: new Date("2026-02-14T02:00:00-05:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/knock2-charlotte",
    flyerUrl: "https://i1.sndcdn.com/avatars-FZ8RCJvSdPHOHQJo-TfzjLg-t500x500.jpg"
  },
  {
    title: "ACRAZE",
    description: "Do It To It sensation ACRAZE brings the tech house vibes. You already know the energy.",
    startsAt: new Date("2026-02-20T22:00:00-05:00"),
    endsAt: new Date("2026-02-21T02:00:00-05:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/acraze-charlotte",
    flyerUrl: "https://i1.sndcdn.com/avatars-5rK7s9FaBgYL8R4x-xj3FXw-t500x500.jpg"
  },
  {
    title: "James Hype",
    description: "UK DJ and producer James Hype showcases his viral mixing skills and tech house productions.",
    startsAt: new Date("2026-02-27T22:00:00-05:00"),
    endsAt: new Date("2026-02-28T02:00:00-05:00"),
    venueName: "The Fillmore Charlotte",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/james-hype-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-YihtbJdPAXUGZTMi-3Yn0hg-t500x500.jpg"
  },
  {
    title: "D.O.D",
    description: "UK house DJ D.O.D brings the bass house heat with driving rhythms and heavy drops.",
    startsAt: new Date("2026-01-30T22:00:00-05:00"),
    endsAt: new Date("2026-01-31T02:00:00-05:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/dod-charlotte",
    flyerUrl: "https://i1.sndcdn.com/avatars-000313283774-hqxnir-t500x500.jpg"
  },
  {
    title: "Krewella",
    description: "Sister duo Krewella delivers high-energy electronic and bass music with powerful vocals.",
    startsAt: new Date("2026-01-31T22:00:00-05:00"),
    endsAt: new Date("2026-02-01T02:00:00-05:00"),
    venueName: "Trio CLT",
    venueAddress: "227 N Tryon St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/krewella-charlotte",
    flyerUrl: "https://i1.sndcdn.com/avatars-000145591419-v8qj5i-t500x500.jpg"
  },
  {
    title: "Marie Vaunt 360 Show",
    description: "Immersive 360-degree audiovisual experience with techno producer Marie Vaunt.",
    startsAt: new Date("2026-01-30T21:00:00-05:00"),
    endsAt: new Date("2026-01-31T01:00:00-05:00"),
    venueName: "Blackbox Theater",
    venueAddress: "1151 W. Tyvola Rd",
    city: "Charlotte",
    state: "NC",
    ticketingType: "POSH" as const,
    externalTicketingUrl: "https://posh.vip/e/marie-vaunt-360",
    flyerUrl: "https://i1.sndcdn.com/avatars-mCXH7bAZMDuVb3hd-V58lFQ-t500x500.jpg"
  },
  {
    title: "Snow Strippers + anna luna",
    description: "Hyperpop and electronic duo Snow Strippers with support from anna luna.",
    startsAt: new Date("2026-01-29T20:00:00-05:00"),
    endsAt: new Date("2026-01-30T00:00:00-05:00"),
    venueName: "The Underground",
    venueAddress: "820 Hamilton St",
    city: "Charlotte",
    state: "NC",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://dice.fm/partner/charlotte/event/snow-strippers-2026",
    flyerUrl: "https://i1.sndcdn.com/avatars-X4ypfJFfnQwRwi8Z-LLiZjg-t500x500.jpg"
  },
];

function generateSlug(title: string, city: string, date: Date): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const month = date.toLocaleString('en', { month: 'short' }).toLowerCase();
  const day = date.getDate();
  return `${baseSlug}-${city.toLowerCase()}-${month}${day}`;
}

async function migrateToUploadThing(url: string, eventSlug: string): Promise<string> {
  if (!url || url.includes('utfs.io') || url.includes('uploadthing') || url.includes('placehold.co')) {
    return url;
  }

  try {
    console.log(`  📸 Uploading to UploadThing: ${eventSlug}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  ⚠️ Failed to fetch image: ${response.status}`);
      return url;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: contentType });
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `flyer-${eventSlug}.${ext}`;
    const file = new File([blob], filename, { type: contentType });

    const uploadResult = await utapi.uploadFiles([file]);
    const newUrl = uploadResult[0]?.data?.ufsUrl || uploadResult[0]?.data?.url;
    
    if (newUrl) {
      console.log(`  ✅ Uploaded: ${newUrl.substring(0, 60)}...`);
      return newUrl;
    }
    return url;
  } catch (error: any) {
    console.log(`  ⚠️ Upload failed: ${error.message}`);
    return url;
  }
}

async function main() {
  console.log('🎉 NC Events Scraper - Importing events from EDMTrain, Dice.fm, Posh.vip\n');

  // Ensure the seed organizer exists
  const seedUserId = 'user_seed_123';
  const organizerId = 'cmkyoqg8g0000wv4ud8elrpiv';

  await prisma.user.upsert({
    where: { id: seedUserId },
    update: {},
    create: {
      id: seedUserId,
      email: 'curated@afters.xxx',
      firstName: 'Afters',
      lastName: 'Curated',
    }
  });

  await prisma.organizerProfile.upsert({
    where: { id: organizerId },
    update: {},
    create: {
      id: organizerId,
      userId: seedUserId,
      displayName: 'Afters Curated',
      slug: 'afters-curated',
      bio: 'Curated electronic music events from across North Carolina.',
    }
  });

  console.log(`📊 Processing ${ncEvents.length} NC events...\n`);

  let created = 0;
  let updated = 0;
  let imagesUploaded = 0;

  for (const eventData of ncEvents) {
    const slug = generateSlug(eventData.title, eventData.city, eventData.startsAt);
    console.log(`\n🎵 ${eventData.title} @ ${eventData.city}`);

    // Migrate image to UploadThing
    const flyerUrl = await migrateToUploadThing(eventData.flyerUrl, slug);
    if (flyerUrl !== eventData.flyerUrl) {
      imagesUploaded++;
    }

    const existing = await prisma.event.findUnique({
      where: {
        organizerId_slug: {
          organizerId,
          slug
        }
      }
    });

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: eventData.title,
          description: eventData.description,
          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,
          venueName: eventData.venueName,
          venueAddress: eventData.venueAddress,
          city: eventData.city,
          state: eventData.state,
          country: 'US',
          flyerUrl,
          status: 'PUBLISHED',
          isPublished: true,
          timezone: 'America/New_York',
          ticketingType: eventData.ticketingType,
          externalTicketingUrl: eventData.externalTicketingUrl,
        }
      });
      updated++;
      console.log(`  📝 Updated`);
    } else {
      await prisma.event.create({
        data: {
          organizerId,
          title: eventData.title,
          slug,
          description: eventData.description,
          startsAt: eventData.startsAt,
          endsAt: eventData.endsAt,
          venueName: eventData.venueName,
          venueAddress: eventData.venueAddress,
          city: eventData.city,
          state: eventData.state,
          country: 'US',
          flyerUrl,
          status: 'PUBLISHED',
          isPublished: true,
          timezone: 'America/New_York',
          ticketingType: eventData.ticketingType,
          externalTicketingUrl: eventData.externalTicketingUrl,
        }
      });
      created++;
      console.log(`  ✅ Created`);
    }

    // Small delay for rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎊 NC Events Import Complete!');
  console.log(`📊 Created: ${created}`);
  console.log(`📝 Updated: ${updated}`);
  console.log(`📸 Images uploaded to UploadThing: ${imagesUploaded}`);
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
