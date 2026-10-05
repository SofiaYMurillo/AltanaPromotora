import "dotenv/config";

import {
  addCalendarDays,
  normalizeClientEmail,
  normalizeClientPhone,
  resolveClientIdentityLookup,
  weekdayFromDateKey,
} from "../src/domain";
import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import { createPublicAppointment } from "../src/backend/services/appointment-service";
import { clientsReadDecision } from "../src/backend/services/authorize-service";
import {
  getClientDetailForAdmin,
  listClientsForAdmin,
  resolveOrCreateClient,
} from "../src/backend/services/client-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assert(
    normalizeClientEmail("  Ada@Altana.TEST ") === "ada@altana.test",
    "email normalization",
  );
  assert(
    normalizeClientPhone("  300 123 4567 ") === "3001234567",
    "phone normalization digits",
  );
  assert(
    normalizeClientPhone("+57 300 123 4567") === "+573001234567",
    "phone normalization plus",
  );
  assert(
    resolveClientIdentityLookup({
      email: "Ada@Altana.TEST",
      phone: "3001234567",
    }).kind === "email",
    "email is primary identity",
  );
  assert(
    resolveClientIdentityLookup({ phone: "3001234567" }).kind === "phone",
    "phone is fallback identity",
  );
  assert(
    resolveClientIdentityLookup({}).kind === "none",
    "no identity without contact",
  );

  function firstWeekdayOnOrAfter(dateKey: string, day: number) {
    let current = dateKey;
    for (let offset = 0; offset < 7; offset += 1) {
      if (weekdayFromDateKey(current) === day) {
        return current;
      }
      current = addCalendarDays(current, 1);
    }
    throw new Error(`weekday ${day} not found from ${dateKey}`);
  }

  const tuesday = firstWeekdayOnOrAfter("2099-03-01", 2);
  const stamp = Date.now();
  const emailA = `smoke-client-a-${stamp}@altana.test`;
  const emailB = `smoke-client-b-${stamp}@altana.test`;
  const phoneOnly = `310${String(stamp).slice(-7)}`;
  const createdAppointmentIds: string[] = [];
  const createdClientIds: string[] = [];

  const userCountBefore = await prisma.user.count();
  const credentialCountBefore = await prisma.credential.count();
  const sessionCountBefore = await prisma.session.count();

  const first = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-1`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "10:00",
    communicationPreference: "email",
    contact: { email: `  ${emailA.toUpperCase()}  ` },
  });
  assert(first.ok, "public booking with email should succeed");
  if (!first.ok) {
    throw new Error("first booking failed");
  }
  createdAppointmentIds.push(first.appointment.id);
  assert(first.appointment.clientId, "appointment is linked to a client");
  createdClientIds.push(first.appointment.clientId!);

  const persisted = await prisma.client.findUnique({
    where: { id: first.appointment.clientId! },
  });
  assert(persisted, "client row exists in sqlite");
  assert(persisted?.email === emailA, "persisted email is normalized");

  const existing = await resolveOrCreateClient({ email: emailA });
  assert(existing?.id === first.appointment.clientId, "find existing client");

  const duplicate = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-2`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "10:30",
    communicationPreference: "email",
    contact: { email: emailA },
  });
  assert(duplicate.ok, "second appointment for same client");
  if (!duplicate.ok) {
    throw new Error("duplicate booking failed");
  }
  createdAppointmentIds.push(duplicate.appointment.id);
  assert(
    duplicate.appointment.clientId === first.appointment.clientId,
    "second appointment reuses the same client",
  );

  const other = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-3`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "14:00",
    communicationPreference: "email",
    contact: { email: emailB },
  });
  assert(other.ok, "different email creates a different client");
  if (!other.ok) {
    throw new Error("other booking failed");
  }
  createdAppointmentIds.push(other.appointment.id);
  assert(
    other.appointment.clientId !== first.appointment.clientId,
    "different people are not merged",
  );
  if (other.appointment.clientId) {
    createdClientIds.push(other.appointment.clientId);
  }

  const phoneBooking = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-4`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "14:30",
    communicationPreference: "whatsapp",
    contact: { phone: phoneOnly },
  });
  assert(phoneBooking.ok, "phone-only booking succeeds");
  if (!phoneBooking.ok) {
    throw new Error("phone booking failed");
  }
  createdAppointmentIds.push(phoneBooking.appointment.id);
  assert(phoneBooking.appointment.clientId, "phone booking creates a client");
  if (phoneBooking.appointment.clientId) {
    createdClientIds.push(phoneBooking.appointment.clientId);
  }

  const samePhone = await resolveOrCreateClient({
    phone: ` ${phoneOnly} `,
  });
  assert(
    samePhone?.id === phoneBooking.appointment.clientId,
    "normalized phone finds the same client",
  );

  const forged = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-5`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "15:00",
    communicationPreference: "email",
    contact: { email: `smoke-forged-${stamp}@altana.test` },
    clientId: first.appointment.clientId,
  });
  assert(forged.ok, "booking with forged clientId still succeeds");
  if (!forged.ok) {
    throw new Error("forged booking failed");
  }
  createdAppointmentIds.push(forged.appointment.id);
  assert(
    forged.appointment.clientId !== first.appointment.clientId,
    "public clientId is ignored",
  );
  if (forged.appointment.clientId) {
    createdClientIds.push(forged.appointment.clientId);
  }

  const anonymous = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-6`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "15:30",
    communicationPreference: "none",
  });
  assert(anonymous.ok, "booking without contact still works");
  if (!anonymous.ok) {
    throw new Error("anonymous booking failed");
  }
  createdAppointmentIds.push(anonymous.appointment.id);
  assert(
    !anonymous.appointment.clientId,
    "no client when there is no identity",
  );

  const capacity = await createPublicAppointment({
    id: `appointment-smoke-${stamp}-7`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "10:00",
    communicationPreference: "none",
  });
  assert(!capacity.ok && capacity.error === "slot_unavailable", "capacity holds");

  assert(
    (await prisma.user.count()) === userCountBefore,
    "client creation does not create User",
  );
  assert(
    (await prisma.credential.count()) === credentialCountBefore,
    "client creation does not create Credential",
  );
  assert(
    (await prisma.session.count()) === sessionCountBefore,
    "client creation does not create Session",
  );

  const adminList = await listClientsForAdmin();
  assert(
    adminList.some((item) => item.client.id === first.appointment.clientId),
    "client appears in admin list",
  );
  const detail = await getClientDetailForAdmin(first.appointment.clientId!);
  assert(detail, "admin detail exists");
  assert(
    (detail?.appointments.length ?? 0) >= 2,
    "admin detail shows appointment history",
  );

  const unauthenticated = clientsReadDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot read clients",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "seed client-role user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientAccess = canAccessAdmin({
    user: clientUser,
    roles: clientRoles,
  });
  assert(!clientAccess.allowed, "client-role user cannot access admin");
  const clientDecision = clientsReadDecision({
    access: clientAccess,
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role user cannot read clients api",
  );

  const limitedUser = await userRepository.findUserByEmail(
    "admin-limited@altana.test",
  );
  assert(limitedUser, "seed limited admin exists");
  const limitedRoles = await roleRepository.getRolesForUser(limitedUser!.id);
  const limitedAccess = canAccessAdmin({
    user: limitedUser,
    roles: limitedRoles,
  });
  assert(!limitedAccess.allowed, "non-principal admin cannot access internal");
  const limitedDecision = clientsReadDecision({
    access: limitedAccess,
    user: limitedUser,
    roles: limitedRoles,
    sessionId: null,
  });
  assert(
    !limitedDecision.ok && limitedDecision.status === 403,
    "user without internal access cannot read clients",
  );

  const clientLogin = await authenticateAdmin({
    email: "client@altana.test",
    password: "anything",
  });
  assert(
    clientLogin.ok === false,
    "client-role user cannot use internal password login",
  );

  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "DevOnly-ChangeMe!";
  const adminLogin = await authenticateAdmin({
    email: getPrincipalAdminEmail(),
    password: adminPassword,
  });
  assert(adminLogin.ok, "principal admin can still authenticate");
  if (adminLogin.ok) {
    const adminContext = await resolveAuthFromToken(adminLogin.token);
    const adminDecision = clientsReadDecision(adminContext);
    assert(adminDecision.ok, "principal admin can read clients");
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }

  console.log("client_create", first.appointment.clientId);
  console.log("client_reuse", duplicate.appointment.clientId);
  console.log("client_distinct", other.appointment.clientId);
  console.log("client_phone", phoneBooking.appointment.clientId);
  console.log("client_forged_ignored", forged.appointment.clientId);
  console.log("client_anonymous", anonymous.appointment.clientId ?? "none");
  console.log("client_capacity", capacity.ok ? "UNEXPECTED_OK" : capacity.error);
  console.log("client_admin_list", adminList.length);
  console.log("client_authz_unauthenticated", unauthenticated.status);
  console.log("client_authz_client_role", clientDecision.status);
  console.log("client_authz_limited", limitedDecision.status);
  console.log("ok");

  await prisma.appointment.deleteMany({
    where: { id: { in: createdAppointmentIds } },
  });
  await prisma.client.deleteMany({
    where: { id: { in: createdClientIds } },
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
