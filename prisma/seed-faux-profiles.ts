import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface FauxArtist {
  artistName: string
  slug: string
  bio: string
  avatarUrl: string
  genres: string
  spotifyUrl?: string
  soundcloudUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  websiteUrl?: string
  youtubeUrl?: string
}

// Faux artist profiles - popular DJs/producers
const fauxArtists: FauxArtist[] = [
  {
    artistName: "Chris Lake",
    slug: "chris-lake",
    bio: "Grammy-nominated British DJ and producer. Known for tech house bangers and high-energy performances.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-1.jpg",
    genres: "Tech House, House",
    spotifyUrl: "https://open.spotify.com/artist/7qG3b048QCHVRO5Pv1T5lw",
    soundcloudUrl: "https://soundcloud.com/chrislake",
    instagramUrl: "https://instagram.com/chrislake",
  },
  {
    artistName: "Fisher",
    slug: "fisher",
    bio: "Australian DJ and producer. From pro surfer to global tech house phenomenon. Losing It never gets old.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-2.jpg",
    genres: "Tech House, Bass House",
    spotifyUrl: "https://open.spotify.com/artist/2feDdbD5araYcm6JhFHHw7",
    instagramUrl: "https://instagram.com/followthefish",
  },
  {
    artistName: "John Summit",
    slug: "john-summit",
    bio: "Chicago-based house music producer. Deep Space tour selling out arenas worldwide.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-3.jpg",
    genres: "House, Tech House",
    spotifyUrl: "https://open.spotify.com/artist/0QOc9q7xNFLvZdK8zMXvgh",
    instagramUrl: "https://instagram.com/johnsummit",
    twitterUrl: "https://twitter.com/johnsummit",
  },
  {
    artistName: "Mochakk",
    slug: "mochakk",
    bio: "Brazilian DJ bringing the heat with groovy house and tech house vibes.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-4.jpg",
    genres: "House, Tech House",
    soundcloudUrl: "https://soundcloud.com/mochakk",
    instagramUrl: "https://instagram.com/mochakk",
  },
  {
    artistName: "Acraze",
    slug: "acraze",
    bio: "Grammy-nominated producer behind 'Do It To It'. Bass house meets mainstream success.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-5.jpg",
    genres: "Bass House, Tech House",
    spotifyUrl: "https://open.spotify.com/artist/4rs3CmipDaJbz7kB8WXz5p",
    instagramUrl: "https://instagram.com/aaboreal",
  },
  {
    artistName: "Dom Dolla",
    slug: "dom-dolla",
    bio: "Australian house maestro. 'Rhyme Dust' changed the game.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-6.jpg",
    genres: "House, Tech House",
    spotifyUrl: "https://open.spotify.com/artist/0c76C8CZqvsBj7hYqT8JiG",
    instagramUrl: "https://instagram.com/domdolla",
  },
  {
    artistName: "Vintage Culture",
    slug: "vintage-culture",
    bio: "Brazilian DJ and producer. Melodic house with emotional depth.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-7.jpg",
    genres: "House, Melodic House",
    spotifyUrl: "https://open.spotify.com/artist/6lFb0mjjOL3GIWWttSmGAk",
    instagramUrl: "https://instagram.com/vintageculture",
  },
  {
    artistName: "Skrillex",
    slug: "skrillex",
    bio: "The dubstep pioneer who keeps reinventing electronic music. Multiple Grammy winner.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-artist-8.jpg",
    genres: "Dubstep, Bass, House",
    spotifyUrl: "https://open.spotify.com/artist/5he5w2lnU9x7JFhnwcekXX",
    instagramUrl: "https://instagram.com/skrillex",
  },
]

interface FauxPersonal {
  displayName: string
  slug: string
  bio: string
  avatarUrl: string
  instagramUrl?: string
  websiteUrl?: string
  twitterUrl?: string
}

// Faux personal profiles - music fans
const fauxPersonals: FauxPersonal[] = [
  {
    displayName: "Rave Enthusiast",
    slug: "rave-enthusiast",
    bio: "Living for the weekend. House music saves lives.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-user-1.jpg",
    instagramUrl: "https://instagram.com/raveenthusiast",
  },
  {
    displayName: "Night Owl",
    slug: "night-owl",
    bio: "Techno til sunrise. Berlin vibes in LA.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-user-2.jpg",
  },
  {
    displayName: "Bass Head",
    slug: "bass-head",
    bio: "If the bass doesn't drop, I don't drop. Festival season is my season.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-user-3.jpg",
  },
  {
    displayName: "Groove Seeker",
    slug: "groove-seeker",
    bio: "Deep house, soulful vibes, and good company.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-user-4.jpg",
    websiteUrl: "https://grooveseeker.com",
  },
  {
    displayName: "Techno Tourist",
    slug: "techno-tourist",
    bio: "Traveling the world one club at a time. Berghain was just the beginning.",
    avatarUrl: "https://utfs.io/f/qgd5wudxon/placeholder-user-5.jpg",
  },
]

async function main() {
  console.log("Creating faux artist profiles...")
  
  for (let i = 0; i < fauxArtists.length; i++) {
    const artist = fauxArtists[i]
    const fauxUserId = `faux_artist_${i + 1}`
    
    // Check if already exists
    const existing = await prisma.artistProfile.findUnique({ 
      where: { slug: artist.slug } 
    })
    if (existing) {
      console.log(`  Skipping ${artist.artistName} (already exists)`)
      continue
    }

    // Create faux user first
    const user = await prisma.user.upsert({
      where: { id: fauxUserId },
      update: {},
      create: {
        id: fauxUserId,
        email: `${artist.slug}@faux.afters.xxx`,
        username: artist.slug,
        firstName: artist.artistName.split(' ')[0],
        lastName: artist.artistName.split(' ').slice(1).join(' ') || null,
        role: 'ARTIST',
        isFaux: true,
      }
    })

    // Create artist profile
    await prisma.artistProfile.create({
      data: {
        userId: user.id,
        artistName: artist.artistName,
        slug: artist.slug,
        bio: artist.bio,
        avatarUrl: artist.avatarUrl,
        genres: artist.genres,
        spotifyUrl: artist.spotifyUrl,
        soundcloudUrl: artist.soundcloudUrl,
        instagramUrl: artist.instagramUrl,
        twitterUrl: artist.twitterUrl,
        websiteUrl: artist.websiteUrl,
        youtubeUrl: artist.youtubeUrl,
        isVerified: true, // Faux artists are "verified"
        isFaux: true,
      }
    })
    
    console.log(`  Created artist: ${artist.artistName}`)
  }

  console.log("\nCreating faux personal profiles...")
  
  for (let i = 0; i < fauxPersonals.length; i++) {
    const personal = fauxPersonals[i]
    const fauxUserId = `faux_personal_${i + 1}`
    
    // Check if already exists
    const existing = await prisma.personalProfile.findUnique({ 
      where: { slug: personal.slug } 
    })
    if (existing) {
      console.log(`  Skipping ${personal.displayName} (already exists)`)
      continue
    }

    // Create faux user first
    const user = await prisma.user.upsert({
      where: { id: fauxUserId },
      update: {},
      create: {
        id: fauxUserId,
        email: `${personal.slug}@faux.afters.xxx`,
        username: personal.slug,
        firstName: personal.displayName.split(' ')[0],
        lastName: personal.displayName.split(' ').slice(1).join(' ') || null,
        role: 'PERSONAL',
        isFaux: true,
      }
    })

    // Create personal profile
    await prisma.personalProfile.create({
      data: {
        userId: user.id,
        displayName: personal.displayName,
        slug: personal.slug,
        bio: personal.bio,
        avatarUrl: personal.avatarUrl,
        websiteUrl: personal.websiteUrl,
        instagramUrl: personal.instagramUrl,
        isPublic: true,
        isFaux: true,
      }
    })
    
    console.log(`  Created personal profile: ${personal.displayName}`)
  }

  console.log("\nDone! Created faux profiles.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
