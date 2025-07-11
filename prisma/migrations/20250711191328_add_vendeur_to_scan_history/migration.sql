-- AlterTable
ALTER TABLE "ScanHistory" ADD COLUMN     "vendeurId" TEXT;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
