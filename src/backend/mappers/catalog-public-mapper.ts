import type { Project, Property } from "@/domain";

export function toPublicProjectView(project: Project) {
  return {
    id: project.id,
    title: project.title,
    image: project.image,
  };
}

export function toPublicPropertyView(property: Property) {
  return {
    id: property.id,
    projectId: property.projectId,
    title: property.title,
    images: property.images,
    operation: property.operation,
    type: property.type,
    city: property.city,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    parkingSpaces: property.parkingSpaces,
    price: property.price,
    features: property.features,
  };
}
