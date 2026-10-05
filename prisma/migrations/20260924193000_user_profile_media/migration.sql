-- AlterTable
ALTER TABLE "User" ADD COLUMN "profileMediaAssetId" TEXT;

-- CreateIndex
CREATE INDEX "User_profileMediaAssetId_idx" ON "User"("profileMediaAssetId");
