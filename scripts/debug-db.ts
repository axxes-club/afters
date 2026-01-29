import { Pool } from 'pg';
import fs from 'fs';
import 'dotenv/config';

async function main() {
  const url = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';
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
