-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkerInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "roleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "codeHash" TEXT NOT NULL,
    "grantedPermissionNamesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "usedAt" DATETIME,
    "invitedByUserId" TEXT,
    "emailDeliveryStatus" TEXT NOT NULL DEFAULT 'not_attempted',
    "emailSentAt" DATETIME,
    "lastEmailAttemptAt" DATETIME,
    "resendCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_WorkerInvitation" ("id", "email", "roleId", "active", "codeHash", "createdAt", "expiresAt", "revokedAt", "usedAt", "invitedByUserId", "emailDeliveryStatus", "emailSentAt", "lastEmailAttemptAt", "resendCount") SELECT "id", "email", "roleId", "active", "codeHash", "createdAt", "expiresAt", "revokedAt", "usedAt", "invitedByUserId", "emailDeliveryStatus", "emailSentAt", "lastEmailAttemptAt", "resendCount" FROM "WorkerInvitation";
DROP TABLE "WorkerInvitation";
ALTER TABLE "new_WorkerInvitation" RENAME TO "WorkerInvitation";
CREATE INDEX "WorkerInvitation_email_idx" ON "WorkerInvitation"("email");
CREATE INDEX "WorkerInvitation_expiresAt_idx" ON "WorkerInvitation"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");
