import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { UTApi } from 'uploadthing/server';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

// NYC EDM events scraped from EDMTrain (2026-02-03)
const nycEvents = [
  // Highlighted Events
  {
    title: "Spring Festival - Lunar New Year: Porter Robinson, Alan Walker, Wavedash, Mike Posner",
    description: "Massive Lunar New Year celebration featuring electronic music icons Porter Robinson and Alan Walker, plus Wavedash and Mike Posner.",
    startsAt: new Date("2026-02-14T21:00:00-05:00"),
    endsAt: new Date("2026-02-15T04:00:00-05:00"),
    venueName: "Brooklyn Hangar",
    venueAddress: "2 52nd St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/spring-festival-lunar-new-year-459159?get=multiday"
  },
  {
    title: "ILLENIUM b2b Dabin",
    description: "An unforgettable back-to-back set from melodic bass titans ILLENIUM and Dabin at Under the 'K' Bridge Park.",
    startsAt: new Date("2026-05-30T18:00:00-04:00"),
    endsAt: new Date("2026-05-30T23:00:00-04:00"),
    venueName: "Under the 'K' Bridge Park",
    venueAddress: "20 Main St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/illenium-dabin-469542?get=tickets"
  },
  // Recently Added
  {
    title: "Purple Disco Machine",
    description: "German producer Purple Disco Machine brings his signature disco-house sound to Central Park SummerStage.",
    startsAt: new Date("2026-06-28T17:00:00-04:00"),
    endsAt: new Date("2026-06-28T22:00:00-04:00"),
    venueName: "Central Park SummerStage",
    venueAddress: "Rumsey Playfield, Central Park",
    city: "New York",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/purple-disco-machine-474130"
  },
  {
    title: "Alok",
    description: "Brazilian superstar DJ Alok brings his energetic house and bass music to Marquee NYC.",
    startsAt: new Date("2026-03-07T22:00:00-05:00"),
    endsAt: new Date("2026-03-08T04:00:00-05:00"),
    venueName: "Marquee",
    venueAddress: "289 10th Ave",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/alok-474128"
  },
  {
    title: "Sonny Fodera",
    description: "UK house music maestro Sonny Fodera takes over Knockdown Center for a proper warehouse rave.",
    startsAt: new Date("2026-05-09T22:00:00-04:00"),
    endsAt: new Date("2026-05-10T04:00:00-04:00"),
    venueName: "Knockdown Center",
    venueAddress: "52-19 Flushing Ave",
    city: "Queens",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/sonny-fodera-473634"
  },
  {
    title: "Paco Osuna",
    description: "Spanish techno legend Paco Osuna delivers a deep, driving set at 99 Scott.",
    startsAt: new Date("2026-06-12T23:00:00-04:00"),
    endsAt: new Date("2026-06-13T05:00:00-04:00"),
    venueName: "99 Scott",
    venueAddress: "99 Scott Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/paco-osuna-474039"
  },
  {
    title: "Rebūke",
    description: "Irish rave techno producer Rebūke brings the energy to 99 Scott.",
    startsAt: new Date("2026-04-04T23:00:00-04:00"),
    endsAt: new Date("2026-04-05T05:00:00-04:00"),
    venueName: "99 Scott",
    venueAddress: "99 Scott Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/rebuke-474038"
  },
  {
    title: "Adriatique",
    description: "Swiss melodic techno duo Adriatique perform at Brooklyn Army Terminal Pier.",
    startsAt: new Date("2026-07-18T17:00:00-04:00"),
    endsAt: new Date("2026-07-18T23:00:00-04:00"),
    venueName: "Brooklyn Army Terminal (Pier)",
    venueAddress: "140 58th St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/adriatique-474015"
  },
  {
    title: "Madeon",
    description: "French electronic wunderkind Madeon brings his signature synth-pop sound to Marquee for Valentine's Day.",
    startsAt: new Date("2026-02-14T22:00:00-05:00"),
    endsAt: new Date("2026-02-15T04:00:00-05:00"),
    venueName: "Marquee",
    venueAddress: "289 10th Ave",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/madeon-473645"
  },
  {
    title: "Alesso",
    description: "Swedish progressive house titan Alesso performs at Brooklyn Army Terminal.",
    startsAt: new Date("2026-08-22T17:00:00-04:00"),
    endsAt: new Date("2026-08-22T23:00:00-04:00"),
    venueName: "Brooklyn Army Terminal (Pier)",
    venueAddress: "140 58th St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/alesso-473348"
  },
  // Upcoming Week - Feb 5-8
  {
    title: "Ekali",
    description: "Canadian producer Ekali brings his emotional bass and trap sound to Brooklyn Bowl.",
    startsAt: new Date("2026-02-05T21:00:00-05:00"),
    endsAt: new Date("2026-02-06T02:00:00-05:00"),
    venueName: "Brooklyn Bowl",
    venueAddress: "61 Wythe Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/ekali-459037"
  },
  {
    title: "DVS1, S4M23",
    description: "Techno heavyweight DVS1 brings raw, industrial sounds to Green Room NYC.",
    startsAt: new Date("2026-02-05T23:00:00-05:00"),
    endsAt: new Date("2026-02-06T06:00:00-05:00"),
    venueName: "Green Room NYC",
    venueAddress: "21 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/dvs1-s4m23-464579"
  },
  {
    title: "Wilkinson, Nate Band, Yetti, Johnny Mahon",
    description: "UK drum & bass legend Wilkinson headlines Elsewhere with a stacked lineup.",
    startsAt: new Date("2026-02-06T22:00:00-05:00"),
    endsAt: new Date("2026-02-07T04:00:00-05:00"),
    venueName: "Elsewhere",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/wilkinson-nate-band-437528"
  },
  {
    title: "Teletech: Azyr b2b blk., Fantasm, Hannah Laing, JSMN, KLOFAMA, Trym",
    description: "Teletech presents a massive warehouse rave featuring Hannah Laing and hard-hitting techno all night.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T06:00:00-05:00"),
    venueName: "Brooklyn Storehouse",
    venueAddress: "69 Scott Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/teletech-azyr-454027"
  },
  {
    title: "Ray Volpe, Virtual Riot, EDDIE",
    description: "Dubstep heavyweights Ray Volpe and Virtual Riot bring the bass to Terminal 5.",
    startsAt: new Date("2026-02-07T20:00:00-05:00"),
    endsAt: new Date("2026-02-08T02:00:00-05:00"),
    venueName: "Terminal 5",
    venueAddress: "610 W 56th St",
    city: "New York",
    state: "NY",
    ageRestriction: 18,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/ray-volpe-virtual-riot-421254"
  },
  {
    title: "ALLEYCVT, Zen Selekta, Cozy Kev",
    description: "Rising bass music star ALLEYCVT takes over Brooklyn Steel.",
    startsAt: new Date("2026-02-07T21:00:00-05:00"),
    endsAt: new Date("2026-02-08T02:00:00-05:00"),
    venueName: "Brooklyn Steel",
    venueAddress: "319 Frost St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 18,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/alleycvt-zen-selekta-430778"
  },
  {
    title: "Habstrakt, Asdek, Ultra",
    description: "French bass house maestro Habstrakt delivers the vibes at Elsewhere.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T04:00:00-05:00"),
    venueName: "Elsewhere",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/habstrakt-asdek-457847"
  },
  {
    title: "The Ornate Project: Grum, Aquariox, Asch Pintura, ZEHV",
    description: "Progressive house night featuring Scottish producer Grum at The Meadows Brooklyn.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T04:00:00-05:00"),
    venueName: "The Meadows Brooklyn",
    venueAddress: "50 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/the-ornate-project-grum-461203"
  },
  // Sunday Feb 8
  {
    title: "Kölsch, Brina Knauss",
    description: "Danish techno maestro Kölsch brings melodic sounds to Superior Ingredients rooftop.",
    startsAt: new Date("2026-02-08T14:00:00-05:00"),
    endsAt: new Date("2026-02-08T22:00:00-05:00"),
    venueName: "Superior Ingredients (Rooftop)",
    venueAddress: "138 Rogers Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/kolsch-brina-knauss-450298"
  },
  {
    title: "Tiki Disco: Eli Escobar, DJ Lloyd, Andy Pry",
    description: "Disco party vibes at Knockdown Center with NYC legend Eli Escobar.",
    startsAt: new Date("2026-02-08T16:00:00-05:00"),
    endsAt: new Date("2026-02-08T23:00:00-05:00"),
    venueName: "Knockdown Center",
    venueAddress: "52-19 Flushing Ave",
    city: "Queens",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/tiki-disco-eli-escobar-464367"
  },
  // Valentine's Weekend Feb 13-15
  {
    title: "Loud Luxury",
    description: "Canadian house duo Loud Luxury brings the party anthems to Marquee.",
    startsAt: new Date("2026-02-13T22:00:00-05:00"),
    endsAt: new Date("2026-02-14T04:00:00-05:00"),
    venueName: "Marquee",
    venueAddress: "289 10th Ave",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/loud-luxury-459087"
  },
  {
    title: "RUSH: Héctor Oaks, Estella Boersma, BAUGRUPPE90",
    description: "Hard-hitting techno night at Knockdown Center with Héctor Oaks and Estella Boersma.",
    startsAt: new Date("2026-02-13T23:00:00-05:00"),
    endsAt: new Date("2026-02-14T06:00:00-05:00"),
    venueName: "Knockdown Center",
    venueAddress: "52-19 Flushing Ave",
    city: "Queens",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/rush-hector-oaks-459179"
  },
  {
    title: "ReSolute + BABËL Present 13th Dimension: DJ Harvey",
    description: "Legendary DJ Harvey delivers an extended set for the 13th Dimension party.",
    startsAt: new Date("2026-02-13T22:00:00-05:00"),
    endsAt: new Date("2026-02-14T08:00:00-05:00"),
    venueName: "530 W 27th Street",
    venueAddress: "530 W 27th St",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/resolute-babel-present-13th-dimension-dj-harvey-467605"
  },
  {
    title: "Monolink, Catching Flies",
    description: "German live act Monolink brings his organic house sound to Brooklyn Paramount.",
    startsAt: new Date("2026-02-14T20:00:00-05:00"),
    endsAt: new Date("2026-02-15T02:00:00-05:00"),
    venueName: "Brooklyn Paramount",
    venueAddress: "1 University Plz",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/monolink-catching-flies-426560"
  },
  {
    title: "Port Zero Tour: INFEKT, Bommer, Usaybflow",
    description: "Heavyweight dubstep at SILO Brooklyn with INFEKT and Bommer.",
    startsAt: new Date("2026-02-14T22:00:00-05:00"),
    endsAt: new Date("2026-02-15T04:00:00-05:00"),
    venueName: "SILO Brooklyn",
    venueAddress: "19 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/port-zero-tour-infekt-432771"
  },
  {
    title: "Horse Meat Disco, The Illustrious Blacks, Dangerous Rose",
    description: "Valentine's disco party with the legendary Horse Meat Disco crew at Knockdown Center.",
    startsAt: new Date("2026-02-14T22:00:00-05:00"),
    endsAt: new Date("2026-02-15T06:00:00-05:00"),
    venueName: "Knockdown Center",
    venueAddress: "52-19 Flushing Ave",
    city: "Queens",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/horse-meat-disco-the-illustrious-blacks-459659"
  },
  {
    title: "Boys Noize, Juliana Huxtable, Katie Rex, ISAbella",
    description: "German electro icon Boys Noize headlines BASEMENT NY for Valentine's.",
    startsAt: new Date("2026-02-14T23:00:00-05:00"),
    endsAt: new Date("2026-02-15T06:00:00-05:00"),
    venueName: "BASEMENT NY",
    venueAddress: "55-47 Metropolitan Ave",
    city: "Queens",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/boys-noize-juliana-huxtable-465540"
  },
  // More weekend events
  {
    title: "CID",
    description: "Grammy-winning house producer CID brings his signature sound to 99 Scott.",
    startsAt: new Date("2026-04-25T23:00:00-04:00"),
    endsAt: new Date("2026-04-26T05:00:00-04:00"),
    venueName: "99 Scott",
    venueAddress: "99 Scott Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/cid-470206?get=tickets"
  },
  {
    title: "AFROJACK (Kapuchon Set)",
    description: "Dutch legend AFROJACK performs an intimate Kapuchon set at Refuge.",
    startsAt: new Date("2026-03-12T22:00:00-04:00"),
    endsAt: new Date("2026-03-13T04:00:00-04:00"),
    venueName: "Refuge",
    venueAddress: "27 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/afrojack-kapuchon-set-473765"
  },
  {
    title: "Said The Sky, Grabbitz, zensei ゼンセー",
    description: "Melodic bass producer Said The Sky brings the feels to Brooklyn Steel.",
    startsAt: new Date("2026-06-20T20:00:00-04:00"),
    endsAt: new Date("2026-06-21T01:00:00-04:00"),
    venueName: "Brooklyn Steel",
    venueAddress: "319 Frost St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/said-the-sky-grabbitz-473751"
  },
  {
    title: "Jonas Blue",
    description: "British dance-pop producer Jonas Blue at Superior Ingredients rooftop.",
    startsAt: new Date("2026-04-25T14:00:00-04:00"),
    endsAt: new Date("2026-04-25T22:00:00-04:00"),
    venueName: "Superior Ingredients (Rooftop)",
    venueAddress: "138 Rogers Ave",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/jonas-blue-473687"
  },
  {
    title: "Kanine",
    description: "UK bass music producer Kanine headlines Elsewhere.",
    startsAt: new Date("2026-06-05T22:00:00-04:00"),
    endsAt: new Date("2026-06-06T04:00:00-04:00"),
    venueName: "Elsewhere",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/kanine-473603"
  },
  {
    title: "Andhim",
    description: "German house duo Andhim at UNVEILED Brooklyn.",
    startsAt: new Date("2026-03-14T23:00:00-04:00"),
    endsAt: new Date("2026-03-15T05:00:00-04:00"),
    venueName: "UNVEILED",
    venueAddress: "67 West St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/andhim-473946"
  },
  {
    title: "Fahlberg",
    description: "Brazilian melodic techno producer Fahlberg at UNVEILED.",
    startsAt: new Date("2026-03-13T23:00:00-04:00"),
    endsAt: new Date("2026-03-14T05:00:00-04:00"),
    venueName: "UNVEILED",
    venueAddress: "67 West St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/fahlberg-473945"
  },
  {
    title: "Romare",
    description: "British producer Romare brings his eclectic electronic sound to Public Records.",
    startsAt: new Date("2026-02-12T21:00:00-05:00"),
    endsAt: new Date("2026-02-13T03:00:00-05:00"),
    venueName: "Public Records",
    venueAddress: "233 Butler St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/romare-450276"
  },
  {
    title: "Paradiso: X-Coast, Nikki Nair, flirty800, Jubilee, DJ Lita",
    description: "Paradiso party featuring a stacked lineup of bass and club music.",
    startsAt: new Date("2026-02-13T23:00:00-05:00"),
    endsAt: new Date("2026-02-14T06:00:00-05:00"),
    venueName: "Paragon",
    venueAddress: "22 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/paradiso-x-coast-453642"
  },
  {
    title: "Ape Drums, Awen, Tiffy Vera, Asmot, Firungi",
    description: "Afro-Caribbean bass music at Superior Ingredients rooftop.",
    startsAt: new Date("2026-02-15T14:00:00-05:00"),
    endsAt: new Date("2026-02-15T22:00:00-05:00"),
    venueName: "Superior Ingredients (Rooftop)",
    venueAddress: "138 Rogers Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
    ticketingType: "DICE" as const,
    externalTicketingUrl: "https://edmtrain.com/new-york-city-ny/ape-drums-awen-450530"
  }
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

async function main() {
  console.log('🗽 NYC EDM Events Import - From EDMTrain\n');

  // Use existing Afters Curated organizer or create if doesn't exist
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
      bio: 'Official curated events from the Afters team. The best EDM events in your city.',
    }
  });

  let created = 0;
  let updated = 0;

  for (const eventData of nycEvents) {
    const baseSlug = slugify(eventData.title);
    const dateStr = eventData.startsAt.toISOString().split('T')[0];
    const slug = `${baseSlug}-${dateStr}`;

    console.log(`\n📅 ${eventData.title}`);
    console.log(`   ${eventData.venueName}, ${eventData.city}`);

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
          status: 'PUBLISHED',
          isPublished: true,
          timezone: 'America/New_York',
          ageRestriction: eventData.ageRestriction || null,
          ticketingType: eventData.ticketingType,
          externalTicketingUrl: eventData.externalTicketingUrl,
        }
      });
      updated++;
      console.log(`   📝 Updated`);
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
          status: 'PUBLISHED',
          isPublished: true,
          timezone: 'America/New_York',
          ageRestriction: eventData.ageRestriction || null,
          ticketingType: eventData.ticketingType,
          externalTicketingUrl: eventData.externalTicketingUrl,
        }
      });
      created++;
      console.log(`   ✅ Created`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('🗽 NYC Events Import Complete!');
  console.log(`📊 Created: ${created}`);
  console.log(`📝 Updated: ${updated}`);
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
