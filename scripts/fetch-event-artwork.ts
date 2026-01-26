import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Artist name extraction from event title
function extractArtist(title: string): string {
  // Remove common suffixes
  let artist = title
    .replace(/\s*[-–]\s*(Night \d+|Day \d+)$/i, '')
    .replace(/\s*\+\s*.+$/, '') // Remove " + support act"
    .replace(/\s*b2b\s*.+$/i, '') // Remove "b2b other artist"
    .replace(/\s*@\s*.+$/, '') // Remove "@ venue"
    .replace(/\s*:\s*.+$/, '') // Remove ": tour name"
    .replace(/\s*(360 Show|Tour|Live|DJ Set)$/i, '')
    .trim()
  
  return artist
}

// Generate a placeholder flyer URL using a service
function generatePlaceholder(title: string, venueName: string, city: string): string {
  // Use DiceBear for abstract art placeholder
  const seed = encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&size=400&backgroundColor=1a1a2e,16213e,0f0f23&shape1Color=ff2d6a,ff5722,9c27b0&shape2Color=ff2d6a,00bcd4,4caf50`
}

// Spotify-style gradient placeholder
function generateGradientPlaceholder(title: string): string {
  // Generate consistent colors based on title hash
  const hash = title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 40) % 360
  
  // Use placeholder.com with gradient simulation
  const colors = [
    ['ff2d6a', '1a1a2e'], // Pink to dark
    ['9c27b0', '1a1a2e'], // Purple to dark  
    ['00bcd4', '1a1a2e'], // Cyan to dark
    ['ff5722', '1a1a2e'], // Orange to dark
    ['4caf50', '1a1a2e'], // Green to dark
  ]
  const colorPair = colors[Math.abs(hash) % colors.length]
  
  // Using placehold.co with text
  const text = encodeURIComponent(extractArtist(title).substring(0, 20))
  return `https://placehold.co/400x400/${colorPair[0]}/${colorPair[1]}?text=${text}&font=montserrat`
}

async function main() {
  console.log('🎨 Fetching/generating event artwork...\n')

  const events = await prisma.event.findMany({
    where: { flyerUrl: null },
    select: { id: true, title: true, venueName: true, city: true }
  })

  console.log(`📊 Found ${events.length} events needing artwork\n`)

  let updated = 0
  let failed = 0

  for (const event of events) {
    try {
      // For now, generate stylish placeholders
      // TODO: Integrate with image search API for real flyers
      const flyerUrl = generateGradientPlaceholder(event.title)
      
      await prisma.event.update({
        where: { id: event.id },
        data: { flyerUrl }
      })

      console.log(`✅ ${event.title}`)
      updated++
    } catch (error) {
      console.log(`❌ ${event.title}: ${error}`)
      failed++
    }
  }

  console.log(`\n🎊 Done! Updated ${updated} events, ${failed} failed.`)
  
  // Verify
  const withArt = await prisma.event.count({ where: { flyerUrl: { not: null } } })
  console.log(`📊 Events with artwork: ${withArt}`)
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
