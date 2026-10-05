-- CreateTable
CREATE TABLE "SiteConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "logoMediaAssetId" TEXT,
    "contactJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteConfiguration_logoMediaAssetId_fkey" FOREIGN KEY ("logoMediaAssetId") REFERENCES "MediaAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
