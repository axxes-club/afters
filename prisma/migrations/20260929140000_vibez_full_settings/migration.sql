-- VIBEZ: full per-event feed settings, QR spots, reactions and watermarking.
--
-- Two tables and some columns. IF NOT EXISTS throughout, for the reason
-- 20260928180000_vibez_moderation documents: this migration may run against a
-- production database where VibezPost already exists (created by `db push`
-- before the feature shipped), so re-adding a column is an error that aborts
-- the deploy rather than a no-op.

-- CreateTable
CREATE TABLE IF NOT EXISTS "VibezSettings" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    "accessMode" TEXT NOT NULL DEFAULT 'ticket_or_qr',
    "requireGeofence" BOOLEAN NOT NULL DEFAULT false,
    "geoRadiusM" INTEGER NOT NULL DEFAULT 300,

    "defaultFilterId" TEXT NOT NULL DEFAULT 'nightflash',
    "allowFilterChoice" BOOLEAN NOT NULL DEFAULT true,
    "dateStamp" BOOLEAN NOT NULL DEFAULT true,
    "allowMirror" BOOLEAN NOT NULL DEFAULT true,

    "watermarkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "watermarkType" TEXT NOT NULL DEFAULT 'image',
    "watermarkUrl" TEXT,
    "watermarkText" TEXT,
    "watermarkPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "watermarkScale" DOUBLE PRECISION NOT NULL DEFAULT 0.22,
    "watermarkOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.85,

    "moderationMode" TEXT NOT NULL DEFAULT 'auto',
    "allowReactions" BOOLEAN NOT NULL DEFAULT true,
    "allowDownloads" BOOLEAN NOT NULL DEFAULT true,
    "allowCaptions" BOOLEAN NOT NULL DEFAULT true,

    "maxPerGuestPerHour" INTEGER NOT NULL DEFAULT 10,
    "maxPhotosTotal" INTEGER NOT NULL DEFAULT 500,
    "maxPerHour" INTEGER NOT NULL DEFAULT 120,

    "wallEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wallLayout" TEXT NOT NULL DEFAULT 'grid',
    "wallSlideMs" INTEGER NOT NULL DEFAULT 6000,
    "wallShowQr" BOOLEAN NOT NULL DEFAULT true,

    "closedManually" BOOLEAN NOT NULL DEFAULT false,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "VibezSpot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "scans" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezSpot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- eventId is unique in the model, so this is a unique index, not a plain one.
CREATE UNIQUE INDEX IF NOT EXISTS "VibezSettings_eventId_key" ON "VibezSettings"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VibezSpot_token_key" ON "VibezSpot"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezSpot_eventId_idx" ON "VibezSpot"("eventId");

-- AlterTable: the new VibezPost columns.
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "reactions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "reactionSubjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "downloads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "filterId" TEXT;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "watermarkApplied" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "spotId" TEXT;
ALTER TABLE "VibezPost" ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT NOT NULL DEFAULT 'approved';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezPost_eventId_moderationStatus_idx" ON "VibezPost"("eventId", "moderationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VibezPost_spotId_idx" ON "VibezPost"("spotId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezSettings_eventId_fkey') THEN
        ALTER TABLE "VibezSettings" ADD CONSTRAINT "VibezSettings_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezSpot_eventId_fkey') THEN
        ALTER TABLE "VibezSpot" ADD CONSTRAINT "VibezSpot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
-- SetNull rather than Cascade: a post survives the deletion of the sticker it
-- came from. Losing the photo because someone tidied up a QR label would be an
-- absurd way to lose a memory.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VibezPost_spotId_fkey') THEN
        ALTER TABLE "VibezPost" ADD CONSTRAINT "VibezPost_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "VibezSpot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Every event that already has a feed open gets its settings row, so the
-- settings screen shows the live configuration rather than a blank form that
-- would overwrite the defaults on first save.
INSERT INTO "VibezSettings" ("id", "eventId")
SELECT gen_random_uuid()::text, "id"
  FROM "Event"
 WHERE "vibezEnabled" = true
ON CONFLICT ("eventId") DO NOTHING;
