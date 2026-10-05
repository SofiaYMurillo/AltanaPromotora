-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "intervalMinutes" INTEGER NOT NULL,
    "slotCapacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AvailabilityRule_resourceType_resourceId_idx" ON "AvailabilityRule"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_resourceType_resourceId_dayOfWeek_idx" ON "AvailabilityRule"("resourceType", "resourceId", "dayOfWeek");
