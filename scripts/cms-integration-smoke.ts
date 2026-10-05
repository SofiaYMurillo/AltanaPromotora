import "dotenv/config";

import { buildWhatsAppHref } from "../src/frontend/utils/whatsapp";
import { primaryPhoneFromSettings } from "../src/backend/services/site-settings-service";
import { resolvePublicSiteSettings } from "../src/backend/services/site-settings-service";
import { getPublicProperty, updateProperty } from "../src/backend/services/property-service";
import { createPublicAppointment } from "../src/backend/services/appointment-service";
import { countUnreadNotifications } from "../src/backend/services/notification-service";
import {
  getAdminSeedPassword,
  getPrincipalAdminEmail,
  getPrincipalAdminUserId,
} from "../src/backend/config/auth-config";
import { authenticateAdmin } from "../src/backend/services/auth-service";
import { permissionDecision, listEffectivePermissionNames } from "../src/backend/services/authorize-service";
import { resolveAuthFromToken } from "../src/backend/services/session-service";
import { isValidCatalogImageSrc } from "../src/domain";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const settings = await resolvePublicSiteSettings();
  const phone = primaryPhoneFromSettings(settings);
  assert(phone, "settings phone");
  const wa = buildWhatsAppHref(phone!);
  assert(wa === "https://wa.me/573003252704", `whatsapp href ${wa}`);

  assert(
    isValidCatalogImageSrc("/uploads/media/media-test.jpg"),
    "upload src valid",
  );
  assert(
    isValidCatalogImageSrc("/images/CasaExterior1.jpg"),
    "local image src valid",
  );

  const adminEmail = getPrincipalAdminEmail();
  const adminPassword = getAdminSeedPassword();
  const login = await authenticateAdmin({ email: adminEmail, password: adminPassword });
  if (!login.ok) {
    throw new Error("admin login failed");
  }
  const adminCtx = await resolveAuthFromToken(login.token);
  const adminPerms = await listEffectivePermissionNames(adminCtx.user!.id);
  assert(
    permissionDecision(adminCtx, adminPerms, "appointments.read").ok,
    "admin appointments.read",
  );

  const workerLogin = await authenticateAdmin({
    email: "worker@altana.test",
    password: "x",
  });
  if (!workerLogin.ok) {
    console.log("worker login skipped (code auth only)");
  }

  const property = await getPublicProperty("property-001");
  if (property) {
    const mediaUrl = "/uploads/media/media-e8b3cc4c-51e6-46f8-9c1a-c1ade923c737.jpg";
    const updated = await updateProperty(property.id, {
      title: property.title,
      projectId: property.projectId,
      operation: property.operation,
      type: property.type,
      city: property.city,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      parkingSpaces: property.parkingSpaces,
      price: property.price,
      features: property.features,
      active: property.active,
      images: [
        { src: mediaUrl, alt: "Fachada" },
        { src: "/images/CasaExterior1.jpg", alt: "Exterior" },
        { src: "/images/Escalera1.jpg", alt: "Escalera" },
      ],
    });
    assert(updated.ok, `property images update ${!updated.ok ? updated.error : ""}`);
    const pub = await getPublicProperty(property.id);
    if (!pub) {
      throw new Error("public property missing");
    }
    assert(pub.images.length === 3, "public property images count");
    assert(pub.images[0]?.src === mediaUrl, "public media src");
  }

  const beforeUnread = await countUnreadNotifications(getPrincipalAdminUserId());

  const stamp = Date.now();
  const book = await createPublicAppointment({
    type: "property",
    propertyId: "property-001",
    date: "2026-12-15",
    time: "10:00",
    communicationPreference: "email",
    contact: {
      email: `smoke-${stamp}@example.com`,
      phone: "+573001112233",
    },
  });
  assert(book.ok, `appointment created ${!book.ok ? book.error : ""}`);

  const afterUnread = await countUnreadNotifications(getPrincipalAdminUserId());
  assert(afterUnread > beforeUnread, "admin notification for appointment");

  console.log("cms-integration-smoke OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
