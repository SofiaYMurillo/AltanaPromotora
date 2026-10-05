-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "propertyId" TEXT,
    "officeLocationId" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "communicationPreference" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "clientId" TEXT,
    "assignedWorkerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "emailAttempted" TEXT,
    "ipReference" TEXT,
    "userAgentReference" TEXT,
    "route" TEXT,
    "success" BOOLEAN,
    "metadataJson" TEXT,
    "notificationStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Appointment_type_propertyId_date_time_idx" ON "Appointment"("type", "propertyId", "date", "time");

-- CreateIndex
CREATE INDEX "Appointment_type_officeLocationId_date_time_idx" ON "Appointment"("type", "officeLocationId", "date", "time");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "SecurityEvent_type_timestamp_idx" ON "SecurityEvent"("type", "timestamp");

-- CreateIndex
CREATE INDEX "SecurityEvent_severity_timestamp_idx" ON "SecurityEvent"("severity", "timestamp");
