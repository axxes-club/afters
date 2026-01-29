import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Checking database status...')
  console.log('URL:', connectionString!.replace(/:[^:@]*@/, ':****@')) // Log masked URL

  try {
    const eventCount = await prisma.event.count()
    console.log('Events count:', eventCount)
  } catch (e: any) {
    console.log('Error counting events:', e.message)
  }

  try {
    // Try to access the new table
    // @ts-ignore
    const followCount = await prisma.follow.count()
    console.log('Follows count:', followCount)
  } catch (e: any) {
    console.log('Error counting follows (table might not exist):', e.message)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())