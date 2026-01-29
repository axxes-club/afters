import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const charlotteEvents = await prisma.event.findMany({
    where: {
      OR: [
        { city: 'Charlotte' },
        { title: { contains: 'Zombie', mode: 'insensitive' } },
        { description: { contains: 'Zombie', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      isPublished: true,
      startsAt: true
    }
  })

  console.log('Charlotte/Zombie Events in DB:', JSON.stringify(charlotteEvents, null, 2))
}

main().catch(console.error).finally(() => pool.end())
