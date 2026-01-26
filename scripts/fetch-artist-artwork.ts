import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Extract primary artist from event title
function extractArtist(title: string): string {
  return title
    .replace(/\s*[-–]\s*(Night \d+|Day \d+)$/i, '')
    .replace(/\s*\+\s*.+$/, '')
    .replace(/\s*b2b\s*.+$/i, '')
    .replace(/\s*@\s*.+$/, '')
    .replace(/\s*:\s*.+$/, '')
    .replace(/\s*(360 Show|Tour|Live|DJ Set|Official|Afterparty|Full Circle Tour|I Love My Computer Tour|All Access Tour|Make Some Noise Tour|Burning Out Winter Tour|Psychowarrior Tour|Midnight Mass|MIRRORVERSE TOUR|9 Lives Tour)$/i, '')
    .replace(/\s*(Night \d+|Day \d+)$/i, '')
    .trim()
}

// Cache to avoid duplicate API calls for same artist
const artistCache = new Map<string, string | null>()

// Search iTunes for artist album artwork (free API, no auth needed)
async function searchItunesArtwork(artist: string): Promise<string | null> {
  // Check cache first
  const cacheKey = artist.toLowerCase()
  if (artistCache.has(cacheKey)) {
    return artistCache.get(cacheKey) || null
  }

  try {
    const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&limit=3`
    const res = await fetch(searchUrl)
    
    if (!res.ok) {
      artistCache.set(cacheKey, null)
      return null
    }

    const data = await res.json()
    
    // Find result matching the artist name closely
    for (const result of data.results || []) {
      if (result.artistName?.toLowerCase().includes(artist.toLowerCase().split(' ')[0]) && result.artworkUrl100) {
        // Upscale artwork from 100x100 to 600x600
        const highResUrl = result.artworkUrl100.replace('100x100bb', '600x600bb')
        artistCache.set(cacheKey, highResUrl)
        return highResUrl
      }
    }

    // Try song search as fallback
    const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=3`
    const songRes = await fetch(songUrl)
    
    if (songRes.ok) {
      const songData = await songRes.json()
      for (const result of songData.results || []) {
        if (result.artistName?.toLowerCase().includes(artist.toLowerCase().split(' ')[0]) && result.artworkUrl100) {
          const highResUrl = result.artworkUrl100.replace('100x100bb', '600x600bb')
          artistCache.set(cacheKey, highResUrl)
          return highResUrl
        }
      }
    }

    artistCache.set(cacheKey, null)
    return null
  } catch (error) {
    artistCache.set(cacheKey, null)
    return null
  }
}

// Generate stylish fallback with gradient and text
function generateFallbackFlyer(title: string, venue: string): string {
  const artist = extractArtist(title)
  const text = encodeURIComponent(artist.substring(0, 20))
  
  // Generate color based on artist name hash
  const hash = artist.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const colors = ['ff1493', 'e91e63', '9c27b0', '673ab7', '3f51b5', '2196f3', '00bcd4', '009688']
  const bgColor = colors[Math.abs(hash) % colors.length]
  
  return `https://placehold.co/600x600/${bgColor}/ffffff?text=${text}&font=montserrat`
}

async function main() {
  console.log('🎨 Fetching artist artwork from iTunes...\n')

  const events = await prisma.event.findMany({
    select: { id: true, title: true, venueName: true, city: true },
    orderBy: { startsAt: 'asc' }
  })

  console.log(`📊 Processing ${events.length} events\n`)

  let updated = 0
  let fromItunes = 0
  let fromFallback = 0

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const artist = extractArtist(event.title)
    
    process.stdout.write(`[${String(i + 1).padStart(3)}/${events.length}] ${artist.substring(0, 35).padEnd(35)} `)

    // Try iTunes first
    let flyerUrl = await searchItunesArtwork(artist)
    
    if (flyerUrl) {
      fromItunes++
      console.log('✅ iTunes')
    } else {
      // Fallback to stylish placeholder
      flyerUrl = generateFallbackFlyer(event.title, event.venueName)
      fromFallback++
      console.log('📝 Placeholder')
    }

    // Update database
    await prisma.event.update({
      where: { id: event.id },
      data: { flyerUrl }
    })
    updated++

    // Rate limit iTunes API (be nice)
    if (!artistCache.has(artist.toLowerCase())) {
      await delay(200)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`🎊 Complete!`)
  console.log(`📊 Total updated: ${updated}`)
  console.log(`🎵 From iTunes: ${fromItunes} (${Math.round(fromItunes/updated*100)}%)`)
  console.log(`📝 Placeholders: ${fromFallback} (${Math.round(fromFallback/updated*100)}%)`)
  console.log(`💾 Cache hits: ${artistCache.size} unique artists`)
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
