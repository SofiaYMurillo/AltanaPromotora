-- CreateTable
CREATE TABLE "WorkerInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "codeHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "usedAt" DATETIME,
    "invitedByUserId" TEXT
);

-- CreateIndex
CREATE INDEX "WorkerInvitation_email_idx" ON "WorkerInvitation"("email");

-- CreateIndex
CREATE INDEX "WorkerInvitation_expiresAt_idx" ON "WorkerInvitation"("expiresAt");
