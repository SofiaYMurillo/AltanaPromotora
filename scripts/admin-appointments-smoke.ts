import "dotenv/config";

import {
  addCalendarDays,
  canTransitionAppointmentStatus,
  weekdayFromDateKey,
} from "../src/domain";
import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import {
  authenticateAdmin,
  authenticateWithInvitationCode,
} from "../src/backend/services/auth-service";
import {
  createPublicAppointment,
  getAdminAppointment,
  listAdminAppointments,
  parseAdminAppointmentStatusPatch,
  updateAppointmentStatus,
} from "../src/backend/services/appointment-service";
import { appointmentsReadDecision } from "../src/backend/services/authorize-service";
import { getPublicAvailability } from "../src/backend/services/availability-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

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

async function remainingCapacity(input: {
  resourceType: "property" | "office";
  resourceId: string;
  date: string;
  time: string;
}) {
  const availability = await getPublicAvailability({
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    date: input.date,
  });
  assert(availability.ok, "availability lookup");
  if (!availability.ok) {
    throw new Error("availability lookup failed");
  }
  const slot = availability.days[0]?.slots.find(
    (item) => item.startTime === input.time,
  );
  assert(slot, `slot ${input.time} exists`);
  return slot!.remainingCapacity;
}

async function main() {
  assert(
    canTransitionAppointmentStatus("pending", "confirmed"),
    "pending may confirm",
  );
  assert(
    canTransitionAppointmentStatus("pending", "cancelled"),
    "pending may cancel",
  );
  assert(
    !canTransitionAppointmentStatus("pending", "completed"),
    "pending cannot complete",
  );
  assert(
    !canTransitionAppointmentStatus("pending", "no_show"),
    "pending cannot mark no_show",
  );
  assert(
    canTransitionAppointmentStatus("confirmed", "completed"),
    "confirmed may complete",
  );
  assert(
    !canTransitionAppointmentStatus("completed", "pending"),
    "completed is final",
  );
  assert(
    !canTransitionAppointmentStatus("cancelled", "confirmed"),
    "cancelled is final",
  );

  assert(
    parseAdminAppointmentStatusPatch({ status: "confirmed" }).ok,
    "status-only patch is allowed",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      clientId: "client-forged",
    }).ok === false,
    "clientId is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      assignedWorkerId: "user-forged",
    }).ok === false,
    "assignedWorkerId is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      resourceId: "property-001",
    }).ok === false,
    "resourceId is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      capacity: 99,
    }).ok === false,
    "capacity is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      userId: "user-forged",
    }).ok === false,
    "userId is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({
      status: "confirmed",
      createdAt: "2020-01-01T00:00:00.000Z",
    }).ok === false,
    "createdAt is a forbidden patch field",
  );
  assert(
    parseAdminAppointmentStatusPatch({ status: "unknown" }).ok === false,
    "unknown status is rejected",
  );

  await prisma.appointment.deleteMany({
    where: { id: { startsWith: "appointment-admin-smoke-" } },
  });
  await prisma.client.deleteMany({
    where: { email: { startsWith: "smoke-admin-apt-" } },
  });

  const tuesday = firstWeekdayOnOrAfter("2099-09-01", 2);
  const monday = firstWeekdayOnOrAfter("2099-09-01", 1);
  const stamp = Date.now();
  const email = `smoke-admin-apt-${stamp}@altana.test`;
  const createdAppointmentIds: string[] = [];
  const createdClientIds: string[] = [];

  const withClient = await createPublicAppointment({
    id: `appointment-admin-smoke-${stamp}-1`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "09:00",
    communicationPreference: "email",
    contact: { email },
  });
  assert(withClient.ok, "create appointment with client");
  if (!withClient.ok) {
    throw new Error("withClient booking failed");
  }
  createdAppointmentIds.push(withClient.appointment.id);
  assert(withClient.appointment.clientId, "public booking linked a client");
  createdClientIds.push(withClient.appointment.clientId!);

  const toCancel = await createPublicAppointment({
    id: `appointment-admin-smoke-${stamp}-2`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "09:30",
    communicationPreference: "none",
  });
  assert(toCancel.ok, "create appointment to cancel");
  if (!toCancel.ok) {
    throw new Error("toCancel booking failed");
  }
  createdAppointmentIds.push(toCancel.appointment.id);

  const anonymous = await createPublicAppointment({
    id: `appointment-admin-smoke-${stamp}-3`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "10:00",
    communicationPreference: "none",
  });
  assert(anonymous.ok, "create appointment without client");
  if (!anonymous.ok) {
    throw new Error("anonymous booking failed");
  }
  createdAppointmentIds.push(anonymous.appointment.id);
  assert(!anonymous.appointment.clientId, "anonymous has no client");

  const concurrent = await createPublicAppointment({
    id: `appointment-admin-smoke-${stamp}-4`,
    type: "property",
    propertyId: "property-001",
    date: tuesday,
    time: "10:30",
    communicationPreference: "none",
  });
  assert(concurrent.ok, "create appointment for concurrency");
  if (!concurrent.ok) {
    throw new Error("concurrent booking failed");
  }
  createdAppointmentIds.push(concurrent.appointment.id);

  const officeVisit = await createPublicAppointment({
    id: `appointment-admin-smoke-${stamp}-5`,
    type: "office",
    officeLocationId: "office-colibri",
    date: monday,
    time: "08:00",
    communicationPreference: "none",
  });
  assert(officeVisit.ok, "create office appointment");
  if (!officeVisit.ok) {
    throw new Error("office booking failed");
  }
  createdAppointmentIds.push(officeVisit.appointment.id);

  const listed = await listAdminAppointments({
    search: email,
  });
  assert(
    listed.some((item) => item.appointment.id === withClient.appointment.id),
    "admin list finds appointment by client email",
  );
  assert(
    !listed.some((item) => item.appointment.id === anonymous.appointment.id),
    "search does not include unrelated appointments",
  );

  const adminDetail = await getAdminAppointment(withClient.appointment.id);
  assert(adminDetail, "admin detail exists");
  assert(
    adminDetail?.client?.id === withClient.appointment.clientId,
    "admin detail keeps the associated client",
  );
  assert(
    adminDetail?.resource.type === "property" &&
      adminDetail.resource.id === "property-001" &&
      !adminDetail.resource.missing,
    "admin detail resolves the property resource",
  );
  assert(
    adminDetail?.allowedTransitions.includes("confirmed") &&
      adminDetail.allowedTransitions.includes("cancelled"),
    "pending detail exposes allowed transitions",
  );

  const anonymousDetail = await getAdminAppointment(anonymous.appointment.id);
  assert(anonymousDetail, "anonymous appointment is readable");
  assert(
    anonymousDetail?.client === null,
    "appointment without client stays without a client",
  );

  const officeDetail = await getAdminAppointment(officeVisit.appointment.id);
  assert(
    officeDetail?.resource.type === "office" &&
      officeDetail.resource.id === "office-colibri",
    "office resource is distinct from property",
  );

  const missing = await getAdminAppointment(
    `appointment-admin-smoke-missing-${stamp}`,
  );
  assert(missing === null, "missing appointment is not found");

  assert(
    (await remainingCapacity({
      resourceType: "property",
      resourceId: "property-001",
      date: tuesday,
      time: "09:00",
    })) === 0,
    "pending occupies capacity",
  );

  const confirmed = await updateAppointmentStatus(
    withClient.appointment.id,
    "confirmed",
    "pending",
  );
  assert(confirmed.ok, "confirm pending appointment");
  const confirmedView = await getAdminAppointment(withClient.appointment.id);
  assert(
    confirmedView?.appointment.status === "confirmed",
    "status persisted as confirmed",
  );
  assert(
    confirmedView?.client?.id === withClient.appointment.clientId,
    "client is unchanged after status change",
  );
  assert(
    (await remainingCapacity({
      resourceType: "property",
      resourceId: "property-001",
      date: tuesday,
      time: "09:00",
    })) === 0,
    "confirmed still occupies capacity",
  );

  const invalidFromPending = await updateAppointmentStatus(
    toCancel.appointment.id,
    "completed",
    "pending",
  );
  assert(
    !invalidFromPending.ok && invalidFromPending.error === "invalid_transition",
    "pending cannot jump to completed",
  );

  const cancelled = await updateAppointmentStatus(
    toCancel.appointment.id,
    "cancelled",
    "pending",
  );
  assert(cancelled.ok, "cancel pending appointment");
  assert(
    (await remainingCapacity({
      resourceType: "property",
      resourceId: "property-001",
      date: tuesday,
      time: "09:30",
    })) === 1,
    "cancel releases capacity",
  );

  const completed = await updateAppointmentStatus(
    withClient.appointment.id,
    "completed",
    "confirmed",
  );
  assert(completed.ok, "complete confirmed appointment");
  assert(
    (await remainingCapacity({
      resourceType: "property",
      resourceId: "property-001",
      date: tuesday,
      time: "09:00",
    })) === 1,
    "completed releases capacity",
  );

  const reactivate = await updateAppointmentStatus(
    withClient.appointment.id,
    "confirmed",
    "completed",
  );
  assert(
    !reactivate.ok && reactivate.error === "invalid_transition",
    "completed cannot be reactivated",
  );

  const stale = await updateAppointmentStatus(
    toCancel.appointment.id,
    "confirmed",
    "pending",
  );
  assert(
    !stale.ok && stale.error === "conflict",
    "stale expected status is a conflict",
  );

  const [firstWrite, secondWrite] = await Promise.all([
    updateAppointmentStatus(concurrent.appointment.id, "confirmed", "pending"),
    updateAppointmentStatus(concurrent.appointment.id, "cancelled", "pending"),
  ]);
  const outcomes = [firstWrite, secondWrite];
  const winners = outcomes.filter((item) => item.ok);
  const conflicts = outcomes.filter(
    (item) => !item.ok && item.error === "conflict",
  );
  assert(winners.length === 1, "one concurrent write wins");
  assert(conflicts.length === 1, "the other concurrent write conflicts");
  const concurrentFinal = await getAdminAppointment(concurrent.appointment.id);
  assert(
    concurrentFinal?.appointment.status === "confirmed" ||
      concurrentFinal?.appointment.status === "cancelled",
    "concurrent writes leave a single coherent status",
  );

  if (concurrentFinal?.appointment.status === "confirmed") {
    const noShow = await updateAppointmentStatus(
      concurrent.appointment.id,
      "no_show",
      "confirmed",
    );
    assert(noShow.ok, "confirmed may become no_show");
    assert(
      (await remainingCapacity({
        resourceType: "property",
        resourceId: "property-001",
        date: tuesday,
        time: "10:30",
      })) === 1,
      "no_show releases capacity",
    );
  }

  const unauthenticated = appointmentsReadDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot read appointments",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "seed client-role user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientAccess = canAccessAdmin({
    user: clientUser,
    roles: clientRoles,
  });
  const clientDecision = appointmentsReadDecision({
    access: clientAccess,
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role user cannot manage appointments",
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
  const limitedDecision = appointmentsReadDecision({
    access: limitedAccess,
    user: limitedUser,
    roles: limitedRoles,
    sessionId: null,
  });
  assert(
    !limitedDecision.ok && limitedDecision.status === 403,
    "user without internal access cannot write appointments",
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
      appointmentsReadDecision(adminContext).ok,
      "principal admin can read appointments",
    );
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }

  const workerCode = process.env.WORKER_DEV_CODE_VALID?.trim() || "WORKER1A2B";
  const workerAuth = await authenticateWithInvitationCode({
    email: "worker@altana.test",
    code: workerCode,
  });
  assert(workerAuth.ok, "worker authenticates with invitation code");
  if (workerAuth.ok) {
    const workerContext = await resolveAuthFromToken(workerAuth.token);
    assert(
      appointmentsReadDecision(workerContext).ok,
      "authorized worker can read appointments",
    );
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(workerAuth.token),
    );
  }

  console.log("admin_appointment_client", withClient.appointment.id);
  console.log("admin_appointment_anonymous", anonymous.appointment.id);
  console.log("admin_appointment_office", officeVisit.appointment.id);
  console.log("admin_list_search", listed.length);
  console.log("admin_authz_unauthenticated", unauthenticated.status);
  console.log("admin_authz_client_role", clientDecision.status);
  console.log("admin_authz_limited", limitedDecision.status);
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
