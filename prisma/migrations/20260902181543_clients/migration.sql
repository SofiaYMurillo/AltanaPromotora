-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Preserve existing Appointment.clientId values as Client rows before adding the FK.
INSERT INTO "Client" ("id", "createdAt", "updatedAt")
SELECT DISTINCT "clientId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Appointment"
WHERE "clientId" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("assignedWorkerId", "clientId", "communicationPreference", "contactEmail", "contactPhone", "createdAt", "date", "id", "officeLocationId", "propertyId", "status", "time", "type", "updatedAt") SELECT "assignedWorkerId", "clientId", "communicationPreference", "contactEmail", "contactPhone", "createdAt", "date", "id", "officeLocationId", "propertyId", "status", "time", "type", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE INDEX "Appointment_type_propertyId_date_time_idx" ON "Appointment"("type", "propertyId", "date", "time");
CREATE INDEX "Appointment_type_officeLocationId_date_time_idx" ON "Appointment"("type", "officeLocationId", "date", "time");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");
