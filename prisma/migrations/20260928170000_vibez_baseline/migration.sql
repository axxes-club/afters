-- Bring VibezPost itself into the migration history.
--
-- VibezPost was created with `prisma db push` while the feature was being built,
-- and the follow-up migration (20260928180000_vibez_moderation) ALTERs it without
-- ever CREATEing it. That works on the one database that happened to be pushed,
-- and fails on every other one: a fresh environment, a staging database, a
-- colleague's laptop, or a restore. `prisma migrate deploy` dies on the ALTER
-- with "relation VibezPost does not exist".
--
-- So this creates it IF it is missing and leaves it alone if it is not, which
-- makes the history replayable from zero and is a no-op on the database that
-- already has the table. It deliberately does NOT touch the columns the earlier
-- migration added — those are applied by that migration, in order, and
-- re-adding them here would be the same class of bug.
--
-- The columns below are exactly the ones VibezPost had at the moment it was
-- pushed, before moderation existed.
CREATE TABLE IF NOT EXISTS "VibezPost" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorImageUrl" TEXT,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezPost_pkey" PRIMARY KEY ("id")
);

-- The event-scoped queries that run on every feed load: "live posts for this
-- event, newest first" and "live posts for this event, count".
CREATE INDEX IF NOT EXISTS "VibezPost_eventId_idx" ON "VibezPost"("eventId");
CREATE INDEX IF NOT EXISTS "VibezPost_eventId_createdAt_idx" ON "VibezPost"("eventId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezPost_eventId_fkey') THEN
        ALTER TABLE "VibezPost"
            ADD CONSTRAINT "VibezPost_eventId_fkey"
            FOREIGN KEY ("eventId") REFERENCES "Event"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezPost_userId_fkey') THEN
        ALTER TABLE "VibezPost"
            ADD CONSTRAINT "VibezPost_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

--
-- Guest attendance, captions, and reversible removal.
--
-- 1. `authorSubject` is the stable identity of whoever posted, and it is NOT
--    always a Clerk id. Most people at a night have bought a ticket as a guest
--    and never made an account, so a feed that requires sign-in excludes most of
--    the room. A guest redeems their ticket for a signed token (see
--    src/lib/vibez-guest.ts) and is identified by a subject derived from their
--    ticket rather than from an account. `userId` stays exactly as it was — the
--    account link, nullable — and authorSubject is backfilled from it so every
--    existing row keeps working and keeps its author able to delete their own.
--
-- 2. `caption` is one line of text with the photo.
--
-- 3. `filePurgedAt` records that the underlying image has been deleted from
--    storage. It is what makes "restore" honest: the previous code deleted the
--    file immediately on removal and then let a moderator restore the row, which
--    put a broken image back in the feed. A removal now only hides the post; the
--    file goes when it is genuinely purged, after a grace period, so a
--    moderation mistake is reversible.
--
-- 4. VibezBan gains the same subject, so a guest can be barred from a feed just
--    as an account holder can. Backfilled from userId for the same reason.
--
-- Every statement is guarded: this database may already have some of these
-- columns, and re-running must not fail.
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "authorSubject" TEXT;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "filePurgedAt" TIMESTAMP(3);

UPDATE "VibezPost"
   SET "authorSubject" = "userId"
 WHERE "authorSubject" IS NULL
   AND "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "VibezPost_authorSubject_idx" ON "VibezPost"("authorSubject");

-- VibezBan is NOT created by this migration: 20260928180000_vibez_moderation
-- creates it, and it runs after this one. `ADD COLUMN IF NOT EXISTS` is guarded
-- against the column already existing, but it is still an ALTER on a table that
-- does not exist yet, so on a fresh database this failed with
-- `relation "VibezBan" does not exist`.
--
-- The check below is for the shape production is actually in — the table was
-- created by `db push` before the migration history existed — and simply does
-- nothing when the table is absent, leaving the column and the index to that
-- later migration.
DO $$
BEGIN
    IF to_regclass('"VibezBan"') IS NOT NULL THEN
        ALTER TABLE "VibezBan" ADD COLUMN IF NOT EXISTS "subject" TEXT;
        UPDATE "VibezBan" SET "subject" = "userId" WHERE "subject" IS NULL;
        CREATE INDEX IF NOT EXISTS "VibezBan_subject_idx" ON "VibezBan"("subject");
    END IF;
END $$;


-- The purge cron's index deliberately does NOT live here.
--
-- It is on `removedAt`, which is created by 20260928180000_vibez_moderation, and
-- this migration runs first. Creating it here therefore fails on a fresh
-- database with `column "removedAt" does not exist` and takes the whole deploy
-- with it — which is exactly what the rehearsal against a real Postgres found.
-- Static inspection had missed it: the column exists in the schema, it just
-- belongs to a migration that has not run yet at this point.
--
-- It is created at the end of 20260928180000_vibez_moderation instead, where
-- the column it depends on actually exists.

