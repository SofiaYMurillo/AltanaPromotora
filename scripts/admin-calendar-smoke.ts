import "dotenv/config";

import {
  appointmentCalendarPhase,
  MAX_CALENDAR_RANGE_DAYS,
  resolveCalendarRange,
  shiftCalendarDate,
} from "../src/domain";
import type { Appointment } from "../src/domain";
import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import * as appointmentRepository from "../src/backend/repositories/appointment-repository";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { appointmentsReadDecision } from "../src/backend/services/authorize-service";
import {
  calendarToday,
  getAdminCalendar,
  parseCalendarQuery,
} from "../src/backend/services/calendar-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const SMOKE_PREFIX = "appointment-calendar-smoke-";

async function main() {
  await prisma.appointment.deleteMany({
    where: { id: { startsWith: SMOKE_PREFIX } },
  });

  const today = calendarToday();
  const yesterday = shiftCalendarDate(today, -1);
  const tomorrow = shiftCalendarDate(today, 1);

  // Range rules are pure and must stay in the domain.
  assert(
    resolveCalendarRange({ date: "2026-02-30", fallbackDate: today }).ok ===
      false,
    "impossible civil date rejected",
  );
  assert(
    resolveCalendarRange({ date: "not-a-date", fallbackDate: today }).ok ===
      false,
    "malformed date rejected",
  );
  assert(
    resolveCalendarRange({ from: tomorrow, to: today, fallbackDate: today })
      .ok === false,
    "inverted range rejected",
  );
  const tooLarge = resolveCalendarRange({
    from: today,
    to: shiftCalendarDate(today, MAX_CALENDAR_RANGE_DAYS),
    fallbackDate: today,
  });
  assert(
    !tooLarge.ok && tooLarge.error === "range_too_large",
    "range beyond the maximum is rejected",
  );
  const pastRange = resolveCalendarRange({
    date: "2020-01-15",
    fallbackDate: today,
  });
  assert(pastRange.ok, "past dates are readable history");
  assert(
    resolveCalendarRange({ fallbackDate: today }).ok,
    "empty query falls back to today",
  );

  assert(
    appointmentCalendarPhase("pending") === "active" &&
      appointmentCalendarPhase("confirmed") === "active" &&
      appointmentCalendarPhase("completed") === "closed" &&
      appointmentCalendarPhase("cancelled") === "closed" &&
      appointmentCalendarPhase("no_show") === "closed",
    "phase grouping matches the existing status machine",
  );

  assert(
    !parseCalendarQuery({ status: "archived" }, today).ok,
    "unknown status rejected",
  );
  assert(
    !parseCalendarQuery({ resourceType: "garage" }, today).ok,
    "unknown resource type rejected",
  );
  assert(
    !parseCalendarQuery({ resourceId: "property-001" }, today).ok,
    "resourceId without resourceType is rejected instead of ignored",
  );

  const seeded: Appointment[] = [
    {
      id: `${SMOKE_PREFIX}1`,
      type: "property",
      propertyId: "property-001",
      date: today,
      time: "10:00",
      status: "pending",
      communicationPreference: "email",
      contact: { email: "calendar-smoke-1@altana.test" },
    },
    {
      id: `${SMOKE_PREFIX}2`,
      type: "office",
      officeLocationId: "office-colibri",
      date: today,
      time: "09:00",
      status: "cancelled",
      communicationPreference: "none",
      contact: { phone: "3001112233" },
    },
    {
      id: `${SMOKE_PREFIX}3`,
      type: "property",
      propertyId: "property-002",
      date: tomorrow,
      time: "11:00",
      status: "confirmed",
      communicationPreference: "whatsapp",
      contact: { phone: "3004445566" },
    },
    {
      id: `${SMOKE_PREFIX}4`,
      type: "property",
      propertyId: "property-001",
      date: yesterday,
      time: "08:00",
      status: "completed",
      communicationPreference: "email",
      contact: { email: "calendar-smoke-4@altana.test" },
    },
  ];

  for (const appointment of seeded) {
    await appointmentRepository.createAppointment(appointment);
  }

  const appointmentsBefore = await prisma.appointment.count();
  const clientsBefore = await prisma.client.count();
  const contactRequestsBefore = await prisma.contactRequest.count();
  const notificationsBefore = await prisma.notification.count();
  const availabilityRulesBefore = await prisma.availabilityRule.count();
  const statusesBefore = await prisma.appointment.findMany({
    where: { id: { startsWith: SMOKE_PREFIX } },
    select: { id: true, status: true },
    orderBy: { id: "asc" },
  });

  const day = await getAdminCalendar({ date: today });
  assert(day.ok, "single-day query succeeds");
  if (!day.ok) {
    throw new Error("single-day query failed");
  }
  assert(day.days.length === 1, "single-day query returns exactly one day");
  assert(day.range.from === today && day.range.to === today, "range echoes the day");
  assert(
    day.days[0].appointments.every((item) => item.date === today),
    "returned appointments belong to the requested range",
  );

  const todayIds = day.days[0].appointments.map((item) => item.id);
  assert(
    todayIds.includes(`${SMOKE_PREFIX}1`) &&
      todayIds.includes(`${SMOKE_PREFIX}2`),
    "both appointments of the day are present",
  );
  assert(
    !todayIds.includes(`${SMOKE_PREFIX}3`) &&
      !todayIds.includes(`${SMOKE_PREFIX}4`),
    "appointments outside the range are excluded",
  );

  const times = day.days[0].appointments.map((item) => item.startTime);
  assert(
    times.every((time, index) => index === 0 || times[index - 1] <= time),
    "appointments are ordered chronologically",
  );

  const sample = day.days[0].appointments.find(
    (item) => item.id === `${SMOKE_PREFIX}1`,
  );
  assert(sample, "sample appointment is present");
  assert(sample!.resource.type === "property", "resource type is exposed");
  assert(sample!.resource.id === "property-001", "resource id is exposed");
  assert(typeof sample!.resource.title === "string", "resource title resolved");
  assert(sample!.status === "pending", "status is exposed");

  const exposedKeys = Object.keys(sample!).sort();
  assert(
    exposedKeys.join(",") ===
      [
        "clientDisplay",
        "contactDisplay",
        "date",
        "id",
        "resource",
        "startTime",
        "status",
        "workerDisplay",
      ].join(","),
    `calendar DTO exposes only read fields (got ${exposedKeys.join(",")})`,
  );
  assert(
    !("clientId" in sample!) && !("assignedWorkerId" in sample!),
    "internal identifiers are not exposed",
  );

  const statusFiltered = await getAdminCalendar({
    date: today,
    status: "cancelled",
  });
  assert(statusFiltered.ok, "status filter query succeeds");
  if (!statusFiltered.ok) {
    throw new Error("status filter query failed");
  }
  assert(
    statusFiltered.days[0].appointments.every(
      (item) => item.status === "cancelled",
    ),
    "status filter is applied in the backend",
  );
  assert(
    statusFiltered.days[0].appointments.some(
      (item) => item.id === `${SMOKE_PREFIX}2`,
    ),
    "cancelled appointment is still visible in the agenda",
  );

  const officeFiltered = await getAdminCalendar({
    date: today,
    resourceType: "office",
  });
  assert(officeFiltered.ok, "resource type filter query succeeds");
  if (!officeFiltered.ok) {
    throw new Error("resource filter query failed");
  }
  assert(
    officeFiltered.days[0].appointments.every(
      (item) => item.resource.type === "office",
    ),
    "resource type filter is applied in the backend",
  );

  const resourceFiltered = await getAdminCalendar({
    date: today,
    resourceType: "property",
    resourceId: "property-001",
  });
  assert(resourceFiltered.ok, "resource id filter query succeeds");
  if (!resourceFiltered.ok) {
    throw new Error("resource id filter query failed");
  }
  assert(
    resourceFiltered.days[0].appointments.every(
      (item) => item.resource.id === "property-001",
    ),
    "resource id filter is applied in the backend",
  );

  const multiDay = await getAdminCalendar({ from: yesterday, to: tomorrow });
  assert(multiDay.ok, "multi-day range query succeeds");
  if (!multiDay.ok) {
    throw new Error("multi-day range query failed");
  }
  assert(multiDay.days.length === 3, "every date in the range is returned");
  assert(
    multiDay.days.map((item) => item.date).join(",") ===
      [yesterday, today, tomorrow].join(","),
    "days are returned in ascending order",
  );
  assert(
    multiDay.days.every((item) =>
      item.appointments.every(
        (appointment) => appointment.date === item.date,
      ),
    ),
    "appointments are grouped under their own date",
  );

  const emptyDay = await getAdminCalendar({
    date: shiftCalendarDate(today, 400),
  });
  assert(
    emptyDay.ok && emptyDay.days[0].appointments.length === 0,
    "a day without appointments returns an empty list, not an error",
  );

  const invalidDate = await getAdminCalendar({ date: "13/09/2026" });
  assert(
    !invalidDate.ok && invalidDate.error === "invalid_date",
    "invalid date is rejected by the service",
  );

  const oversized = await getAdminCalendar({
    from: today,
    to: shiftCalendarDate(today, 120),
  });
  assert(
    !oversized.ok && oversized.error === "range_too_large",
    "oversized range is rejected by the service",
  );

  const unauthenticated = appointmentsReadDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot read the agenda",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "client user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientDecision = appointmentsReadDecision({
    access: canAccessAdmin({ user: clientUser, roles: clientRoles }),
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role user cannot read the agenda",
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
      "principal admin can read the agenda",
    );
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }

  // Reading the agenda must not write anything anywhere.
  assert(
    (await prisma.appointment.count()) === appointmentsBefore,
    "reading the calendar does not create or delete appointments",
  );
  assert(
    (await prisma.client.count()) === clientsBefore,
    "reading the calendar does not create clients",
  );
  assert(
    (await prisma.contactRequest.count()) === contactRequestsBefore,
    "reading the calendar does not create contact requests",
  );
  assert(
    (await prisma.notification.count()) === notificationsBefore,
    "reading the calendar does not create notifications",
  );
  assert(
    (await prisma.availabilityRule.count()) === availabilityRulesBefore,
    "reading the calendar does not touch availability",
  );

  const statusesAfter = await prisma.appointment.findMany({
    where: { id: { startsWith: SMOKE_PREFIX } },
    select: { id: true, status: true },
    orderBy: { id: "asc" },
  });
  assert(
    JSON.stringify(statusesAfter) === JSON.stringify(statusesBefore),
    "appointment statuses are untouched by the agenda",
  );

  console.log("calendar_day", today, day.days[0].appointments.length);
  console.log("calendar_range_days", multiDay.days.length);
  console.log("calendar_authz_unauthenticated", unauthenticated.status);
  console.log("calendar_authz_client", clientDecision.status);
  console.log("ok");

  await prisma.appointment.deleteMany({
    where: { id: { startsWith: SMOKE_PREFIX } },
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
