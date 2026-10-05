export type PropertyOperation = "sale" | "rent";

export type PropertyType = "house" | "apartment";

export type CatalogImage = {
  src: string;
  alt: string;
};

/** Editorial block describing the real-estate development — not a public page layout. */
export type ProjectSection = {
  title: string;
  subtitle?: string;
  image: CatalogImage;
  description: string;
};

export type Project = {
  id: string;
  title: string;
  image: CatalogImage;
  sections: ProjectSection[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Property = {
  id: string;
  projectId?: string;
  title: string;
  images: CatalogImage[];
  operation: PropertyOperation;
  type: PropertyType;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parkingSpaces: number;
  price: number;
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const PROPERTY_OPERATIONS: readonly PropertyOperation[] = [
  "sale",
  "rent",
];

export const PROPERTY_TYPES: readonly PropertyType[] = ["house", "apartment"];
