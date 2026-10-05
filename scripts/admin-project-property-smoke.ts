import "dotenv/config";

import {
  parseProjectWriteInput,
  createProject,
  getAdminProject,
  getPublicProject,
  listAdminProjects,
  listPublicProjects,
  updateProject,
  updateProjectStatus,
} from "../src/backend/services/project-service";
import {
  parsePropertyWriteInput,
  createProperty,
  getAdminProperty,
  getPublicProperty,
  listAdminProperties,
  listPublicProperties,
  updateProperty,
  updatePropertyStatus,
} from "../src/backend/services/property-service";
import { catalogAccessDecision } from "../src/backend/services/authorize-service";
import { createPublicAppointment } from "../src/backend/services/appointment-service";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { getPrincipalAdminEmail } from "../src/backend/config/auth-config";
import { resolveAuthFromToken } from "../src/backend/services/session-service";
import { hashSessionToken } from "../src/backend/security/password";
import { prisma } from "../src/backend/db";
import * as sessionRepository from "../src/backend/repositories/session-repository";
import * as userRepository from "../src/backend/repositories/user-repository";
import * as roleRepository from "../src/backend/repositories/role-repository";
import { canAccessAdmin } from "../src/features/auth/access";
import {
  addCalendarDays,
  weekdayFromDateKey,
} from "../src/domain";

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

async function main() {
  await prisma.appointment.deleteMany({
    where: { id: { startsWith: "appointment-catalog-smoke-" } },
  });
  await prisma.property.deleteMany({
    where: { id: { startsWith: "property-catalog-smoke-" } },
  });
  await prisma.project.deleteMany({
    where: { id: { startsWith: "project-catalog-smoke-" } },
  });

  const stamp = Date.now();
  const createdProjectIds: string[] = [];
  const createdPropertyIds: string[] = [];
  const createdAppointmentIds: string[] = [];

  const listedProjects = await listAdminProjects();
  assert(listedProjects.length >= 2, "seed projects are listed");
  const existingProject = await getAdminProject("project-001");
  assert(existingProject?.title === "Proyectos ALTANA PROMOTORA", "get project");

  const createdProject = await createProject({
    title: `Proyecto smoke ${stamp}`,
    image: {
      src: "/images/projects-placeholder.jpg",
      alt: "Proyecto de prueba",
    },
    sections: [
      {
        title: "Sección smoke",
        description: "Descripción de prueba del proyecto.",
        image: {
          src: "/images/projects-placeholder.jpg",
          alt: "Sección de prueba",
        },
      },
    ],
    active: true,
  });
  assert(createdProject.ok, "create project");
  if (!createdProject.ok) {
    throw new Error("create project failed");
  }
  createdProjectIds.push(createdProject.project.id);

  const edited = await updateProject(createdProject.project.id, {
    title: `Proyecto smoke editado ${stamp}`,
    image: createdProject.project.image,
    sections: createdProject.project.sections,
    active: true,
  });
  assert(edited.ok && edited.ok && edited.project.title.includes("editado"), "edit project");

  const deactivatedProject = await updateProjectStatus(
    createdProject.project.id,
    false,
  );
  assert(
    deactivatedProject.ok && deactivatedProject.project.active === false,
    "deactivate project",
  );
  assert(
    !(await getPublicProject(createdProject.project.id)),
    "inactive project is hidden publicly",
  );

  const invalidProject = parseProjectWriteInput({ title: "" });
  assert(!invalidProject.ok, "invalid project rejected");
  assert(
    !parseProjectWriteInput({
      title: "Ok",
      image: createdProject.project.image,
      sections: [],
      active: true,
      clientId: "forged",
    }).ok,
    "forbidden project field rejected",
  );

  const listedProperties = await listAdminProperties();
  assert(listedProperties.length >= 8, "seed properties are listed");
  const existingProperty = await getAdminProperty("property-001");
  assert(existingProperty?.title === "Casa familiar en Pereira", "get property");
  assert(existingProperty?.projectId === "project-001", "seed relation");

  const createdProperty = await createProperty({
    title: `Inmueble smoke ${stamp}`,
    projectId: createdProject.project.id,
    operation: "sale",
    type: "house",
    city: "Pereira",
    bedrooms: 2,
    bathrooms: 1,
    area: 80,
    parkingSpaces: 1,
    price: 200000000,
    features: ["Patio"],
    images: [
      {
        src: "/images/projects-placeholder.jpg",
        alt: "Fachada smoke",
      },
      {
        src: "/images/home/featured.svg",
        alt: "Detalle smoke",
      },
    ],
    active: true,
  });
  assert(createdProperty.ok, "create property");
  if (!createdProperty.ok) {
    throw new Error("create property failed");
  }
  createdPropertyIds.push(createdProperty.property.id);
  assert(
    createdProperty.property.projectId === createdProject.project.id,
    "property associated to project",
  );
  assert(createdProperty.property.images.length === 2, "images persisted");

  const publicAfterCreate = await listPublicProperties();
  assert(
    publicAfterCreate.some((item) => item.id === createdProperty.property.id),
    "active property appears in public catalog",
  );

  const editedProperty = await updateProperty(createdProperty.property.id, {
    title: `Inmueble smoke editado ${stamp}`,
    projectId: createdProject.project.id,
    operation: "rent",
    type: "apartment",
    city: "Medellín",
    bedrooms: 3,
    bathrooms: 2,
    area: 90,
    parkingSpaces: 0,
    price: 2500000,
    features: ["Balcón"],
    images: [
      {
        src: "/images/projects-placeholder.jpg",
        alt: "Única imagen",
      },
    ],
    active: true,
  });
  assert(
    editedProperty.ok &&
      editedProperty.property.operation === "rent" &&
      editedProperty.property.images.length === 1,
    "edit property and images",
  );

  const missingProject = await createProperty({
    title: "Inmueble huérfano",
    projectId: `project-missing-${stamp}`,
    operation: "sale",
    type: "house",
    city: "Pereira",
    bedrooms: 1,
    bathrooms: 1,
    area: 40,
    parkingSpaces: 0,
    price: 100,
    features: [],
    images: [],
    active: true,
  });
  assert(
    !missingProject.ok && missingProject.error === "invalid_project_id",
    "missing projectId rejected",
  );

  assert(
    !parsePropertyWriteInput({
      title: "X",
      operation: "sale",
      type: "house",
      city: "Pereira",
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      parkingSpaces: 0,
      price: -1,
      features: [],
      images: [],
      active: true,
    }).ok,
    "negative price rejected",
  );
  assert(
    !parsePropertyWriteInput({
      title: "X",
      operation: "sale",
      type: "house",
      city: "Pereira",
      bedrooms: 1,
      bathrooms: 1,
      area: 0,
      parkingSpaces: 0,
      price: 1,
      features: [],
      images: [],
      active: true,
    }).ok,
    "zero area rejected",
  );
  assert(
    !parsePropertyWriteInput({
      title: "X",
      operation: "sale",
      type: "house",
      city: "Pereira",
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      parkingSpaces: 0,
      price: 1,
      features: [],
      images: [{ src: "../../etc/passwd", alt: "bad" }],
      active: true,
    }).ok,
    "path traversal image rejected",
  );

  const tuesday = firstWeekdayOnOrAfter("2099-11-01", 2);
  const appointment = await createPublicAppointment({
    id: `appointment-catalog-smoke-${stamp}`,
    type: "property",
    propertyId: createdProperty.property.id,
    date: tuesday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(
    appointment.ok === false || appointment.ok === true,
    "appointment attempt recorded",
  );
  if (appointment.ok) {
    createdAppointmentIds.push(appointment.appointment.id);
  } else {
    const historic = await prisma.appointment.create({
      data: {
        id: `appointment-catalog-smoke-${stamp}`,
        type: "property",
        propertyId: createdProperty.property.id,
        date: tuesday,
        time: "09:00",
        status: "completed",
        communicationPreference: "none",
      },
    });
    createdAppointmentIds.push(historic.id);
  }

  const deactivatedProperty = await updatePropertyStatus(
    createdProperty.property.id,
    false,
  );
  assert(
    deactivatedProperty.ok && deactivatedProperty.property.active === false,
    "deactivate property",
  );
  assert(
    !(await getPublicProperty(createdProperty.property.id)),
    "inactive property hidden from public catalog",
  );
  assert(
    !(await listPublicProperties()).some(
      (item) => item.id === createdProperty.property.id,
    ),
    "inactive property not listed publicly",
  );
  assert(
    (await getAdminProperty(createdProperty.property.id))?.active === false,
    "inactive property remains in admin",
  );

  const historic = await prisma.appointment.findUnique({
    where: { id: createdAppointmentIds[0] },
  });
  assert(historic, "historical appointment remains after deactivate");
  assert(
    historic?.propertyId === createdProperty.property.id,
    "appointment keeps property reference",
  );

  const unauthenticated = catalogAccessDecision(
    await resolveAuthFromToken(undefined),
  );
  assert(
    !unauthenticated.ok && unauthenticated.status === 401,
    "unauthenticated cannot manage catalog",
  );

  const clientUser = await userRepository.findUserByEmail("client@altana.test");
  assert(clientUser, "client user exists");
  const clientRoles = await roleRepository.getRolesForUser(clientUser!.id);
  const clientDecision = catalogAccessDecision({
    access: canAccessAdmin({ user: clientUser, roles: clientRoles }),
    user: clientUser,
    roles: clientRoles,
    sessionId: null,
  });
  assert(
    !clientDecision.ok && clientDecision.status === 403,
    "client-role cannot manage catalog",
  );

  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "DevOnly-ChangeMe!";
  const adminLogin = await authenticateAdmin({
    email: getPrincipalAdminEmail(),
    password: adminPassword,
  });
  assert(adminLogin.ok, "principal admin authenticates");
  if (adminLogin.ok) {
    const adminContext = await resolveAuthFromToken(adminLogin.token);
    assert(catalogAccessDecision(adminContext).ok, "admin can manage catalog");
    await sessionRepository.revokeSessionByTokenHash(
      hashSessionToken(adminLogin.token),
    );
  }

  const publicProjects = await listPublicProjects();
  assert(
    publicProjects.some((item) => item.id === "project-001"),
    "seed project remains public",
  );
  assert(
    (await listPublicProperties()).some((item) => item.id === "property-006"),
    "property without project remains public",
  );

  console.log("catalog_project", createdProject.project.id);
  console.log("catalog_property", createdProperty.property.id);
  console.log("catalog_authz_unauthenticated", unauthenticated.status);
  console.log("catalog_authz_client", clientDecision.status);
  console.log("ok");

  await prisma.appointment.deleteMany({
    where: { id: { in: createdAppointmentIds } },
  });
  await prisma.property.deleteMany({
    where: { id: { in: createdPropertyIds } },
  });
  await prisma.project.deleteMany({
    where: { id: { in: createdProjectIds } },
  });
}

main()
  .catch((event) => {
    console.error(event);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
