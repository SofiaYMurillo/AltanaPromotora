import "dotenv/config";

import {
  MAX_AUDIT_PAGE_SIZE,
  sanitizeAuditMetadata,
  validateAuditDraft,
} from "../src/domain";
import { canAccessAdmin } from "../src/features/auth/access";
import { prisma } from "../src/backend/db";
import * as roleRepository from "../src/backend/repositories/role-repository";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import { hashSessionToken } from "../src/backend/security/password";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import {
  auditActorFromUser,
  listAdminAuditEntries,
  recordAuditEntry,
} from "../src/backend/services/audit-service";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { activityReadDecision } from "../src/backend/services/authorize-service";
import {
  createProject,
  updateProject,
  updateProjectStatus,
} from "../src/backend/services/project-service";
import {
  createProperty,
  updateProperty,
} from "../src/backend/services/property-service";
import { updateAppointmentStatus } from "../src/backend/services/appointment-service";
import { updateContactRequestStatus } from "../src/backend/services/contact-request-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const stamp = Date.now();
const SMOKE_LABEL = `activity-smoke-${stamp}`;

async function cleanup(ids: {
  projectIds: string[];
  propertyIds: string[];
  appointmentIds: string[];
  contactRequestIds: string[];
  clientIds: string[];
}) {
  await prisma.auditEntry.deleteMany({
    where: {
      OR: [
        { entityId: { in: [...ids.projectIds, ...ids.propertyIds] } },
        { entityId: { in: ids.appointmentIds } },
        { entityId: { in: ids.contactRequestIds } },
        { entityLabel: { contains: SMOKE_LABEL } },
      ],
    },
  });
  await prisma.property.deleteMany({ where: { id: { in: ids.propertyIds } } });
  await prisma.project.deleteMany({ where: { id: { in: ids.projectIds } } });
  await prisma.appointment.deleteMany({
    where: { id: { in: ids.appointmentIds } },
  });
  await prisma.contactRequest.deleteMany({
    where: { id: { in: ids.contactRequestIds } },
  });
  await prisma.client.deleteMany({ where: { id: { in: ids.clientIds } } });
}

async function main() {
  const projectIds: string[] = [];
  const propertyIds: string[] = [];
  const appointmentIds: string[] = [];
  const contactRequestIds: string[] = [];
  const clientIds: string[] = [];

  // ----- domain contract -----
  assert(
    validateAuditDraft({
      action: "deleted",
      entityType: "project",
      entityId: "project-1",
    }) === "invalid_action",
    "unknown action rejected",
  );
  assert(
    validateAuditDraft({
      action: "created",
      entityType: "invoice",
      entityId: "x",
    }) === "invalid_entity_type",
    "arbitrary entity type rejected",
  );
  assert(
    validateAuditDraft({
      action: "created",
      entityType: "project",
      entityId: "  ",
    }) === "invalid_entity_id",
    "blank entity id rejected",
  );

  const sanitized = sanitizeAuditMetadata({
    password: "secret",
    passwordHash: "hash",
    sessionToken: "token",
    cookie: "value",
    invitationCode: "ABC123",
    status: "confirmed",
    nested: { a: 1 },
    list: [1, 2],
  });
  assert(
    sanitized !== null && Object.keys(sanitized).length === 1 && sanitized.status === "confirmed",
    `metadata sanitizer keeps only safe primitives (got ${JSON.stringify(sanitized)})`,
  );

  // ----- authorization -----
  const unauthenticated = activityReadDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot read activity",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "client user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientDecision = activityReadDecision({
    access: canAccessAdmin({ user: clientUser, roles: clientRoles }),
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role cannot read activity",
  );

  const workerUser = await userRepository.findUserByEmail("worker@altana.test");
  assert(workerUser, "internal worker exists");
  const workerRoles = await roleRepository.getRolesForUser(workerUser!.id);
  const workerDecision = activityReadDecision({
    access: canAccessAdmin({ user: workerUser, roles: workerRoles }),
    user: workerUser,
    roles: workerRoles,
    sessionId: null,
  });
  assert(workerDecision.ok, "authorized internal user can read activity");

  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "DevOnly-ChangeMe!";
  const adminLogin = await authenticateAdmin({
    email: getPrincipalAdminEmail(),
    password: adminPassword,
  });
  assert(adminLogin.ok, "principal admin authenticates");

  let actor = null as ReturnType<typeof auditActorFromUser>;
  if (adminLogin.ok) {
    const adminContext = await resolveAuthFromToken(adminLogin.token);
    assert(
      activityReadDecision(adminContext).ok,
      "principal admin can read activity",
    );
    actor = auditActorFromUser(adminContext.user);
    assert(
      actor?.id === adminContext.user?.id,
      "actor identity comes from the resolved session, not from input",
    );
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }
  assert(actor, "actor resolved from backend session");

  // ----- integrity: administrative actions produce entries -----
  const notificationsBefore = await prisma.notification.count();
  const clientsBefore = await prisma.client.count();
  const appointmentsBefore = await prisma.appointment.count();

  const projectDraft = {
    title: `Proyecto ${SMOKE_LABEL}`,
    image: { src: "/images/projects-placeholder.jpg", alt: "Proyecto de prueba" },
    sections: [
      {
        title: "Ubicación",
        description: "Zona norte de la ciudad, cerca de vías principales.",
        image: {
          src: "/images/projects-placeholder.jpg",
          alt: "Sección de prueba",
        },
      },
    ],
    active: true,
  };

  const createdProject = await createProject(projectDraft, { actor });
  assert(createdProject.ok, "project created");
  if (!createdProject.ok) {
    throw new Error("project creation failed");
  }
  projectIds.push(createdProject.project.id);

  const updatedProject = await updateProject(
    createdProject.project.id,
    { ...projectDraft, title: `Proyecto editado ${SMOKE_LABEL}` },
    { actor },
  );
  assert(updatedProject.ok, "project updated");

  const toggledProject = await updateProjectStatus(
    createdProject.project.id,
    false,
    { actor },
  );
  assert(toggledProject.ok, "project status changed");

  const propertyDraft = {
    title: `Inmueble ${SMOKE_LABEL}`,
    projectId: createdProject.project.id,
    operation: "sale",
    type: "apartment",
    city: "Bogotá",
    bedrooms: 3,
    bathrooms: 2,
    area: 90,
    parkingSpaces: 1,
    price: 450000000,
    features: ["Balcón"],
    images: [
      { src: "/images/projects-placeholder.jpg", alt: "Inmueble de prueba" },
    ],
    active: true,
  };

  const createdProperty = await createProperty(propertyDraft, { actor });
  assert(createdProperty.ok, "property created");
  if (!createdProperty.ok) {
    throw new Error("property creation failed");
  }
  propertyIds.push(createdProperty.property.id);

  const updatedProperty = await updateProperty(
    createdProperty.property.id,
    { ...propertyDraft, price: 460000000 },
    { actor },
  );
  assert(updatedProperty.ok, "property updated");

  const client = await prisma.client.create({
    data: {
      id: `client-${SMOKE_LABEL}`,
      firstName: "Cliente",
      lastName: "Actividad",
      email: `activity-smoke-${stamp}@altana.test`,
      phone: "3001234567",
    },
  });
  clientIds.push(client.id);

  const appointment = await prisma.appointment.create({
    data: {
      id: `appointment-${SMOKE_LABEL}`,
      clientId: client.id,
      date: "2026-12-01",
      time: "10:00",
      type: "property",
      propertyId: createdProperty.property.id,
      status: "pending",
      communicationPreference: "email",
      contactEmail: `activity-smoke-${stamp}@altana.test`,
      contactPhone: "3001234567",
    },
  });
  appointmentIds.push(appointment.id);

  const appointmentUpdate = await updateAppointmentStatus(
    appointment.id,
    "confirmed",
    undefined,
    { actor },
  );
  assert(appointmentUpdate.ok, "appointment status changed");

  const contactRequest = await prisma.contactRequest.create({
    data: {
      id: `contact-request-${SMOKE_LABEL}`,
      name: "Visitante Actividad",
      email: `activity-visitor-${stamp}@altana.test`,
      message: "Quiero información del proyecto.",
      status: "pending",
      updatedAt: new Date(),
    },
  });
  contactRequestIds.push(contactRequest.id);

  const contactUpdate = await updateContactRequestStatus(
    contactRequest.id,
    "responded",
    { actor },
  );
  assert(contactUpdate.ok, "contact request status changed");

  // Invitation actions are audited through the same recorder boundary.
  await recordAuditEntry({
    actor,
    action: "invitation_created",
    entityType: "invitation",
    entityId: `invitation-${SMOKE_LABEL}`,
    entityLabel: `${SMOKE_LABEL}@altana.test`,
    metadata: { roleId: "role-worker", invitationCode: "MUST-NOT-PERSIST" },
  });
  await recordAuditEntry({
    actor,
    action: "invitation_revoked",
    entityType: "invitation",
    entityId: `invitation-${SMOKE_LABEL}`,
    entityLabel: `${SMOKE_LABEL}@altana.test`,
  });

  try {
    const smokeEntries = await prisma.auditEntry.findMany({
      where: {
        OR: [
          { entityId: { in: [...projectIds, ...propertyIds] } },
          { entityId: { in: appointmentIds } },
          { entityId: { in: contactRequestIds } },
          { entityLabel: { contains: SMOKE_LABEL } },
        ],
      },
    });

    function has(entityType: string, action: string, entityId?: string) {
      return smokeEntries.some(
        (entry) =>
          entry.entityType === entityType &&
          entry.action === action &&
          (entityId ? entry.entityId === entityId : true),
      );
    }

    assert(has("project", "created"), "project creation is audited");
    assert(has("project", "updated"), "project update is audited");
    assert(has("project", "status_changed"), "project status change is audited");
    assert(has("property", "created"), "property creation is audited");
    assert(has("property", "updated"), "property update is audited");
    assert(
      has("appointment", "status_changed", appointment.id),
      "appointment status change is audited",
    );
    assert(
      has("contact_request", "status_changed", contactRequest.id),
      "contact request status change is audited",
    );
    assert(has("invitation", "invitation_created"), "invitation creation is audited");
    assert(has("invitation", "invitation_revoked"), "invitation revocation is audited");

    assert(
      smokeEntries.every((entry) => entry.actorUserId === actor!.id),
      "every entry stores the backend-resolved actor",
    );
    assert(
      smokeEntries.every(
        (entry) => !/MUST-NOT-PERSIST|password|token|cookie/i.test(entry.metadataJson ?? ""),
      ),
      "no secrets are persisted in metadata",
    );

    // ----- read contract -----
    const listed = await listAdminAuditEntries({ limit: 5 });
    assert(listed.ok, "admin list returns entries");
    if (!listed.ok) {
      throw new Error("list failed");
    }
    assert(listed.entries.length <= 5, "limit is respected");
    assert(
      listed.entries.every(
        (entry, index) =>
          index === 0 || listed.entries[index - 1].createdAt >= entry.createdAt,
      ),
      "entries are ordered newest first",
    );

    const clamped = await listAdminAuditEntries({ limit: 5000 });
    assert(
      clamped.ok && clamped.entries.length <= MAX_AUDIT_PAGE_SIZE,
      "excessive limit is clamped by the backend",
    );

    const byEntity = await listAdminAuditEntries({ entityType: "property" });
    assert(
      byEntity.ok && byEntity.entries.every((entry) => entry.entityType === "property"),
      "entity filter applies in the backend",
    );

    const byAction = await listAdminAuditEntries({ action: "status_changed" });
    assert(
      byAction.ok && byAction.entries.every((entry) => entry.action === "status_changed"),
      "action filter applies in the backend",
    );

    const byActor = await listAdminAuditEntries({ actorUserId: actor!.id });
    assert(
      byActor.ok && byActor.entries.every((entry) => entry.actorUserId === actor!.id),
      "actor filter applies in the backend",
    );

    const today = new Date().toISOString().slice(0, 10);
    const validRange = await listAdminAuditEntries({ from: today, to: today });
    assert(validRange.ok, "valid date range accepted");

    const badDate = await listAdminAuditEntries({ from: "14-09-2026" });
    assert(
      !badDate.ok && badDate.error === "invalid_date",
      "malformed date rejected",
    );

    const invertedRange = await listAdminAuditEntries({
      from: "2026-09-14",
      to: "2026-09-01",
    });
    assert(
      !invertedRange.ok && invertedRange.error === "invalid_date",
      "inverted range rejected",
    );

    const hugeRange = await listAdminAuditEntries({
      from: "2020-01-01",
      to: "2026-01-01",
    });
    assert(
      !hugeRange.ok && hugeRange.error === "range_too_large",
      "oversized range rejected",
    );

    const badPagination = await listAdminAuditEntries({ offset: -1 });
    assert(
      !badPagination.ok && badPagination.error === "invalid_pagination",
      "negative offset rejected",
    );

    const firstPage = await listAdminAuditEntries({ limit: 2, offset: 0 });
    const secondPage = await listAdminAuditEntries({ limit: 2, offset: 2 });
    assert(
      firstPage.ok && secondPage.ok,
      "pagination pages resolve",
    );
    if (firstPage.ok && secondPage.ok && secondPage.entries.length > 0) {
      assert(
        !firstPage.entries.some((entry) =>
          secondPage.entries.some((other) => other.id === entry.id),
        ),
        "pages do not overlap",
      );
    }

    const unknownEntity = await listAdminAuditEntries({ entityType: "invoice" });
    assert(
      !unknownEntity.ok && unknownEntity.error === "invalid_entity_type",
      "unknown entity filter rejected",
    );

    // ----- isolation -----
    assert(
      (await prisma.notification.count()) === notificationsBefore,
      "audit does not create notifications",
    );
    assert(
      (await prisma.client.count()) === clientsBefore + clientIds.length,
      "audit does not create clients",
    );
    assert(
      (await prisma.appointment.count()) === appointmentsBefore + appointmentIds.length,
      "audit does not create appointments",
    );

    const reloadedAppointment = await prisma.appointment.findUnique({
      where: { id: appointment.id },
    });
    assert(
      reloadedAppointment?.status === "confirmed",
      "audit does not alter the appointment state machine",
    );

    const reloadedClient = await prisma.client.findUnique({
      where: { id: client.id },
    });
    assert(
      reloadedClient?.firstName === "Cliente",
      "audit does not modify clients",
    );

    // Immutability: the repository exposes no update/delete surface.
    const auditRepositoryModule = await import(
      "../src/backend/repositories/audit-repository"
    );
    assert(
      !Object.keys(auditRepositoryModule).some((key) =>
        /update|delete|remove|purge/i.test(key),
      ),
      "audit repository exposes no mutation of existing entries",
    );

    const activityRoute = await import(
      "../src/app/api/admin/activity/route"
    );
    assert(
      Object.keys(activityRoute).join(",") === "GET",
      `activity API is read-only (exports: ${Object.keys(activityRoute).join(",")})`,
    );

    console.log("activity_entries", smokeEntries.length);
    console.log("activity_authz_unauthenticated", unauthenticated.status);
    console.log("activity_authz_client", clientDecision.status);
    console.log("ok");
  } finally {
    await cleanup({
      projectIds,
      propertyIds,
      appointmentIds,
      contactRequestIds,
      clientIds,
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
