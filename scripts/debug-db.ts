import { Pool } from 'pg';
import fs from 'fs';
import 'dotenv/config';

async function main() {
  const url = (() => { const value = process.env.DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DATABASE_URL to a PostgreSQL connection URL"); return value; })();
  const pool = new Pool({ connectionString: url });

  try {
    const orgs = await pool.query('SELECT * FROM "OrganizerProfile"');
    const events = await pool.query('SELECT * FROM "Event"');
    const users = await pool.query('SELECT * FROM "User"');

    const data = {
      orgs: orgs.rows,
      eventCount: events.rows.length,
      sampleEvents: events.rows.slice(0, 10).map(e => ({ title: e.title, city: e.city, orgId: e.organizerId })),
      users: users.rows.map(u => ({ id: u.id, email: u.email }))
    };

    fs.writeFileSync('data/debug-db-dump.json', JSON.stringify(data, null, 2));
    console.log('Dumped data to data/debug-db-dump.json');
    console.log('Total events:', events.rows.length);
    console.log('Total orgs:', orgs.rows.length);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
