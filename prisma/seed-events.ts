import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Sample events scraped from posh.vip and edmtrain
const events = [
  // EDMTrain events - NYC
  {
    title: "Danny L Harle",
    slug: "danny-l-harle-jan27",
    description: "Electronic music producer Danny L Harle brings his unique PC Music sound to Brooklyn.",
    startsAt: new Date("2026-01-27T22:00:00-05:00"),
    endsAt: new Date("2026-01-28T04:00:00-05:00"),
    venueName: "SILO Brooklyn",
    venueAddress: "372 Flushing Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Fox Stevenson",
    slug: "fox-stevenson-jan29",
    description: "Drum and bass / electronic artist Fox Stevenson live at Elsewhere Hall.",
    startsAt: new Date("2026-01-29T20:00:00-05:00"),
    endsAt: new Date("2026-01-30T02:00:00-05:00"),
    venueName: "Elsewhere Hall",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 16,
  },
  {
    title: "Machinedrum",
    slug: "machinedrum-jan29",
    description: "Travis Stewart aka Machinedrum - electronic music producer known for his genre-blending style.",
    startsAt: new Date("2026-01-29T22:00:00-05:00"),
    endsAt: new Date("2026-01-30T04:00:00-05:00"),
    venueName: "Public Records",
    venueAddress: "233 Butler St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Open To Close: Mind Against",
    slug: "mind-against-jan30",
    description: "Italian techno duo Mind Against delivers a full open-to-close set at Knockdown Center.",
    startsAt: new Date("2026-01-30T22:00:00-05:00"),
    endsAt: new Date("2026-01-31T08:00:00-05:00"),
    venueName: "Knockdown Center",
    venueAddress: "52-19 Flushing Ave",
    city: "Queens",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Riot Ten + Ruvlo",
    slug: "riot-ten-ruvlo-jan30",
    description: "Dubstep and bass music takeover with Riot Ten and Ruvlo.",
    startsAt: new Date("2026-01-30T22:00:00-05:00"),
    endsAt: new Date("2026-01-31T04:00:00-05:00"),
    venueName: "Brooklyn Monarch",
    venueAddress: "23 Meadow St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: null,
  },
  {
    title: "Hybrid Minds",
    slug: "hybrid-minds-jan30",
    description: "Liquid drum and bass duo Hybrid Minds bring their melodic sound to SILO.",
    startsAt: new Date("2026-01-30T22:00:00-05:00"),
    endsAt: new Date("2026-01-31T04:00:00-05:00"),
    venueName: "SILO Brooklyn",
    venueAddress: "372 Flushing Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Surf Mesa",
    slug: "surf-mesa-jan30",
    description: "House music rising star Surf Mesa at Elsewhere.",
    startsAt: new Date("2026-01-30T22:00:00-05:00"),
    endsAt: new Date("2026-01-31T04:00:00-05:00"),
    venueName: "Elsewhere",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Valentino Khan",
    slug: "valentino-khan-jan31",
    description: "Grammy-nominated producer Valentino Khan brings his high-energy bass house to Marquee.",
    startsAt: new Date("2026-01-31T22:00:00-05:00"),
    endsAt: new Date("2026-02-01T04:00:00-05:00"),
    venueName: "Marquee",
    venueAddress: "289 10th Ave",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Weval",
    slug: "weval-jan31",
    description: "Dutch electronic duo Weval - known for their hypnotic, atmospheric productions.",
    startsAt: new Date("2026-01-31T21:00:00-05:00"),
    endsAt: new Date("2026-02-01T03:00:00-05:00"),
    venueName: "Elsewhere Hall",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 16,
  },
  {
    title: "Detroit Love: Carl Craig",
    slug: "detroit-love-carl-craig-jan31",
    description: "Legendary Detroit techno pioneer Carl Craig with DJ Holographic, Van Der Laan, and Skin.",
    startsAt: new Date("2026-01-31T22:00:00-05:00"),
    endsAt: new Date("2026-02-01T06:00:00-05:00"),
    venueName: "Superior Ingredients",
    venueAddress: "49 Bogart St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Oliver Smith",
    slug: "oliver-smith-jan31",
    description: "Anjunabeats artist Oliver Smith with Coastlines at SILO Brooklyn.",
    startsAt: new Date("2026-01-31T22:00:00-05:00"),
    endsAt: new Date("2026-02-01T04:00:00-05:00"),
    venueName: "SILO Brooklyn",
    venueAddress: "372 Flushing Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Ekali",
    slug: "ekali-feb5",
    description: "Canadian producer Ekali brings his emotional bass music to Brooklyn Bowl.",
    startsAt: new Date("2026-02-05T21:00:00-05:00"),
    endsAt: new Date("2026-02-06T02:00:00-05:00"),
    venueName: "Brooklyn Bowl",
    venueAddress: "61 Wythe Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "DVS1",
    slug: "dvs1-feb5",
    description: "Minneapolis techno legend DVS1 at Green Room NYC.",
    startsAt: new Date("2026-02-05T23:00:00-05:00"),
    endsAt: new Date("2026-02-06T06:00:00-05:00"),
    venueName: "Green Room NYC",
    venueAddress: "409 Grand St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: null,
  },
  {
    title: "Ray Volpe + Virtual Riot",
    slug: "ray-volpe-virtual-riot-feb7",
    description: "Dubstep heavyweights Ray Volpe and Virtual Riot take over Terminal 5.",
    startsAt: new Date("2026-02-07T20:00:00-05:00"),
    endsAt: new Date("2026-02-08T02:00:00-05:00"),
    venueName: "Terminal 5",
    venueAddress: "610 W 56th St",
    city: "New York",
    state: "NY",
    ageRestriction: 18,
  },
  {
    title: "ALLEYCVT",
    slug: "alleycvt-feb7",
    description: "Rising bass music star ALLEYCVT with Zen Selekta at Brooklyn Steel.",
    startsAt: new Date("2026-02-07T21:00:00-05:00"),
    endsAt: new Date("2026-02-08T03:00:00-05:00"),
    venueName: "Brooklyn Steel",
    venueAddress: "319 Frost St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 18,
  },
  {
    title: "Teletech: Hannah Laing + Trym",
    slug: "teletech-hannah-laing-feb7",
    description: "UK techno takeover with Hannah Laing, Trym, Azyr, KLOFAMA and more.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T06:00:00-05:00"),
    venueName: "Brooklyn Storehouse",
    venueAddress: "217 N 14th St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Habstrakt",
    slug: "habstrakt-feb7",
    description: "French bass house producer Habstrakt with Asdek at Elsewhere.",
    startsAt: new Date("2026-02-07T22:00:00-05:00"),
    endsAt: new Date("2026-02-08T04:00:00-05:00"),
    venueName: "Elsewhere",
    venueAddress: "599 Johnson Ave",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Kölsch + Brina Knauss",
    slug: "kolsch-feb8",
    description: "Danish melodic techno master Kölsch with Brina Knauss.",
    startsAt: new Date("2026-02-08T16:00:00-05:00"),
    endsAt: new Date("2026-02-08T23:00:00-05:00"),
    venueName: "Superior Ingredients",
    venueAddress: "49 Bogart St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "Spring Festival: Louis The Child + Porter Robinson",
    slug: "spring-festival-lunar-new-year-feb13",
    description: "Massive Lunar New Year celebration with Louis The Child, Porter Robinson, and Alan Walker.",
    startsAt: new Date("2026-02-13T18:00:00-05:00"),
    endsAt: new Date("2026-02-15T23:59:00-05:00"),
    venueName: "Brooklyn Hangar",
    venueAddress: "2 52nd St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  // Posh events
  {
    title: "TRC 052: Anita Baker - Rapture",
    slug: "trc-052-anita-baker-rapture",
    description: "The Record Club presents a listening session celebrating Anita Baker's classic album Rapture.",
    startsAt: new Date("2026-01-29T20:00:00-05:00"),
    endsAt: new Date("2026-01-30T00:00:00-05:00"),
    venueName: "Public Records",
    venueAddress: "233 Butler St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "TRC 053: Michael Jackson - Thriller",
    slug: "trc-053-michael-jackson-thriller",
    description: "The Record Club presents a listening session for Michael Jackson's legendary Thriller album.",
    startsAt: new Date("2026-01-30T20:00:00-05:00"),
    endsAt: new Date("2026-01-31T00:00:00-05:00"),
    venueName: "Public Records",
    venueAddress: "233 Butler St",
    city: "Brooklyn",
    state: "NY",
    ageRestriction: 21,
  },
  {
    title: "IZAKAYA NIGHT",
    slug: "izakaya-night-jan29",
    description: "Cars, Vinyl, Chef-Served Hand Rolls & Sake - presented by Car Part Time with Raw Like Sushi and EVISU.",
    startsAt: new Date("2026-01-29T19:00:00-05:00"),
    endsAt: new Date("2026-01-29T23:00:00-05:00"),
    venueName: "Car Part Time",
    venueAddress: "TBA",
    city: "New York",
    state: "NY",
    ageRestriction: 21,
  },
]

async function main() {
  console.log('🎉 Seeding events for Afters.xxx...\n')

  // First, check if we have an organizer profile. If not, create a system one.
  let organizer = await prisma.organizerProfile.findFirst({
    where: { slug: 'afters-curated' }
  })

  if (!organizer) {
    // We need a user first - check for system user or create the organizer differently
    // For now, let's check existing organizers
    organizer = await prisma.organizerProfile.findFirst()
    
    if (!organizer) {
      console.log('❌ No organizer profile found. Please create a user and organizer profile first.')
      console.log('   Run the app and create an account, then run this seed again.')
      return
    }
  }

  console.log(`📋 Using organizer: ${organizer.displayName} (${organizer.slug})\n`)

  let created = 0
  let skipped = 0

  for (const event of events) {
    // Check if event already exists
    const existing = await prisma.event.findFirst({
      where: { 
        organizerId: organizer.id,
        slug: event.slug 
      }
    })

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${event.title}`)
      skipped++
      continue
    }

    await prisma.event.create({
      data: {
        ...event,
        organizerId: organizer.id,
        status: 'PUBLISHED',
        isPublished: true,
      }
    })

    console.log(`✅ Created: ${event.title} @ ${event.venueName}`)
    created++
  }

  console.log(`\n🎊 Done! Created ${created} events, skipped ${skipped} existing.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
