import type {
  CatalogImage,
  ProjectSection,
  PropertyOperation,
  PropertyType,
} from "./catalog";
import { PROPERTY_OPERATIONS, PROPERTY_TYPES } from "./catalog";

export type CatalogValidationError =
  | "invalid_title"
  | "invalid_description"
  | "invalid_image"
  | "invalid_sections"
  | "invalid_operation"
  | "invalid_type"
  | "invalid_city"
  | "invalid_price"
  | "invalid_area"
  | "invalid_bedrooms"
  | "invalid_bathrooms"
  | "invalid_parking"
  | "invalid_features"
  | "invalid_images"
  | "invalid_project_id"
  | "invalid_active"
  | "forbidden_field";

const LOCAL_IMAGE_SRC = /^\/images\/(?!.*\.\.)[^\\]+$/;
const UPLOAD_IMAGE_SRC = /^\/uploads\/media\/[a-zA-Z0-9._-]+$/;
const MAX_TITLE = 160;
const MAX_TEXT = 4000;
const MAX_FEATURES = 40;
const MAX_IMAGES = 20;
const MAX_SECTIONS = 12;

export function normalizeCatalogTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function catalogImageAltFallback(src: string) {
  const segment = src.split("/").pop() ?? "Imagen";
  const withoutExt = segment.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt.replace(/[-_]+/g, " ").trim();
  return cleaned || "Imagen del inmueble";
}

export function normalizeCatalogImages(images: CatalogImage[]): CatalogImage[] {
  return images.map((image) => ({
    src: image.src.trim(),
    alt:
      image.alt.trim().length > 0
        ? normalizeCatalogTitle(image.alt)
        : catalogImageAltFallback(image.src),
  }));
}

export function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= 0
  );
}

export function isValidCatalogImageSrc(src: string) {
  if (src.includes("..") || src.includes("\\") || src.includes("://")) {
    return false;
  }

  if (src.startsWith("/images/")) {
    return LOCAL_IMAGE_SRC.test(src);
  }

  if (src.startsWith("/uploads/media/")) {
    return UPLOAD_IMAGE_SRC.test(src);
  }

  return false;
}

export function isValidCatalogImage(image: unknown): image is CatalogImage {
  if (!image || typeof image !== "object") {
    return false;
  }

  const value = image as { src?: unknown; alt?: unknown };
  return (
    typeof value.src === "string" &&
    isValidCatalogImageSrc(value.src) &&
    typeof value.alt === "string" &&
    value.alt.trim().length > 0 &&
    value.alt.trim().length <= MAX_TITLE
  );
}

export function isValidPropertyOperation(
  value: unknown,
): value is PropertyOperation {
  return (
    typeof value === "string" &&
    PROPERTY_OPERATIONS.includes(value as PropertyOperation)
  );
}

export function isValidPropertyType(value: unknown): value is PropertyType {
  return typeof value === "string" && PROPERTY_TYPES.includes(value as PropertyType);
}

export function validateProjectDraft(input: {
  title?: unknown;
  image?: unknown;
  sections?: unknown;
  active?: unknown;
}): CatalogValidationError | null {
  if (typeof input.title !== "string" || !normalizeCatalogTitle(input.title)) {
    return "invalid_title";
  }

  if (normalizeCatalogTitle(input.title).length > MAX_TITLE) {
    return "invalid_title";
  }

  if (!isValidCatalogImage(input.image)) {
    return "invalid_image";
  }

  if (!Array.isArray(input.sections) || input.sections.length > MAX_SECTIONS) {
    return "invalid_sections";
  }

  for (const section of input.sections) {
    if (!section || typeof section !== "object") {
      return "invalid_sections";
    }

    const item = section as ProjectSection;
    if (
      typeof item.title !== "string" ||
      !normalizeCatalogTitle(item.title) ||
      normalizeCatalogTitle(item.title).length > MAX_TITLE
    ) {
      return "invalid_sections";
    }

    if (item.subtitle !== undefined) {
      if (
        typeof item.subtitle !== "string" ||
        item.subtitle.trim().length > MAX_TITLE
      ) {
        return "invalid_sections";
      }
    }

    if (
      typeof item.description !== "string" ||
      !item.description.trim() ||
      item.description.trim().length > MAX_TEXT
    ) {
      return "invalid_description";
    }

    if (!isValidCatalogImage(item.image)) {
      return "invalid_image";
    }
  }

  if (typeof input.active !== "boolean") {
    return "invalid_active";
  }

  return null;
}

export function validatePropertyDraft(input: {
  title?: unknown;
  projectId?: unknown;
  operation?: unknown;
  type?: unknown;
  city?: unknown;
  bedrooms?: unknown;
  bathrooms?: unknown;
  area?: unknown;
  parkingSpaces?: unknown;
  price?: unknown;
  features?: unknown;
  images?: unknown;
  active?: unknown;
}): CatalogValidationError | null {
  if (typeof input.title !== "string" || !normalizeCatalogTitle(input.title)) {
    return "invalid_title";
  }

  if (normalizeCatalogTitle(input.title).length > MAX_TITLE) {
    return "invalid_title";
  }

  if (
    input.projectId !== undefined &&
    input.projectId !== null &&
    input.projectId !== ""
  ) {
    if (typeof input.projectId !== "string" || !input.projectId.trim()) {
      return "invalid_project_id";
    }
  }

  if (!isValidPropertyOperation(input.operation)) {
    return "invalid_operation";
  }

  if (!isValidPropertyType(input.type)) {
    return "invalid_type";
  }

  if (typeof input.city !== "string" || !normalizeCatalogTitle(input.city)) {
    return "invalid_city";
  }

  if (normalizeCatalogTitle(input.city).length > MAX_TITLE) {
    return "invalid_city";
  }

  if (!isFiniteNonNegativeInteger(input.bedrooms)) {
    return "invalid_bedrooms";
  }

  if (!isFiniteNonNegativeInteger(input.bathrooms)) {
    return "invalid_bathrooms";
  }

  if (!isFiniteNonNegativeInteger(input.area) || input.area <= 0) {
    return "invalid_area";
  }

  if (!isFiniteNonNegativeInteger(input.parkingSpaces)) {
    return "invalid_parking";
  }

  if (!isFiniteNonNegativeInteger(input.price)) {
    return "invalid_price";
  }

  if (!Array.isArray(input.features) || input.features.length > MAX_FEATURES) {
    return "invalid_features";
  }

  for (const feature of input.features) {
    if (typeof feature !== "string" || !feature.trim() || feature.trim().length > MAX_TITLE) {
      return "invalid_features";
    }
  }

  if (!Array.isArray(input.images) || input.images.length > MAX_IMAGES) {
    return "invalid_images";
  }

  for (const image of input.images) {
    if (!isValidCatalogImage(image)) {
      return "invalid_images";
    }
  }

  if (typeof input.active !== "boolean") {
    return "invalid_active";
  }

  return null;
}

export function normalizeProjectSections(sections: ProjectSection[]) {
  return sections.map((section) => ({
    title: normalizeCatalogTitle(section.title),
    subtitle: section.subtitle?.trim()
      ? normalizeCatalogTitle(section.subtitle)
      : undefined,
    image: {
      src: section.image.src,
      alt: section.image.alt.trim(),
    },
    description: section.description.trim(),
  }));
}

export function normalizePropertyFeatures(features: string[]) {
  return features.map((feature) => normalizeCatalogTitle(feature));
}
