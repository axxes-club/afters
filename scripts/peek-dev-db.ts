import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const devUrl = (() => { const value = process.env.DEV_DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DEV_DATABASE_URL to a PostgreSQL connection URL"); return value; })();
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
