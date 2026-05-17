-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "originWaNumber" TEXT;

-- CreateIndex
CREATE INDEX "Project_originWaNumber_idx" ON "Project"("originWaNumber");
