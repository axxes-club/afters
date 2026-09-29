-- VIBEZ moderation: reporting, removal and per-event bans.
--
-- VibezPost itself was created outside a migration (prisma db push) before the
-- feature was finished; this brings its schema forward and adds the tables a
-- guest-photo feed needs before anyone can enable it.

-- AlterTable
-- IF NOT EXISTS on every column: this migration was authored against a database
-- that already had VibezPost, so on a database built from migrations the table
-- arrives empty and re-adding a column is an error that aborts the deploy.
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "removedBy" TEXT,
ADD COLUMN IF NOT EXISTS "removedReason" TEXT,
ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "VibezReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'other',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VibezBan" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VibezReport_postId_reporterId_key" ON "VibezReport"("postId", "reporterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezReport_postId_idx" ON "VibezReport"("postId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VibezBan_eventId_userId_key" ON "VibezBan"("eventId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezBan_eventId_idx" ON "VibezBan"("eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezPost_eventId_removedAt_idx" ON "VibezPost"("eventId", "removedAt");

-- AddForeignKey
-- Guarded, because ADD CONSTRAINT has no IF NOT EXISTS and a second run would
-- abort the deploy on a duplicate constraint.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezReport_postId_fkey') THEN
        ALTER TABLE "VibezReport" ADD CONSTRAINT "VibezReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "VibezPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezBan_eventId_fkey') THEN
        ALTER TABLE "VibezBan" ADD CONSTRAINT "VibezBan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Added 2026-09-28, appended rather than shipped in the earlier migration.
--
-- This is where the purge cron's index belongs. 20260928170000_vibez_baseline
-- originally carried it, but that migration runs *before* this one, so
-- `removedAt` did not exist yet and a fresh database failed to migrate. Found by
-- rehearsing the chain against a real Postgres.
--
-- It is a partial index on purpose: the cron only ever asks for rows that are
-- removed and not yet purged, so a live feed's photos stay out of the index
-- entirely and the index stays small no matter how busy the night gets.
CREATE INDEX IF NOT EXISTS "VibezPost_filePurgedAt_idx"
    ON "VibezPost" ("removedAt")
 WHERE "removedAt" IS NOT NULL AND "filePurgedAt" IS NULL;

-- VibezBan.subject, for a guest who can be barred as readily as an account
-- holder. The baseline migration adds it only when the table already exists
-- (it was made by `db push` before this migration created it), so on a database
-- built purely from migrations the column has to be added here as well.
--
-- IF NOT EXISTS throughout: on the production database the baseline has already
-- added it, and re-adding a column is an error rather than a no-op.
ALTER TABLE "VibezBan" ADD COLUMN IF NOT EXISTS "subject" TEXT;

UPDATE "VibezBan"
   SET "subject" = "userId"
 WHERE "subject" IS NULL;

CREATE INDEX IF NOT EXISTS "VibezBan_subject_idx" ON "VibezBan"("subject");
