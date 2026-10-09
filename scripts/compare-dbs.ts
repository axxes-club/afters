import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config';

async function main() {
  const devUrl = (() => { const value = process.env.DEV_DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DEV_DATABASE_URL to a PostgreSQL connection URL"); return value; })();
  const devPool = new Pool({ connectionString: devUrl });

  const mainPool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(mainPool)
  const prisma = new PrismaClient({ adapter })

  try {
    const devEvents = await devPool.query('SELECT title, slug FROM "Event" ORDER BY title LIMIT 10');
    const mainEvents = await prisma.event.findMany({
      select: { title: true, slug: true },
      orderBy: { title: 'asc' },
      take: 10
    });

    console.log('Dev Sample Titles:', devEvents.rows.map(e => e.title));
    console.log('Main Sample Titles:', mainEvents.map(e => e.title));

  } catch (err) {
    console.error(err);
  } finally {
    await devPool.end();
    await mainPool.end();
  }
}

main();
