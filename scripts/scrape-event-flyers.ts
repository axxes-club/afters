import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Extract primary artist from event title
function extractArtist(title: string): string {
  return title
    .replace(/\s*[-–]\s*(Night \d+|Day \d+)$/i, '')
    .replace(/\s*\+\s*.+$/, '')
    .replace(/\s*b2b\s*.+$/i, '')
    .replace(/\s*@\s*.+$/, '')
    .replace(/\s*:\s*.+$/, '')
    .replace(/\s*(360 Show|Tour|Live|DJ Set|Official|Afterparty)$/i, '')
    .trim()
}

// Search for event flyer using Brave Search API
async function searchEventFlyer(title: string, venue: string, city: string): Promise<string | null> {
  const artist = extractArtist(title)
  const searchQuery = `${artist} 2026 tour flyer poster`
  
  try {
    // Using Brave Search API (needs BRAVE_API_KEY env var)
    const braveKey = process.env.BRAVE_API_KEY
    if (!braveKey) {
      console.log('  ⚠️  No BRAVE_API_KEY - using fallback')
      return null
    }

    const url = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(searchQuery)}&count=5&safesearch=off`
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': braveKey
      }
    })

    if (!res.ok) {
      console.log(`  ⚠️  Brave API error: ${res.status}`)
      return null
    }

    const data = await res.json()
    
    // Find a suitable image (prefer square/portrait aspect ratios typical of flyers)
    for (const result of data.results || []) {
      const imgUrl = result.properties?.url || result.thumbnail?.src
      if (imgUrl && !imgUrl.includes('placeholder')) {
        // Validate the image URL is accessible
        try {
          const imgRes = await fetch(imgUrl, { method: 'HEAD' })
          if (imgRes.ok) {
            return imgUrl
          }
        } catch {
          continue
        }
      }
    }
    
    return null
  } catch (error) {
    console.log(`  ⚠️  Search failed: ${error}`)
    return null
  }
}

// Try to find flyer from known event sources
async function findFlyerFromSources(artist: string, venue: string, city: string): Promise<string | null> {
  // Common EDM event image sources - try direct artist image search
  const sources = [
    `https://images.ra.co/dj/${encodeURIComponent(artist.toLowerCase().replace(/\s+/g, '-'))}.jpg`,
    `https://i1.sndcdn.com/avatars-${encodeURIComponent(artist.toLowerCase().replace(/\s+/g, '-'))}-large.jpg`,
  ]
  
  for (const url of sources) {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok) return url
    } catch {
      continue
    }
  }
  
  return null
}

// Generate high-quality placeholder with artist branding
function generateBrandedPlaceholder(title: string, venue: string, city: string): string {
  const artist = extractArtist(title)
  // Use a better placeholder service that generates event-style images
  const text = encodeURIComponent(artist.substring(0, 25))
  const venueText = encodeURIComponent(venue.substring(0, 20))
  
  // Generate consistent color based on artist name
  const hash = artist.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const colors = ['ff1493', 'ff2d6a', '9c27b0', '6366f1', '0ea5e9', '10b981']
  const bgColor = colors[Math.abs(hash) % colors.length]
  
  // Using placeholder with event styling
  return `https://placehold.co/800x800/${bgColor}/ffffff?text=${text}%0A%0A${venueText}&font=montserrat`
}

async function main() {
  console.log('🎨 Scraping real event flyers...\n')

  const events = await prisma.event.findMany({
    select: { id: true, title: true, venueName: true, city: true, flyerUrl: true },
    orderBy: { startsAt: 'asc' }
  })

  console.log(`📊 Processing ${events.length} events\n`)

  let updated = 0
  let fromSearch = 0
  let fromFallback = 0

  for (const event of events) {
    const artist = extractArtist(event.title)
    process.stdout.write(`🔍 ${event.title.substring(0, 50).padEnd(50)}`)
    
    // Try web search first
    let flyerUrl = await searchEventFlyer(event.title, event.venueName, event.city)
    
    if (flyerUrl) {
      fromSearch++
      console.log(' ✅ Found!')
    } else {
      // Try known sources
      flyerUrl = await findFlyerFromSources(artist, event.venueName, event.city)
      
      if (flyerUrl) {
        fromSearch++
        console.log(' ✅ Source')
      } else {
        // Fall back to branded placeholder
        flyerUrl = generateBrandedPlaceholder(event.title, event.venueName, event.city)
        fromFallback++
        console.log(' 📝 Placeholder')
      }
    }
    
    // Update database
    await prisma.event.update({
      where: { id: event.id },
      data: { flyerUrl }
    })
    updated++
    
    // Rate limit
    await delay(100)
  }

  console.log(`\n🎊 Done!`)
  console.log(`📊 Updated: ${updated}`)
  console.log(`🔍 From search: ${fromSearch}`)
  console.log(`📝 Placeholders: ${fromFallback}`)
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
