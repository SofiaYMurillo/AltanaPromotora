import "dotenv/config";

import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import { toPublicAppointmentConfirmation } from "../src/backend/mappers/appointment-mapper";
import * as availabilityRepository from "../src/backend/repositories/availability-repository";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import {
  authenticateAdmin,
  resolveAuthenticationChallenge,
} from "../src/backend/services/auth-service";
import { auditActorFromUser } from "../src/backend/services/audit-service";
import {
  activityReadDecision,
  appointmentManageDecision,
  appointmentsReadDecision,
  catalogAccessDecision,
  clientsReadDecision,
  contactRequestsAccessDecision,
  notificationsAccessDecision,
  principalAdminDecision,
} from "../src/backend/services/authorize-service";
import {
  getAdminAppointment,
  updateAppointmentStatus,
} from "../src/backend/services/appointment-service";
import { getPublicAvailability } from "../src/backend/services/availability-service";
import { getAdminCalendar } from "../src/backend/services/calendar-service";
import {
  getPublicProject,
  listPublicProjects,
  updateProjectStatus,
} from "../src/backend/services/project-service";
import {
  getPublicProperty,
  listPublicProperties,
  updatePropertyStatus,
} from "../src/backend/services/property-service";
import { createPublicContactRequest } from "../src/backend/services/contact-request-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";
import { getDashboardData } from "../src/features/admin/dashboard/dashboard.data";
import type { Appointment } from "../src/domain";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const stamp = Date.now();
const SMOKE = `integration-smoke-${stamp}`;

/** Every internal gate must agree on who is allowed and on which status. */
const GATES = {
  clients: clientsReadDecision,
  appointments: appointmentsReadDecision,
  catalog: catalogAccessDecision,
  contactRequests: contactRequestsAccessDecision,
  notifications: notificationsAccessDecision,
  activity: activityReadDecision,
};

async function main() {
  const projectIds: string[] = [];
  const propertyIds: string[] = [];
  const appointmentIds: string[] = [];
  const clientIds: string[] = [];
  const contactRequestIds: string[] = [];

  try {
    // ---------- FLUJO I: authorization coherence across verticals ----------
    const visitorContext = await resolveAuthFromToken(undefined);
    for (const [name, gate] of Object.entries(GATES)) {
      const decision = gate(visitorContext);
      assert(
        !decision.ok && decision.status === 401 && decision.error === "unauthorized",
        `${name} gate answers 401/unauthorized without session`,
      );
    }

    // The principal-admin gate must answer 401 without a session, like the rest.
    const principalWithoutSession = principalAdminDecision(visitorContext);
    assert(
      !principalWithoutSession.ok &&
        principalWithoutSession.status === 401 &&
        principalWithoutSession.error === "unauthorized",
      "principal-admin gate answers 401 without session",
    );
    const manageWithoutSession = appointmentManageDecision(visitorContext, false);
    assert(
      !manageWithoutSession.ok && manageWithoutSession.status === 401,
      "appointment-manage gate answers 401 without session",
    );

    // Challenge must not enumerate why an email is rejected for internal access.
    const clientChallenge = await resolveAuthenticationChallenge(
      "client@altana.test",
    );
    assert(
      clientChallenge.method === "unsupported" &&
        clientChallenge.reason === "not_allowed",
      "client challenge uses opaque not_allowed reason",
    );
    const unknownChallenge = await resolveAuthenticationChallenge(
      `nobody-${stamp}@altana.test`,
    );
    assert(
      unknownChallenge.method === "unsupported" &&
        unknownChallenge.reason === "not_allowed",
      "unknown email challenge uses the same opaque reason",
    );

    const clientUser = await userRepository.findUserByEmail("client@altana.test");
    assert(clientUser, "client user exists");
    const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
    const clientContext = {
      access: canAccessAdmin({ user: clientUser, roles: clientRoles }),
      user: clientUser,
      roles: clientRoles,
      sessionId: null,
    };
    for (const [name, gate] of Object.entries(GATES)) {
      const decision = gate(clientContext);
      assert(
        !decision.ok && decision.status === 403 && decision.error === "forbidden",
        `${name} gate answers 403/forbidden for a client role`,
      );
    }
    const principalForClient = principalAdminDecision(clientContext);
    assert(
      !principalForClient.ok && principalForClient.status === 403,
      "principal-admin gate answers 403 for a client role",
    );
    const manageForClient = appointmentManageDecision(clientContext, false);
    assert(
      !manageForClient.ok && manageForClient.status === 403,
      "appointment-manage gate answers 403 for a client role (not 401)",
    );

    const workerUser = await userRepository.findUserByEmail("worker@altana.test");
    assert(workerUser, "internal worker exists");
    const workerRoles = await roleRepository.getRolesForUser(workerUser!.id);
    const workerContext = {
      access: canAccessAdmin({ user: workerUser, roles: workerRoles }),
      user: workerUser,
      roles: workerRoles,
      sessionId: null,
    };
    for (const [name, gate] of Object.entries(GATES)) {
      assert(gate(workerContext).ok, `${name} gate allows an authorized worker`);
    }
    const principalForWorker = principalAdminDecision(workerContext);
    assert(
      !principalForWorker.ok && principalForWorker.status === 403,
      "a worker is not the principal admin",
    );
    // Seed workers lack appointments.manage — elevated PATCH stays closed.
    const manageForWorker = appointmentManageDecision(workerContext, false);
    assert(
      !manageForWorker.ok && manageForWorker.status === 403,
      "worker without appointments.manage cannot use the elevated appointment PATCH",
    );
    // Admin UI status write remains open to any internal user.
    assert(
      appointmentsReadDecision(workerContext).ok,
      "worker may still use internal appointment read/write gates",
    );

    const adminPassword = process.env.ADMIN_SEED_PASSWORD || "DevOnly-ChangeMe!";
    const adminLogin = await authenticateAdmin({
      email: getPrincipalAdminEmail(),
      password: adminPassword,
    });
    assert(adminLogin.ok, "principal admin authenticates");
    if (!adminLogin.ok) {
      throw new Error("admin login failed");
    }
    const adminContext = await resolveAuthFromToken(adminLogin.token);
    for (const [name, gate] of Object.entries(GATES)) {
      assert(gate(adminContext).ok, `${name} gate allows the principal admin`);
    }
    assert(
      principalAdminDecision(adminContext).ok,
      "principal-admin gate allows the principal admin",
    );
    assert(
      appointmentManageDecision(adminContext, false).ok,
      "principal admin may use the elevated appointment PATCH without the permission row",
    );
    assert(
      appointmentManageDecision(workerContext, true).ok,
      "a worker with appointments.manage may use the elevated appointment PATCH",
    );
    const actor = auditActorFromUser(adminContext.user);
    assert(actor?.id === adminContext.user?.id, "actor comes from the session");

    // FLUJO A: revoking the session must close every internal gate again.
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
    const revokedContext = await resolveAuthFromToken(adminLogin.token);
    for (const [name, gate] of Object.entries(GATES)) {
      const decision = gate(revokedContext);
      assert(
        !decision.ok && decision.status === 401,
        `${name} gate rejects a revoked session`,
      );
    }

    // ---------- FLUJO C/D: catalog visibility is driven by persistence ----------
    const project = await prisma.project.create({
      data: {
        id: `project-${SMOKE}`,
        title: `Proyecto ${SMOKE}`,
        imageSrc: "/images/projects-placeholder.jpg",
        imageAlt: "Proyecto de integración",
        sectionsJson: "[]",
        active: true,
        updatedAt: new Date(),
      },
    });
    projectIds.push(project.id);

    const linkedProperty = await prisma.property.create({
      data: {
        id: `property-linked-${SMOKE}`,
        projectId: project.id,
        title: `Inmueble con proyecto ${SMOKE}`,
        operation: "sale",
        type: "apartment",
        city: "Bogotá",
        bedrooms: 2,
        bathrooms: 2,
        area: 70,
        parkingSpaces: 1,
        price: 300000000,
        featuresJson: "[]",
        imagesJson: JSON.stringify([
          { src: "/images/projects-placeholder.jpg", alt: "Inmueble" },
        ]),
        active: true,
        updatedAt: new Date(),
      },
    });
    propertyIds.push(linkedProperty.id);

    const orphanProperty = await prisma.property.create({
      data: {
        id: `property-orphan-${SMOKE}`,
        title: `Inmueble sin proyecto ${SMOKE}`,
        operation: "rent",
        type: "house",
        city: "Pereira",
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        parkingSpaces: 2,
        price: 3500000,
        featuresJson: "[]",
        imagesJson: JSON.stringify([
          { src: "/images/projects-placeholder.jpg", alt: "Inmueble" },
        ]),
        active: true,
        updatedAt: new Date(),
      },
    });
    propertyIds.push(orphanProperty.id);

    // A property may exist without a project, and its public read must not fail.
    const publicOrphan = await getPublicProperty(orphanProperty.id);
    assert(
      publicOrphan && !publicOrphan.projectId,
      "a property without project is publicly readable",
    );
    assert(
      (await getPublicProject("project-does-not-exist")) === null,
      "a missing project resolves to null instead of throwing",
    );

    // Deactivating a project must not cascade into its properties.
    const deactivated = await updateProjectStatus(project.id, false, { actor });
    assert(deactivated.ok, "project deactivated");
    const propertyAfterProjectOff = await prisma.property.findUnique({
      where: { id: linkedProperty.id },
    });
    assert(
      propertyAfterProjectOff?.active === true,
      "deactivating a project leaves its properties active",
    );
    assert(
      !(await listPublicProjects()).some((item) => item.id === project.id),
      "an inactive project is hidden from the public catalog",
    );
    assert(
      (await listPublicProperties()).some((item) => item.id === linkedProperty.id),
      "a property of an inactive project stays publicly listed on its own merit",
    );

    // Deactivating a property must not touch the project.
    const propertyOff = await updatePropertyStatus(linkedProperty.id, false, {
      actor,
    });
    assert(propertyOff.ok, "property deactivated");
    const projectAfterPropertyOff = await prisma.project.findUnique({
      where: { id: project.id },
    });
    assert(
      projectAfterPropertyOff?.active === false,
      "deactivating a property does not alter the project record",
    );
    assert(
      (await getPublicProperty(linkedProperty.id)) === null,
      "an inactive property is hidden from the public detail page",
    );

    // ---------- FLUJO F: status change audits exactly once ----------
    const client = await prisma.client.create({
      data: {
        id: `client-${SMOKE}`,
        firstName: "Cliente",
        lastName: "Integración",
        email: `integration-${stamp}@altana.test`,
        phone: "3009876543",
      },
    });
    clientIds.push(client.id);

    const appointment = await prisma.appointment.create({
      data: {
        id: `appointment-${SMOKE}`,
        clientId: client.id,
        date: "2026-12-02",
        time: "11:00",
        type: "property",
        propertyId: orphanProperty.id,
        status: "pending",
        communicationPreference: "email",
        contactEmail: `integration-${stamp}@altana.test`,
        contactPhone: "3009876543",
      },
    });
    appointmentIds.push(appointment.id);

    // Visit-resource display must follow persisted Property, not a static map.
    const adminDetail = await getAdminAppointment(appointment.id);
    assert(adminDetail, "admin appointment detail loads");
    assert(
      adminDetail!.resource.title === orphanProperty.title &&
        adminDetail!.resource.location === "Pereira" &&
        !adminDetail!.resource.missing,
      "admin appointment resource title comes from persisted Property",
    );
    assert(
      adminDetail!.client?.id === client.id,
      "admin appointment shows the linked Client",
    );

    const publicShape = toPublicAppointmentConfirmation({
      id: appointment.id,
      type: "property",
      propertyId: orphanProperty.id,
      date: appointment.date,
      time: appointment.time,
      status: "pending",
      communicationPreference: "email",
      contact: { email: `integration-${stamp}@altana.test` },
      clientId: client.id,
      assignedWorkerId: "user-should-not-leak",
    } satisfies Appointment);
    assert(
      !("clientId" in publicShape) && !("assignedWorkerId" in publicShape),
      "public appointment confirmation omits internal linkage fields",
    );

    const calendar = await getAdminCalendar({ date: "2026-12-02" });
    assert(calendar.ok, "calendar loads the appointment day");
    if (calendar.ok) {
      const day = calendar.days.find((item) => item.date === "2026-12-02");
      const item = day?.appointments.find((entry) => entry.id === appointment.id);
      assert(item, "calendar includes the appointment");
      assert(
        item!.resource.title === orphanProperty.title && !item!.resource.missing,
        "calendar resource title comes from persisted Property",
      );
      assert(
        item!.clientDisplay.includes("Cliente"),
        "calendar shows the client display name",
      );
    }

    // An active persisted property is a bookable visit resource.
    await availabilityRepository.upsertAvailabilityRule({
      id: `availability-${SMOKE}`,
      resourceType: "property",
      resourceId: orphanProperty.id,
      day: 3,
      startTime: "09:00",
      endTime: "11:00",
      interval: 60,
      slotCapacity: 1,
      active: true,
    });
    const activeAvailability = await getPublicAvailability({
      resourceType: "property",
      resourceId: orphanProperty.id,
      date: "2099-06-02",
    });
    assert(activeAvailability.ok, "active persisted property is a known visit resource");

    await prisma.property.update({
      where: { id: orphanProperty.id },
      data: { active: false },
    });
    const inactiveAvailability = await getPublicAvailability({
      resourceType: "property",
      resourceId: orphanProperty.id,
      date: "2099-06-02",
    });
    assert(
      !inactiveAvailability.ok && inactiveAvailability.error === "invalid_resource",
      "inactive persisted property is rejected as a visit resource",
    );
    await prisma.property.update({
      where: { id: orphanProperty.id },
      data: { active: true },
    });

    const notificationsBefore = await prisma.notification.count();
    const clientsBefore = await prisma.client.count();

    const confirmed = await updateAppointmentStatus(
      appointment.id,
      "confirmed",
      undefined,
      { actor },
    );
    assert(confirmed.ok, "appointment confirmed");

    const statusEntries = await prisma.auditEntry.findMany({
      where: { entityType: "appointment", entityId: appointment.id },
    });
    assert(
      statusEntries.length === 1,
      `a status change writes exactly one audit entry (got ${statusEntries.length})`,
    );
    assert(
      statusEntries[0].actorUserId === actor!.id,
      "the audit entry stores the backend actor",
    );

    // Capacity: a confirmed visit occupies the slot, a cancelled one frees it.
    const occupyingWhileConfirmed = await prisma.appointment.count({
      where: {
        propertyId: orphanProperty.id,
        date: "2026-12-02",
        time: "11:00",
        status: { in: ["pending", "confirmed"] },
      },
    });
    assert(occupyingWhileConfirmed === 1, "a confirmed visit occupies the slot");

    const cancelled = await updateAppointmentStatus(
      appointment.id,
      "cancelled",
      undefined,
      { actor },
    );
    assert(cancelled.ok, "appointment cancelled");
    const occupyingAfterCancel = await prisma.appointment.count({
      where: {
        propertyId: orphanProperty.id,
        date: "2026-12-02",
        time: "11:00",
        status: { in: ["pending", "confirmed"] },
      },
    });
    assert(occupyingAfterCancel === 0, "a cancelled visit frees the slot");

    const terminal = await updateAppointmentStatus(
      appointment.id,
      "confirmed",
      undefined,
      { actor },
    );
    assert(
      !terminal.ok && terminal.error === "invalid_transition",
      "a terminal status cannot be reopened",
    );

    // Audit must not spill into the other two concepts.
    assert(
      (await prisma.notification.count()) === notificationsBefore,
      "audited administrative actions do not create notifications",
    );
    assert(
      (await prisma.client.count()) === clientsBefore,
      "audited administrative actions do not create clients",
    );

    // ---------- FLUJO G: contact request stays isolated ----------
    const appointmentsBefore = await prisma.appointment.count();
    const contactClientsBefore = await prisma.client.count();
    const contact = await createPublicContactRequest(
      {
        name: "Visitante Integración",
        email: `integration-visitor-${stamp}@altana.test`,
        message: "Quiero información sobre el proyecto.",
      },
      `integration-ip-${stamp}`,
    );
    assert(contact.ok, "public contact request created");
    if (contact.ok) {
      contactRequestIds.push(contact.contactRequest.id);
    }
    assert(
      (await prisma.client.count()) === contactClientsBefore,
      "a contact request does not create a Client",
    );
    assert(
      (await prisma.appointment.count()) === appointmentsBefore,
      "a contact request does not create an Appointment",
    );
    assert(
      (await prisma.auditEntry.count({
        where: { entityType: "contact_request", entityId: contactRequestIds[0] },
      })) === 0,
      "a public contact request is not administrative activity",
    );

    // ---------- Dashboard reads persistence, not static config ----------
    const dashboard = await getDashboardData();
    const roles = await roleRepository.listRoles();
    const internalRoleIds = new Set(
      roles
        .filter((role) => role.name === "admin" || role.name === "worker")
        .map((role) => role.id),
    );
    const persistedInternalUsers = new Set(
      (await roleRepository.listUserRoles())
        .filter((assignment) => internalRoleIds.has(assignment.roleId))
        .map((assignment) => assignment.userId),
    ).size;
    assert(
      dashboard.internalUsersCount === persistedInternalUsers,
      `dashboard counts internal users from the database (got ${dashboard.internalUsersCount}, expected ${persistedInternalUsers})`,
    );
    assert(
      dashboard.projectsCount === (await prisma.project.count()),
      "dashboard project count matches persistence",
    );
    assert(
      dashboard.propertiesCount === (await prisma.property.count()),
      "dashboard property count matches persistence",
    );

    console.log("integration_gates", Object.keys(GATES).length);
    console.log("integration_audit_entries", statusEntries.length);
    console.log("ok");
  } finally {
    await prisma.auditEntry.deleteMany({
      where: {
        entityId: {
          in: [...projectIds, ...propertyIds, ...appointmentIds, ...contactRequestIds],
        },
      },
    });
    await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
    for (const propertyId of propertyIds) {
      await availabilityRepository.deleteAvailabilityRulesByResource(
        "property",
        propertyId,
      );
    }
    await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
    await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    await prisma.contactRequest.deleteMany({
      where: { id: { in: contactRequestIds } },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
