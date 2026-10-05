export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { prisma } = await import("@/backend/db");
  const { syncPrincipalAdminIdentity } = await import(
    "@/backend/bootstrap/sync-principal-admin-identity"
  );
  const { ensureGoogleAuthorizedIdentities } = await import(
    "@/backend/bootstrap/ensure-google-authorized-identities"
  );
  const { ensureRolePermissionCatalog } = await import(
    "@/backend/bootstrap/ensure-role-permission-catalog"
  );
  await syncPrincipalAdminIdentity(prisma);
  await ensureRolePermissionCatalog(prisma);
  await ensureGoogleAuthorizedIdentities(prisma);
}
