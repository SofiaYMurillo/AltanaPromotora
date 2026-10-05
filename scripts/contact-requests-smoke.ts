import "dotenv/config";

import {
  canTransitionContactRequestStatus,
  validatePublicContactRequest,
} from "../src/domain";
import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import { contactRequestsAccessDecision } from "../src/backend/services/authorize-service";
import {
  createPublicContactRequest,
  getAdminContactRequest,
  listAdminContactRequests,
  parseAdminContactRequestStatusPatch,
  parsePublicContactRequestInput,
  updateContactRequestStatus,
} from "../src/backend/services/contact-request-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  await prisma.contactRequest.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "contact-request-smoke-" } },
        { email: { startsWith: "smoke-contact-" } },
      ],
    },
  });

  const stamp = Date.now();
  const createdIds: string[] = [];
  const clientCountBefore = await prisma.client.count();
  const userCountBefore = await prisma.user.count();

  assert(
    validatePublicContactRequest({
      name: "",
      message: "Hola",
      email: "ada@altana.test",
    }) === "invalid_name",
    "empty name rejected",
  );
  assert(
    validatePublicContactRequest({
      name: "Ada",
      message: "",
      email: "ada@altana.test",
    }) === "invalid_message",
    "empty message rejected",
  );
  assert(
    validatePublicContactRequest({
      name: "Ada",
      message: "Quiero información",
    }) === "missing_contact",
    "contact method required",
  );
  assert(
    !validatePublicContactRequest({
      name: "Ada",
      message: "Quiero información",
      phone: "3001234567",
    }),
    "phone-only is valid",
  );
  assert(
    canTransitionContactRequestStatus("pending", "responded"),
    "pending may become responded",
  );
  assert(
    canTransitionContactRequestStatus("pending", "closed"),
    "pending may close",
  );
  assert(
    !canTransitionContactRequestStatus("closed", "pending"),
    "closed is final",
  );
  assert(
    !canTransitionContactRequestStatus("responded", "pending"),
    "cannot reopen to pending",
  );

  assert(
    parsePublicContactRequestInput({
      name: "Ada",
      email: "ada@altana.test",
      message: "Hola",
      status: "closed",
    }).ok === false,
    "public cannot set status",
  );
  assert(
    parsePublicContactRequestInput({
      name: "Ada",
      email: "ada@altana.test",
      message: "Hola",
      id: "forged",
    }).ok === false,
    "public cannot set id",
  );
  assert(
    parsePublicContactRequestInput({
      name: "Ada",
      email: "ada@altana.test",
      message: "Hola",
      createdAt: "2020-01-01T00:00:00.000Z",
    }).ok === false,
    "public cannot set createdAt",
  );
  assert(
    parsePublicContactRequestInput({
      name: "Ada",
      email: "ada@altana.test",
      message: "Hola",
      clientId: "client-forged",
    }).ok === false,
    "public cannot set clientId",
  );

  const created = await createPublicContactRequest({
    name: `Visitante smoke ${stamp}`,
    email: `smoke-contact-${stamp}@altana.test`,
    phone: "3001234567",
    message: "Quiero información sobre un proyecto.",
  });
  assert(created.ok, "public create succeeds");
  if (!created.ok) {
    throw new Error("public create failed");
  }
  createdIds.push(created.contactRequest.id);
  assert(created.contactRequest.status === "pending", "new request is pending");
  assert(
    created.contactRequest.id.startsWith("contact-request-"),
    "id is assigned by backend",
  );

  const persisted = await prisma.contactRequest.findUnique({
    where: { id: created.contactRequest.id },
  });
  assert(persisted, "row exists in sqlite");

  assert(
    (await prisma.client.count()) === clientCountBefore,
    "creating a contact request does not create a Client",
  );
  assert(
    (await prisma.user.count()) === userCountBefore,
    "creating a contact request does not create a User",
  );

  const listed = await listAdminContactRequests(`smoke-contact-${stamp}`);
  assert(
    listed.some((item) => item.id === created.contactRequest.id),
    "admin list finds the request",
  );

  const detail = await getAdminContactRequest(created.contactRequest.id);
  assert(detail?.message.includes("proyecto"), "admin detail returns message");

  const missing = await getAdminContactRequest(
    `contact-request-smoke-missing-${stamp}`,
  );
  assert(missing === null, "missing request is not found");

  const invalidPatch = parseAdminContactRequestStatusPatch({
    status: "responded",
    clientId: "x",
  });
  assert(!invalidPatch.ok, "admin cannot patch extra fields");

  const responded = await updateContactRequestStatus(
    created.contactRequest.id,
    "responded",
  );
  assert(responded.ok && responded.contactRequest.status === "responded", "valid transition");

  const invalid = await updateContactRequestStatus(
    created.contactRequest.id,
    "pending",
  );
  assert(
    !invalid.ok && invalid.error === "invalid_transition",
    "invalid transition rejected",
  );

  const closed = await updateContactRequestStatus(
    created.contactRequest.id,
    "closed",
  );
  assert(closed.ok && closed.contactRequest.status === "closed", "close from responded");

  const missingUpdate = await updateContactRequestStatus(
    `contact-request-smoke-missing-${stamp}`,
    "responded",
  );
  assert(
    !missingUpdate.ok && missingUpdate.error === "not_found",
    "update missing is not found",
  );

  const appointmentCountBefore = await prisma.appointment.count();
  const extraField = await createPublicContactRequest({
    name: "Ada",
    email: `smoke-contact-extra-${stamp}@altana.test`,
    message: "Hola",
    unknown: true,
  });
  assert(
    !extraField.ok && extraField.error === "forbidden_field",
    "unknown public fields are rejected",
  );
  assert(
    (await prisma.appointment.count()) === appointmentCountBefore,
    "creating a contact request does not create an Appointment",
  );

  const throttleIp = `smoke-ip-${stamp}`;
  for (let index = 0; index < 8; index += 1) {
    const burst = await createPublicContactRequest(
      {
        name: `Burst ${index}`,
        email: `smoke-contact-burst-${stamp}-${index}@altana.test`,
        message: "Mensaje de prueba de límite.",
      },
      throttleIp,
    );
    assert(burst.ok, `throttle allows attempt ${index + 1}`);
    if (burst.ok) {
      createdIds.push(burst.contactRequest.id);
    }
  }
  const throttled = await createPublicContactRequest(
    {
      name: "Blocked",
      email: `smoke-contact-burst-${stamp}-blocked@altana.test`,
      message: "Este envío debe bloquearse.",
    },
    throttleIp,
  );
  assert(
    !throttled.ok && throttled.error === "rate_limited",
    "ninth public attempt from the same IP is rate limited",
  );

  const unauthenticated = contactRequestsAccessDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot read admin contact requests",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "client user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientDecision = contactRequestsAccessDecision({
    access: canAccessAdmin({ user: clientUser, roles: clientRoles }),
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role cannot manage contact requests",
  );

  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "DevOnly-ChangeMe!";
  const adminLogin = await authenticateAdmin({
    email: getPrincipalAdminEmail(),
    password: adminPassword,
  });
  assert(adminLogin.ok, "principal admin authenticates");
  if (adminLogin.ok) {
    const adminContext = await resolveAuthFromToken(adminLogin.token);
    assert(
      contactRequestsAccessDecision(adminContext).ok,
      "principal admin can manage contact requests",
    );
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }

  console.log("contact_request", created.contactRequest.id);
  console.log("contact_authz_unauthenticated", unauthenticated.status);
  console.log("contact_authz_client", clientDecision.status);
  console.log("ok");

  await prisma.contactRequest.deleteMany({
    where: {
      OR: [
        { id: { in: createdIds } },
        { email: { startsWith: `smoke-contact-` } },
      ],
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
