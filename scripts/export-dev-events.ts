import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const devUrl = (() => { const value = process.env.DEV_DATABASE_URL; if (!value || !/^postgres(?:ql)?:\/\//.test(value)) throw new Error("Set DEV_DATABASE_URL to a PostgreSQL connection URL"); return value; })();
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
