-- Close the gap between the Prisma model and the live column.
--
-- `authorSubject` is declared `String` (required) in prisma/schema.prisma, and
-- the Vibez code relies on that: every insert writes `authorSubject` from the
-- verified subject and every ownership check filters on it, so a NULL there
-- would mean a post nobody can delete or be banned from.
--
-- The baseline migration added the column as a bare nullable TEXT, because it
-- has to be able to run against a table that already exists and cannot assume
-- the backfill filled every row. That left the column nullable while the model
-- said otherwise - Prisma would hand back `null` for a field typed `string`.
--
-- The backfill sets authorSubject from userId wherever userId is not null, and
-- the only rows it cannot reach are rows with neither identity, of which there
-- are none: this is checked, not assumed. The two statements below would fail
-- on a table that did contain such a row, which is the point - the constraint
-- is the guarantee, and it is enforced by the database rather than by
-- convention in application code.
--
-- Both tables are empty in production at the time of writing, so this is a
-- metadata-only change: no rewrite, no lock held for long, nothing to back up.
-- VibezBan.subject is the same identity column and gets the same treatment.

-- AlterTable
ALTER TABLE "VibezPost" ALTER COLUMN "authorSubject" SET NOT NULL;

-- AlterTable
ALTER TABLE "VibezBan" ALTER COLUMN "subject" SET NOT NULL;
