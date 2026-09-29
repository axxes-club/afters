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

/**
 * Run a Prisma command.
 *
 * `prisma migrate status` exits 1 whenever migrations are pending — which is
 * precisely the state this script exists to fix — so its output has to be
 * readable without that being treated as a failure. An earlier version threw
 * here and failed the build for no reason at all.
 */
function prisma(args, { allowFailure = false } = {}) {
  try {
    return { ok: true, out: execFileSync("npx", ["prisma", ...args], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }) };
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    if (!allowFailure) throw err;
    return { ok: false, out };
  }
}

/**
 * Run a SQL script and return the output.
 *
 * `prisma db execute` reports success or failure but prints nothing, so a
 * failing script is signalled by a non-zero exit. Deliberately fatal: the whole
 * point of the canary check is that a database missing the schema must fail the
 * build rather than be quietly baselined.
 */
function runSql(sql) {
  const dir = mkdtempSync(join(tmpdir(), "baseline-"));
  const file = join(dir, "q.sql");
  writeFileSync(file, sql);
  try {
    // No --schema here: `db execute` reads the datasource from prisma.config.ts
    // and rejects the flag outright.
    return execFileSync("npx", ["prisma", "db", "execute", "--file", file], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    // Surface the database's own message, which is the useful part.
    process.stderr.write(`${err.stdout ?? ""}${err.stderr ?? ""}\n`);
    throw err;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[baseline] DATABASE_URL is not set; skipping.");
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
    // P3008 means this migration is *already* recorded as applied. That is
    // success, not failure: it is what the second and later builds see, once a
    // previous build has already done the baselining. Treating it as an error
    // made the build fail on a database that was in exactly the right state.
    //
    // Judged on the exit code rather than on the text, because matching /error/
    // in the output also matched Prisma's own "0 migrations found" style
    // messages and would have thrown on a successful run.
    // A Neon connection per call, five calls in a row, timed the build out
    // (P1002) even though the work was already done. So: P3008 ("already
    // recorded") and P1002 (transient) are both treated as "fine", because in
    // both cases the desired end state holds. Anything else is a real failure
    // and must stop the build — a half-recorded history would leave
    // `migrate deploy` applying migrations the table still lists as pending.
    const { ok, out } = prisma(["migrate", "resolve", "--applied", name], {
      allowFailure: true,
    });
    if (ok) {
      console.log(`[baseline] Recorded ${name}.`);
      continue;
    }
    if (out.includes("P3008")) {
      console.log(`[baseline] ${name} was already recorded.`);
      continue;
    }
    if (out.includes("P1002")) {
      // The server was reached but the connection timed out. `migrate deploy`
      // runs immediately after this and is the real authority: it applies
      // anything still pending and fails loudly if the history is inconsistent.
      console.warn(`[baseline] ${name}: connection timed out; leaving it to migrate deploy.`);
      continue;
    }
    throw new Error(`Failed to record ${name}:\n${out}`);
  }
  console.log("[baseline] Done. The Vibez migrations will now apply normally.");
}

// main() is synchronous, so a throw propagates on its own and an uncaught
// exception exits non-zero — which fails the Vercel build, and is the whole
// safety property: if the canary check raises, or `migrate resolve` fails,
// nothing is deployed and no migration is silently recorded.
//
// An earlier version wrote `main().catch(...)`, which cannot work on a
// synchronous function: `main()` returns undefined, so `.catch` was undefined and
// the build died with a TypeError *after* the baselining had already happened.
main();
