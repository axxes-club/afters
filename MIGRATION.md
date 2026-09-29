# Why the database migration runs during the Vercel build

`vercel.json` sets:

```json
"buildCommand": "prisma generate && node scripts/baseline-migrations.mjs && prisma migrate deploy && next build --webpack"
```

Three steps, in this order, and the order is the point.

## Step 0: `baseline-migrations.mjs`

This app's schema was created with `prisma db push` and `db seed`, so
`_prisma_migrations` was never populated. `migrate deploy` therefore tried to
replay the entire history from January onto a database that already had all of
it, and failed with `type "EventStatus" already exists`.

That failure was correct — it failed the build and deployed nothing — but it
meant no migration could ever be applied. This script records the five
historical migrations as already applied, which is Prisma's supported "baseline
an existing database" flow.

It **verifies before recording**: the tables and enums the earliest migrations
create must all be present, or the script raises and deploys nothing. Marking a
migration applied on a database that never had it is the one genuinely dangerous
thing here, so it cannot happen silently. The guard was tested in both directions
— it refuses when an object is missing, and passes when all are present.


That looks alarming and is deliberate. This is the reasoning, so the next person
does not "fix" it.

## The problem it solves

The production `DATABASE_URL` exists in exactly two places: this Vercel project's
environment, and the GitHub Actions secrets. Neither can hand it to a developer
machine.

- `vercel env pull` writes the literal string `[SENSITIVE]` in place of every
  secret value. Confirmed, not assumed.
- GitHub never returns secret *values* to any caller, at any permission level.

So a migration **cannot be run from a laptop at all**. That is why an earlier
note in this repository said the Vibez migration was "verified statically, never
executed" — there was no way to execute it.

The Vercel build is the one environment where the credential is both real and
available, so the migration runs there.

## Why this is safe to leave in a build command

**It fails the build, not the deploy.** `prisma migrate deploy` applies each
migration in its own transaction and exits non-zero on any error. The `&&` stops
the chain, so a failed migration produces a red build and *no deployment*. The
failure direction is the safe one: the database and the code stay consistent
because the new code never ships.

**It is idempotent.** Every statement in both Vibez migrations is guarded —
`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and a `DO` block that
checks the table exists before altering it. Both migrations were rehearsed against
a real Postgres, twice in a row, in both the empty-database shape and the
`db push` shape production is actually in. Re-running is a no-op.

**It removes an ordering hazard rather than creating one.** The Prisma client
selects `VibezPost.authorSubject` on every feed query. If the code deployed
before the migration, every feed request would fail on a missing column.
Migrating inside the build makes the correct order automatic — it is no longer
## The purge cron

`vercel.json` also schedules `/api/cron/vibez-purge` daily at 04:37.

Daily rather than hourly, for two reasons and only one of them is a constraint.
This project is on Vercel's Hobby plan, which allows only daily cron jobs — an
hourly expression is rejected at deploy time with "Hobby accounts are limited to
daily cron jobs". But hourly was also the wrong shape: the handler only purges
posts removed more than `GRACE_HOURS` (24) ago, so an hourly run would find
almost nothing to do on most passes. Once a day is the natural cadence for a
24-hour grace period whichever plan you are on.

The `37 4` offset is deliberate: it avoids the top of the hour, where every
scheduled job on Vercel fires at once.

Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the environment
variable is named `CRON_SECRET`. The handler returns 503 if that variable is
missing, because the original guard meant an unset secret left an endpoint that
deletes files open to the whole internet.


something a human has to remember.

## When to move it back

If a future migration is genuinely unsafe to run on every build — one that
should be applied once, by hand, at a chosen moment — move it out of
`buildCommand` and use the manual `Migrate` workflow in
`.github/workflows/migrate.yml`, which still exists for exactly that case. It
applies the migrations and then asserts the four columns the feed selects are
present, so a missing column surfaces at migration time instead of as a runtime
error on somebody's feed.
