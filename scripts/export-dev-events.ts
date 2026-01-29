import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const devUrl = 'postgresql://neondb_owner:npg_6CG9YBgUPFpy@ep-steep-frost-aed2xpf8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const pool = new Pool({ connectionString: devUrl });

  try {
    const res = await pool.query(`
      SELECT e.*, o."displayName" as "organizerName"
      FROM "Event" e
      LEFT JOIN "OrganizerProfile" o ON e."organizerId" = o.id
    `);
    
    const fs = require('fs');
    fs.writeFileSync('data/dev-events-export.json', JSON.stringify(res.rows, null, 2));
    console.log(`Exported ${res.rows.length} events to data/dev-events-export.json`);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
