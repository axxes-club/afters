import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { UTApi } from 'uploadthing/server'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const utapi = new UTApi()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Extract artist name for fallback searches
function extractArtist(title: string): string {
  return title
    .replace(/\s*[-–]\s*(Night \d+|Day \d+)$/i, '')
    .replace(/\s*\+\s*.+$/, '')
    .replace(/\s*b2b\s*.+$/i, '')
    .replace(/\s*@\s*.+$/, '')
    .replace(/\s*:\s*.+$/, '')
    .replace(/\s*(360 Show|Tour|Live|DJ Set|Official|Afterparty|.+Tour)$/i, '')
    .trim()
}

// Try to find image from various sources
async function findImageUrl(title: string, artist: string): Promise<string | null> {
  // Try iTunes first
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&limit=1`
    const res = await fetch(itunesUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.results?.[0]?.artworkUrl100) {
        return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb')
      }
    }
  } catch (e) {
    console.log(`  iTunes failed for ${artist}`)
  }

  // Try song search
  try {
    const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=1`
    const res = await fetch(songUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.results?.[0]?.artworkUrl100) {
        return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb')
      }
    }
  } catch (e) {
    console.log(`  iTunes song search failed for ${artist}`)
  }

  return null
}

// Download image and upload to UploadThing
async function migrateImage(url: string, eventId: string, title: string): Promise<string | null> {
  try {
    // Skip placeholder URLs - we need to find real images for these
    if (url.includes('placehold.co')) {
      const artist = extractArtist(title)
      const realUrl = await findImageUrl(title, artist)
      if (!realUrl) {
        console.log(`  No real image found for: ${title}`)
        return null
      }
      url = realUrl
    }

    // Download the image
    const response = await fetch(url)
    if (!response.ok) {
      console.log(`  Failed to download: ${url}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const blob = new Blob([buffer], { type: contentType })
    
    // Create a File object
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const filename = `event-${eventId}.${ext}`
    const file = new File([blob], filename, { type: contentType })

    // Upload to UploadThing
    const uploadResult = await utapi.uploadFiles([file])
    
    if (uploadResult[0]?.data?.ufsUrl) {
      return uploadResult[0].data.ufsUrl
    } else if (uploadResult[0]?.data?.url) {
      return uploadResult[0].data.url
    }
    
    console.log(`  Upload failed:`, uploadResult[0]?.error)
    return null
  } catch (error) {
    console.log(`  Error migrating image:`, error)
    return null
  }
}

async function main() {
  console.log('🚀 Migrating event images to UploadThing...\n')

  const events = await prisma.event.findMany({
    select: { id: true, title: true, flyerUrl: true },
    orderBy: { startsAt: 'asc' }
  })

  console.log(`📊 Found ${events.length} events to process\n`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const progress = `[${String(i + 1).padStart(3)}/${events.length}]`
    
    // Skip if already on UploadThing
    if (event.flyerUrl?.includes('uploadthing') || event.flyerUrl?.includes('utfs.io')) {
      console.log(`${progress} ⏭️  ${event.title.substring(0, 40)} - Already on UploadThing`)
      skipped++
      continue
    }

    // Skip if no URL
    if (!event.flyerUrl) {
      console.log(`${progress} ⏭️  ${event.title.substring(0, 40)} - No image`)
      skipped++
      continue
    }

    process.stdout.write(`${progress} 🔄 ${event.title.substring(0, 40).padEnd(40)} `)

    const newUrl = await migrateImage(event.flyerUrl, event.id, event.title)
    
    if (newUrl) {
      await prisma.event.update({
        where: { id: event.id },
        data: { flyerUrl: newUrl }
      })
      console.log('✅ Migrated')
      migrated++
    } else {
      console.log('❌ Failed')
      failed++
    }

    // Rate limit
    await delay(500)
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`🎊 Migration complete!`)
  console.log(`✅ Migrated: ${migrated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  
  await pool.end()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
