-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkerInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "codeHash" TEXT NOT NULL,
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
INSERT INTO "new_WorkerInvitation" ("active", "codeHash", "createdAt", "email", "expiresAt", "id", "invitedByUserId", "revokedAt", "roleId", "usedAt") SELECT "active", "codeHash", "createdAt", "email", "expiresAt", "id", "invitedByUserId", "revokedAt", "roleId", "usedAt" FROM "WorkerInvitation";
DROP TABLE "WorkerInvitation";
ALTER TABLE "new_WorkerInvitation" RENAME TO "WorkerInvitation";
CREATE INDEX "WorkerInvitation_email_idx" ON "WorkerInvitation"("email");
CREATE INDEX "WorkerInvitation_expiresAt_idx" ON "WorkerInvitation"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
