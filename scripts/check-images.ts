import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const UPLOADTHING_HOSTS = ['utfs.io', 'uploadthing.com', 'ufs.sh']

function isUploadThing(url: string | null): boolean {
  if (!url) return true // null is fine
  try {
    const hostname = new URL(url).hostname
    return UPLOADTHING_HOSTS.some(h => hostname.includes(h))
  } catch {
    return false
  }
}

async function check() {
  console.log('=== Checking Afters Image URLs ===\n')

  // Events with flyerUrl
  const events = await prisma.event.findMany({
    where: { flyerUrl: { not: null } },
    select: { id: true, title: true, flyerUrl: true }
  })
  const eventsNonUT = events.filter(e => !isUploadThing(e.flyerUrl))
  console.log(`Events: ${events.length} with flyerUrl, ${eventsNonUT.length} NOT on UploadThing`)
  eventsNonUT.forEach(e => console.log(`  - "${e.title}": ${e.flyerUrl}`))

  // OrganizerProfile logoUrl
  const orgsWithLogo = await prisma.organizerProfile.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, displayName: true, logoUrl: true }
  })
  const orgsLogoNonUT = orgsWithLogo.filter(o => !isUploadThing(o.logoUrl))
  console.log(`\nOrganizers logoUrl: ${orgsWithLogo.length} with logo, ${orgsLogoNonUT.length} NOT on UploadThing`)
  orgsLogoNonUT.forEach(o => console.log(`  - "${o.displayName}": ${o.logoUrl}`))

  // OrganizerProfile coverUrl
  const orgsWithCover = await prisma.organizerProfile.findMany({
    where: { coverUrl: { not: null } },
    select: { id: true, displayName: true, coverUrl: true }
  })
  const orgsCoverNonUT = orgsWithCover.filter(o => !isUploadThing(o.coverUrl))
  console.log(`\nOrganizers coverUrl: ${orgsWithCover.length} with cover, ${orgsCoverNonUT.length} NOT on UploadThing`)
  orgsCoverNonUT.forEach(o => console.log(`  - "${o.displayName}": ${o.coverUrl}`))

  // Users with imageUrl (likely Clerk URLs - may not need migration)
  const users = await prisma.user.findMany({
    where: { imageUrl: { not: null } },
    select: { id: true, email: true, imageUrl: true }
  })
  const usersNonUT = users.filter(u => !isUploadThing(u.imageUrl))
  console.log(`\nUsers imageUrl: ${users.length} with image, ${usersNonUT.length} NOT on UploadThing (likely Clerk)`)
  usersNonUT.slice(0, 5).forEach(u => console.log(`  - ${u.email}: ${u.imageUrl?.substring(0, 60)}...`))

  // Tickets with qrCodeUrl
  const tickets = await prisma.ticket.findMany({
    where: { qrCodeUrl: { not: null } },
    select: { id: true, ticketNumber: true, qrCodeUrl: true }
  })
  const ticketsNonUT = tickets.filter(t => !isUploadThing(t.qrCodeUrl))
  console.log(`\nTickets qrCodeUrl: ${tickets.length} with QR, ${ticketsNonUT.length} NOT on UploadThing`)
  ticketsNonUT.slice(0, 5).forEach(t => console.log(`  - ${t.ticketNumber}: ${t.qrCodeUrl?.substring(0, 60)}...`))

  console.log('\n=== Summary ===')
  const total = eventsNonUT.length + orgsLogoNonUT.length + orgsCoverNonUT.length + ticketsNonUT.length
  console.log(`Total images to migrate (excluding Clerk user images): ${total}`)

  await prisma.$disconnect()
  await pool.end()
}

check().catch(console.error)
