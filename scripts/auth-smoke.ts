import "dotenv/config";

import {
  getAdminSeedPassword,
  getPrincipalAdminEmail,
} from "../src/backend/config/auth-config";
import { principalAdminDecision } from "../src/backend/services/authorize-service";
import {
  authenticateAdmin,
  authenticateWithInvitationCode,
  changePrincipalAdminPassword,
  resolveAuthenticationChallenge,
} from "../src/backend/services/auth-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";
import { hashSessionToken } from "../src/backend/security/password";
import * as sessionRepository from "../src/backend/repositories/session-repository";

const adminEmail = getPrincipalAdminEmail();
const adminPassword = getAdminSeedPassword();
const workerCode = process.env.WORKER_DEV_CODE_VALID?.trim() || "WORKER1A2B";

async function main() {
  const bad = await authenticateAdmin({
    email: adminEmail,
    password: "wrong-password",
  });
  console.log("bad_login", bad.ok === false ? bad.error : "UNEXPECTED_OK");

  const good = await authenticateAdmin({
    email: adminEmail,
    password: adminPassword,
  });
  console.log("good_login", good.ok ? "ok" : good);

  if (!good.ok) {
    process.exit(1);
  }

  const context = await resolveAuthFromToken(good.token);
  console.log(
    "session_access",
    context.access.allowed,
    context.access.isPrincipalAdmin,
    context.user?.email,
  );

  const workerPassword = await authenticateAdmin({
    email: "worker@altana.test",
    password: "anything",
  });
  console.log(
    "worker_password_login",
    workerPassword.ok === false ? workerPassword.error : "UNEXPECTED_OK",
  );

  const client = await authenticateAdmin({
    email: "client@altana.test",
    password: "anything",
  });
  console.log(
    "client_login",
    client.ok === false ? client.error : "UNEXPECTED_OK",
  );

  const workerChallenge = await resolveAuthenticationChallenge(
    "worker@altana.test",
  );
  console.log("worker_challenge", workerChallenge.method);

  const workerAuth = await authenticateWithInvitationCode({
    email: "worker@altana.test",
    code: workerCode,
  });
  console.log("worker_code_login", workerAuth.ok ? "ok" : workerAuth);

  if (workerAuth.ok) {
    const workerContext = await resolveAuthFromToken(workerAuth.token);
    console.log(
      "worker_session",
      workerContext.access.allowed,
      workerContext.access.isPrincipalAdmin,
      workerContext.user?.email,
    );

    const workerPrincipal = principalAdminDecision(workerContext);
    console.log(
      "worker_principal_gate",
      workerPrincipal.ok === false ? workerPrincipal.status : "UNEXPECTED_OK",
    );

    const workerPasswordChange = await changePrincipalAdminPassword({
      userId: workerContext.user!.id,
      sessionId: workerContext.sessionId,
      currentPassword: "x",
      newPassword: "new-password-123",
    });
    console.log(
      "worker_password_change",
      workerPasswordChange.ok === false
        ? workerPasswordChange.error
        : "UNEXPECTED_OK",
    );

    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(workerAuth.token),
    );
  }

  const badCode = await authenticateWithInvitationCode({
    email: "worker@altana.test",
    code: "BADCODE00",
  });
  console.log(
    "bad_worker_code",
    badCode.ok === false ? badCode.error : "UNEXPECTED_OK",
  );

  const revoked = await authenticateWithInvitationCode({
    email: "revocado@altana.test",
    code: process.env.WORKER_DEV_CODE_REVOKED?.trim() || "REVOKED1A2",
  });
  console.log(
    "revoked_invitation",
    revoked.ok === false ? revoked.error : "UNEXPECTED_OK",
  );

  const tempPassword = `${adminPassword}-rotated`;
  const passwordChange = await changePrincipalAdminPassword({
    userId: good.userId!,
    sessionId: context.sessionId,
    currentPassword: adminPassword,
    newPassword: tempPassword,
  });
  console.log("admin_password_change", passwordChange.ok ? "ok" : passwordChange);

  if (passwordChange.ok) {
    const revert = await changePrincipalAdminPassword({
      userId: good.userId!,
      sessionId: context.sessionId,
      currentPassword: tempPassword,
      newPassword: adminPassword,
    });
    console.log("admin_password_revert", revert.ok ? "ok" : revert);
  }

  await sessionRepository.revokeSessionByTokenHash(hashSessionToken(good.token));
  const afterLogout = await resolveAuthFromToken(good.token);
  console.log(
    "after_revoke",
    afterLogout.access.allowed,
    afterLogout.access.reason,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
