import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const devUrl = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const pool = new Pool({ connectionString: devUrl });

  try {
    const res = await pool.query('SELECT count(*) FROM "Event"');
    console.log('Total events in dev:', res.rows[0].count);

    const samples = await pool.query('SELECT title, city, "flyerUrl", "startsAt" FROM "Event" LIMIT 5');
    console.log('Sample events:', JSON.stringify(samples.rows, null, 2));

    const organizers = await pool.query('SELECT count(*) FROM "OrganizerProfile"');
    console.log('Total organizers in dev:', organizers.rows[0].count);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
