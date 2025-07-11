-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('NORMAL', 'VIP', 'ARTISTE', 'STAFF');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "ticketType" "TicketType" NOT NULL DEFAULT 'NORMAL';
