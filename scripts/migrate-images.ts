import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { UTApi } from 'uploadthing/server'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const utapi = new UTApi()

const UPLOADTHING_HOSTS = ['utfs.io', 'uploadthing.com', 'ufs.sh']

function isUploadThing(url: string | null): boolean {
  if (!url) return true
  try {
    const hostname = new URL(url).hostname
    return UPLOADTHING_HOSTS.some(h => hostname.includes(h))
  } catch {
    return false
  }
}

async function downloadAndUpload(url: string, filename: string): Promise<string | null> {
  try {
    console.log(`  Downloading: ${url.substring(0, 60)}...`)
    
    const response = await fetch(url)
    if (!response.ok) {
      console.log(`    ❌ Failed to download: ${response.status}`)
      return null
    }
    
    const blob = await response.blob()
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
    
    console.log(`  Uploading to UploadThing (${(blob.size / 1024).toFixed(1)}KB)...`)
    const uploadResult = await utapi.uploadFiles(file)
    
    if (uploadResult.error) {
      console.log(`    ❌ Upload failed: ${uploadResult.error.message}`)
      return null
    }
    
    const newUrl = uploadResult.data.ufsUrl
    console.log(`    ✅ Uploaded: ${newUrl}`)
    return newUrl
  } catch (error) {
    console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

async function migrate() {
  console.log('=== Migrating Afters Event Flyers to UploadThing ===\n')

  // Get events with non-UploadThing flyerUrls
  const events = await prisma.event.findMany({
    where: { flyerUrl: { not: null } },
    select: { id: true, title: true, slug: true, flyerUrl: true }
  })
  
  const eventsToMigrate = events.filter(e => !isUploadThing(e.flyerUrl))
  console.log(`Found ${eventsToMigrate.length} events to migrate\n`)

  let migrated = 0
  let failed = 0
  let skipped = 0

  for (const event of eventsToMigrate) {
    console.log(`\n[${migrated + failed + skipped + 1}/${eventsToMigrate.length}] "${event.title}"`)
    
    if (!event.flyerUrl) {
      skipped++
      continue
    }

    // Generate a filename from the event slug
    const filename = `flyer-${event.slug}.jpg`
    
    const newUrl = await downloadAndUpload(event.flyerUrl, filename)
    
    if (newUrl) {
      await prisma.event.update({
        where: { id: event.id },
        data: { flyerUrl: newUrl }
      })
      console.log(`    ✅ Database updated`)
      migrated++
    } else {
      failed++
    }
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n' + '─'.repeat(50))
  console.log('🎊 Migration complete!')
  console.log(`✅ Migrated: ${migrated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)

  await prisma.$disconnect()
  await pool.end()
}

migrate().catch(console.error)
