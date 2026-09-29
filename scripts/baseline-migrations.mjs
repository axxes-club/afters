/**
 * Baseline the migration history — but only after proving the schema is there.
 *
 * Why this is needed: this app's schema was created with `prisma db push` and
 * `db seed`, so `_prisma_migrations` was never populated. `prisma migrate
 * deploy` therefore tried to replay the whole history from January against a
 * database that already had all of it, and died on
 * `type "EventStatus" already exists`. That was the correct behaviour — it failed
 * the build and deployed nothing — but it meant the Vibez migration could not be
 * applied at all.
 *
 * `prisma migrate resolve --applied` is Prisma's supported way to say "these
 * already ran". Run blindly it would also mark migrations applied on a database
 * that genuinely never had them, so this checks first: the tables and enums the
 * earliest migrations create must all be present. Only then is the history
 * recorded. If the check fails it raises and deploys nothing, because the right
 * response to "this is missing" is to apply the migration, not to claim it ran.
 *
 * Runs inside the Vercel build, which is the only place DATABASE_URL exists.
 * Idempotent: once the rows are in `_prisma_migrations` this does nothing.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = join(ROOT, "prisma", "schema.prisma");
const MIGRATIONS = join(ROOT, "prisma", "migrations");

/** Migrations that predate Vibez — the ones `db push` already applied. */
const HISTORICAL = [
  "20260126075943_init",
  "20260128234921_add_follows_and_saved_events",
  "20260129005630_add_third_party_ticketing",
  "20260129012802_add_superadmin_and_status",
  "20260129020000_add_feature_type_to_system_status",
];

/** Enums and tables created by the earliest migrations. The canaries. */
const TABLES = ["Event", "Ticket", "Order", "User", "TicketTier"];
const TYPES = ["EventStatus", "TicketStatus", "UserRole"];

function prisma(args) {
  return execFileSync("npx", ["prisma", ...args, "--schema", SCHEMA], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Run a SQL file through `prisma db execute`. Throws if the SQL raises. */
function runSql(sql) {
  const dir = mkdtempSync(join(tmpdir(), "baseline-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql);
  try {
    prisma(["db", "execute", "--file", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[baseline] DATABASE_URL is not set; skipping.");
    return;
  }

  // Already baselined? Then every historical migration is recorded as applied and
  // there is nothing to do. Cheaper to ask than to re-verify.
  const status = prisma(["migrate", "status"]);
  if (HISTORICAL.every((m) => new RegExp(`${m}.*applied`).test(status))) {
    console.log("[baseline] History already recorded; nothing to do.");
    return;
  }

  console.log("[baseline] Checking the schema already exists…");
  runSql(`
    DO $$
    DECLARE missing text;
    BEGIN
      SELECT string_agg(c.name, ', ') INTO missing
      FROM unnest(ARRAY[${TABLES.concat(TYPES).map((n) => `'${n}'`).join(", ")}]) AS c(name)
      WHERE NOT EXISTS (
        SELECT 1 FROM pg_class k
          JOIN pg_namespace ns ON ns.oid = k.relnamespace
        WHERE ns.nspname = 'public' AND k.relkind = 'r' AND k.relname = c.name
      ) AND NOT EXISTS (
        SELECT 1 FROM pg_type t
          JOIN pg_namespace ns ON ns.oid = t.typnamespace
        WHERE ns.nspname = 'public' AND t.typtype = 'e' AND t.typname = c.name
      );

      IF missing IS NOT NULL THEN
        RAISE EXCEPTION 'Refusing to baseline: missing %. These migrations have not actually been applied — apply them instead of marking them done.', missing;
      END IF;
    END $$;
  `);
  console.log("[baseline] Schema verified present.");

  for (const name of HISTORICAL) {
    if (!existsSync(join(MIGRATIONS, name, "migration.sql"))) {
      console.warn(`[baseline] Skipping ${name}: no such migration.`);
      continue;
    }
    prisma(["migrate", "resolve", "--applied", name]);
    console.log(`[baseline] Recorded ${name}.`);
  }
  console.log("[baseline] Done. The Vibez migrations will now apply normally.");
}

main();
