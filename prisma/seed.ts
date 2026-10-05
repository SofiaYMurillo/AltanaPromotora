import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { permissions } from "../src/config/permission.data";
import { rolePermissions } from "../src/config/role-permission.data";
import { roles } from "../src/config/role.data";
import { userRoles } from "../src/config/user-role.data";
import { users } from "../src/config/user.data";
import {
  initialProjects,
  initialProperties,
} from "../src/backend/catalog/initial-catalog.data";
import {
  seedAppointments,
  seedGlobalPropertyVisitAvailability,
  seedOfficeAvailability,
  seedPropertyAvailability,
} from "./seed-scheduling.data";
import { PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID } from "../src/domain/availability-resources";
import { clients } from "../src/config/client.data";
import { contactRequests } from "../src/config/contact-request.data";
import { workerInvitations } from "../src/config/worker-invitation.data";
import { resolveDatabaseUrl } from "../src/backend/db-url";
import { ensureInitialAdministrator } from "../src/backend/bootstrap/ensure-initial-administrator";
import { seedBrandMediaAssets } from "./seed-brand-assets";
import { ensureGoogleAuthorizedIdentities } from "../src/backend/bootstrap/ensure-google-authorized-identities";
import { syncPrincipalAdminIdentity } from "../src/backend/bootstrap/sync-principal-admin-identity";
import {
  getAdminSeedPassword,
  getInitialAdminEmail,
  getPrincipalAdminUserId,
} from "../src/backend/config/auth-config";
import { DEFAULT_SLOT_CAPACITY } from "../src/domain";
import { toPrismaAppointmentData } from "../src/backend/mappers/appointment-mapper";
import { hashInvitationCode } from "../src/backend/security/invitation-code";
import { hashPassword } from "../src/backend/security/password";

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(
    process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  ),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      create: {
        id: role.id,
        name: role.name,
        label: role.label,
        createdAt: new Date(role.createdAt),
        updatedAt: new Date(role.updatedAt),
      },
      update: {
        name: role.name,
        label: role.label,
        updatedAt: new Date(role.updatedAt),
      },
    });
  }

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { id: permission.id },
      create: {
        id: permission.id,
        name: permission.name,
        label: permission.label,
        createdAt: new Date(permission.createdAt),
        updatedAt: new Date(permission.updatedAt),
      },
      update: {
        name: permission.name,
        label: permission.label,
        updatedAt: new Date(permission.updatedAt),
      },
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? null,
        active: user.active,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
      update: {
        email: user.email.toLowerCase(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? null,
        active: user.active,
        updatedAt: new Date(user.updatedAt),
      },
    });
  }

  for (const assignment of userRoles) {
    await prisma.userRole.upsert({
      where: { id: assignment.id },
      create: {
        id: assignment.id,
        userId: assignment.userId,
        roleId: assignment.roleId,
        createdAt: new Date(assignment.createdAt),
        updatedAt: new Date(assignment.updatedAt),
      },
      update: {
        userId: assignment.userId,
        roleId: assignment.roleId,
        updatedAt: new Date(assignment.updatedAt),
      },
    });
  }

  for (const assignment of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: { id: assignment.id },
      create: {
        id: assignment.id,
        roleId: assignment.roleId,
        permissionId: assignment.permissionId,
        createdAt: new Date(assignment.createdAt),
        updatedAt: new Date(assignment.updatedAt),
      },
      update: {
        roleId: assignment.roleId,
        permissionId: assignment.permissionId,
        updatedAt: new Date(assignment.updatedAt),
      },
    });
  }

  const restrictedWorkerUserId = "user-004";
  const restrictedWorkerPermissions = [
    "availability.manage",
    "projects.manage",
  ];

  await prisma.userPermission.deleteMany({
    where: { userId: restrictedWorkerUserId },
  });

  for (const permissionName of restrictedWorkerPermissions) {
    const permission = permissions.find((item) => item.name === permissionName);
    if (!permission) {
      continue;
    }

    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: restrictedWorkerUserId,
          permissionId: permission.id,
        },
      },
      create: {
        id: `user-permission-${restrictedWorkerUserId}-${permission.id}`,
        userId: restrictedWorkerUserId,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  await syncPrincipalAdminIdentity(prisma);
  await ensureGoogleAuthorizedIdentities(prisma);

  const initialAdminUserId = await ensureInitialAdministrator(prisma);

  if (!getInitialAdminEmail()) {
    const principalId = getPrincipalAdminUserId();
    const passwordHash = hashPassword(getAdminSeedPassword());

    await prisma.credential.upsert({
      where: { userId: principalId },
      create: {
        userId: principalId,
        passwordHash,
      },
      update: {
        passwordHash,
      },
    });
  }

  const devInvitationCodes: Record<string, string> = {
    "invitation-001":
      process.env.WORKER_DEV_CODE_VALID?.trim() || "WORKER1A2B",
    "invitation-002":
      process.env.WORKER_DEV_CODE_EXPIRED?.trim() || "EXPIRED1A2",
    "invitation-003":
      process.env.WORKER_DEV_CODE_REVOKED?.trim() || "REVOKED1A2",
    "invitation-004":
      process.env.WORKER_DEV_CODE_USED?.trim() || "USED0001A2",
  };

  for (const invitation of workerInvitations) {
    const code = devInvitationCodes[invitation.id];
    if (!code) {
      continue;
    }

    await prisma.workerInvitation.upsert({
      where: { id: invitation.id },
      create: {
        id: invitation.id,
        email: invitation.email.toLowerCase(),
        roleId: invitation.roleId,
        active: invitation.active,
        codeHash: hashInvitationCode(code),
        createdAt: new Date(invitation.createdAt),
        expiresAt: new Date(invitation.expiresAt),
        revokedAt: invitation.revokedAt
          ? new Date(invitation.revokedAt)
          : null,
        usedAt: invitation.usedAt ? new Date(invitation.usedAt) : null,
      },
      update: {
        email: invitation.email.toLowerCase(),
        roleId: invitation.roleId,
        active: invitation.active,
        codeHash: hashInvitationCode(code),
        expiresAt: new Date(invitation.expiresAt),
        revokedAt: invitation.revokedAt
          ? new Date(invitation.revokedAt)
          : null,
        usedAt: invitation.usedAt ? new Date(invitation.usedAt) : null,
      },
    });
  }

  for (const client of clients) {
    await prisma.client.upsert({
      where: { id: client.id },
      create: {
        id: client.id,
        email: client.email?.toLowerCase() ?? null,
        phone: client.phone ?? null,
        firstName: client.firstName ?? null,
        lastName: client.lastName ?? null,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
      },
      update: {
        email: client.email?.toLowerCase() ?? null,
        phone: client.phone ?? null,
        firstName: client.firstName ?? null,
        lastName: client.lastName ?? null,
        updatedAt: new Date(client.updatedAt),
      },
    });
  }

  for (const request of contactRequests) {
    await prisma.contactRequest.upsert({
      where: { id: request.id },
      create: {
        id: request.id,
        name: request.name,
        email: request.email ?? null,
        phone: request.phone ?? null,
        message: request.message,
        status: request.status,
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt),
      },
      update: {
        name: request.name,
        email: request.email ?? null,
        phone: request.phone ?? null,
        message: request.message,
        status: request.status,
        updatedAt: new Date(request.updatedAt),
      },
    });
  }

  for (const project of initialProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      create: {
        id: project.id,
        title: project.title,
        imageSrc: project.image.src,
        imageAlt: project.image.alt,
        sectionsJson: JSON.stringify(project.sections),
        active: project.active,
      },
      update: {
        title: project.title,
        imageSrc: project.image.src,
        imageAlt: project.image.alt,
        sectionsJson: JSON.stringify(project.sections),
        active: project.active,
      },
    });
  }

  for (const property of initialProperties) {
    await prisma.property.upsert({
      where: { id: property.id },
      create: {
        id: property.id,
        projectId: "projectId" in property ? property.projectId : null,
        title: property.title,
        imagesJson: JSON.stringify(property.images),
        operation: property.operation,
        type: property.type,
        city: property.city,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        parkingSpaces: property.parkingSpaces,
        price: property.price,
        featuresJson: JSON.stringify(property.features),
        active: property.active,
      },
      update: {
        projectId: "projectId" in property ? property.projectId : null,
        title: property.title,
        imagesJson: JSON.stringify(property.images),
        operation: property.operation,
        type: property.type,
        city: property.city,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        parkingSpaces: property.parkingSpaces,
        price: property.price,
        featuresJson: JSON.stringify(property.features),
        active: property.active,
      },
    });
  }

  for (const appointment of seedAppointments) {
    await prisma.appointment.upsert({
      where: { id: appointment.id },
      create: toPrismaAppointmentData(appointment),
      update: toPrismaAppointmentData(appointment),
    });
  }

  let availabilityRuleCount = 0;

  for (const entry of seedPropertyAvailability) {
    for (const rule of entry.availability) {
      const id = `availability-property-${entry.propertyId}-${rule.day}-${rule.startTime.replace(":", "")}`;
      await prisma.availabilityRule.upsert({
        where: { id },
        create: {
          id,
          resourceType: "property",
          resourceId: entry.propertyId,
          dayOfWeek: rule.day,
          startTime: rule.startTime,
          endTime: rule.endTime,
          intervalMinutes: rule.interval,
          slotCapacity: rule.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
          active: true,
        },
        update: {
          resourceType: "property",
          resourceId: entry.propertyId,
          dayOfWeek: rule.day,
          startTime: rule.startTime,
          endTime: rule.endTime,
          intervalMinutes: rule.interval,
          slotCapacity: rule.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
          active: true,
        },
      });
      availabilityRuleCount += 1;
    }
  }

  for (const rule of seedGlobalPropertyVisitAvailability) {
    const id = `availability-property-${PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID}-${rule.day}-${rule.startTime.replace(":", "")}`;
    await prisma.availabilityRule.upsert({
      where: { id },
      create: {
        id,
        resourceType: "property",
        resourceId: PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID,
        dayOfWeek: rule.day,
        startTime: rule.startTime,
        endTime: rule.endTime,
        intervalMinutes: rule.interval,
        slotCapacity: DEFAULT_SLOT_CAPACITY,
        active: true,
      },
      update: {
        resourceType: "property",
        resourceId: PROPERTY_VISIT_AVAILABILITY_RESOURCE_ID,
        dayOfWeek: rule.day,
        startTime: rule.startTime,
        endTime: rule.endTime,
        intervalMinutes: rule.interval,
        slotCapacity: DEFAULT_SLOT_CAPACITY,
        active: true,
      },
    });
    availabilityRuleCount += 1;
  }

  for (const entry of seedOfficeAvailability) {
    for (const rule of entry.availability) {
      const id = `availability-office-${entry.officeLocationId}-${rule.day}-${rule.startTime.replace(":", "")}`;
      await prisma.availabilityRule.upsert({
        where: { id },
        create: {
          id,
          resourceType: "office",
          resourceId: entry.officeLocationId,
          dayOfWeek: rule.day,
          startTime: rule.startTime,
          endTime: rule.endTime,
          intervalMinutes: rule.interval,
          slotCapacity: rule.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
          active: true,
        },
        update: {
          resourceType: "office",
          resourceId: entry.officeLocationId,
          dayOfWeek: rule.day,
          startTime: rule.startTime,
          endTime: rule.endTime,
          intervalMinutes: rule.interval,
          slotCapacity: rule.slotCapacity ?? DEFAULT_SLOT_CAPACITY,
          active: true,
        },
      });
      availabilityRuleCount += 1;
    }
  }

  await prisma.availabilityRule.upsert({
    where: { id: "availability-property-availability-smoke-cap2-1-0900" },
    create: {
      id: "availability-property-availability-smoke-cap2-1-0900",
      resourceType: "property",
      resourceId: "availability-smoke-cap2",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "11:00",
      intervalMinutes: 60,
      slotCapacity: 2,
      active: true,
    },
    update: {
      slotCapacity: 2,
      intervalMinutes: 60,
      endTime: "11:00",
      active: true,
    },
  });
  availabilityRuleCount += 1;

  await seedBrandMediaAssets(prisma);

  await prisma.aboutTeamSection.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      title: "Las personas detrás de ALTANA",
      description:
        "Profesionales que acompañan cada búsqueda y arrendamiento con cercanía, criterio y compromiso.",
      pendingMessage:
        "Estamos preparando la presentación de nuestro equipo. Muy pronto podrás conocer a las personas que hacen posible Altana Promotora.",
      updatedAt: new Date(),
    },
    update: {
      title: "Las personas detrás de ALTANA",
      description:
        "Profesionales que acompañan cada búsqueda y arrendamiento con cercanía, criterio y compromiso.",
      pendingMessage:
        "Estamos preparando la presentación de nuestro equipo. Muy pronto podrás conocer a las personas que hacen posible Altana Promotora.",
      updatedAt: new Date(),
    },
  });

  console.log(
    `Seeded identity (${users.length} users, ${roles.length} roles, ${workerInvitations.length} worker invitations) + ${clients.length} clients + ${contactRequests.length} contact requests + ${initialProjects.length} projects + ${initialProperties.length} properties + ${seedAppointments.length} appointments + ${availabilityRuleCount} availability rules.`,
  );
  if (initialAdminUserId) {
    console.log(
      `Initial administrator bootstrap completed (user id=${initialAdminUserId}).`,
    );
  } else {
    const principalId = getPrincipalAdminUserId();
    console.log(
      `Principal admin credential seeded for user id=${principalId} (password from ADMIN_SEED_PASSWORD / dev fallback).`,
    );
  }
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Worker dev codes (non-production): WORKER1A2B (valid), EXPIRED1A2, REVOKED1A2, USED0001A2 — override via WORKER_DEV_CODE_* env vars.",
    );
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
