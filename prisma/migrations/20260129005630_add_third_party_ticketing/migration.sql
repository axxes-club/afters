-- CreateEnum
CREATE TYPE "TicketingType" AS ENUM ('AFTERS', 'POSH', 'DICE', 'TICKETMASTER', 'LIVENATION', 'EVENTBRITE', 'OTHER');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "externalTicketingUrl" TEXT,
ADD COLUMN     "ticketingType" "TicketingType" NOT NULL DEFAULT 'AFTERS';
