import { notFound } from "next/navigation";

import { officeLocations } from "@/config/office-locations.data";
import { getPublicProject } from "@/backend/services/project-service";
import { getPublicProperty } from "@/backend/services/property-service";
import type { PropertyOperation, PropertyType } from "@/domain";
import { PublicPage } from "@/features/public";
import { PropertyDetail } from "@/features/public/projects/components/PropertyDetail";

const operationLabels: Record<PropertyOperation, string> = {
  sale: "Venta",
  rent: "Arriendo",
};

const typeLabels: Record<PropertyType, string> = {
  house: "Casa",
  apartment: "Apartamento",
};

export const dynamic = "force-dynamic";

type PropertyDetailRouteProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function PropertyDetailRoute({
  params,
}: PropertyDetailRouteProps) {
  const { propertyId } = await params;
  const property = await getPublicProperty(propertyId);

  if (!property) {
    notFound();
  }

  const relatedProject = property.projectId
    ? await getPublicProject(property.projectId)
    : null;

  return (
    <PublicPage
      eyebrow={`${operationLabels[property.operation]} · ${typeLabels[property.type]}`}
      title={property.title}
      description={property.city}
    >
      <PropertyDetail
        title={property.title}
        images={property.images}
        operation={property.operation}
        type={property.type}
        city={property.city}
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        area={property.area}
        parkingSpaces={property.parkingSpaces}
        price={property.price}
        features={property.features}
        project={
          relatedProject
            ? {
                id: relatedProject.id,
                title: relatedProject.title,
              }
            : undefined
        }
        booking={{
          propertyId: property.id,
          propertyTitle: property.title,
          propertyCity: property.city,
          offices: officeLocations,
        }}
      />
    </PublicPage>
  );
}
