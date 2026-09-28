-- VIBEZ moderation: reporting, removal and per-event bans.
--
-- VibezPost itself was created outside a migration (prisma db push) before the
-- feature was finished; this brings its schema forward and adds the tables a
-- guest-photo feed needs before anyone can enable it.

-- AlterTable
ALTER TABLE "VibezPost" ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedBy" TEXT,
ADD COLUMN     "removedReason" TEXT,
ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VibezReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'other',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VibezBan" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VibezBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VibezReport_postId_reporterId_key" ON "VibezReport"("postId", "reporterId");

-- CreateIndex
CREATE INDEX "VibezReport_postId_idx" ON "VibezReport"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "VibezBan_eventId_userId_key" ON "VibezBan"("eventId", "userId");

-- CreateIndex
CREATE INDEX "VibezBan_eventId_idx" ON "VibezBan"("eventId");

-- CreateIndex
CREATE INDEX "VibezPost_eventId_removedAt_idx" ON "VibezPost"("eventId", "removedAt");

-- AddForeignKey
ALTER TABLE "VibezReport" ADD CONSTRAINT "VibezReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "VibezPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VibezBan" ADD CONSTRAINT "VibezBan_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
