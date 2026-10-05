/**
 * Initial ALTANA catalog snapshot used only by prisma/seed.
 * Runtime catalog reads Prisma. Do not import this from public UI.
 */

const placeholder = "/images/CasaExterior1.jpg";

export const initialProjects = [
  {
    id: "project-001",
    title: "Proyectos ALTANA PROMOTORA",
    image: {
      src: placeholder,
      alt: "ALTANA PROMOTORA",
    },
    sections: [
      {
        title: "Nuestros proyectos",
        subtitle:
          "Conoce los desarrollos inmobiliarios que hacen parte de ALTANA PROMOTORA.",
        image: {
          src: placeholder,
          alt: "ALTANA PROMOTORA",
        },
        description:
          "Este espacio estará destinado a presentar los proyectos inmobiliarios desarrollados por ALTANA PROMOTORA, mostrando la información general de cada uno y sus principales características.",
      },
    ],
    active: true,
  },
  {
    id: "project-002",
    title: "Próximos desarrollos",
    image: {
      src: placeholder,
      alt: "ALTANA PROMOTORA",
    },
    sections: [
      {
        title: "Plan de expansión",
        subtitle:
          "Explora los próximos proyectos que impulsarán el crecimiento de la región.",
        image: {
          src: placeholder,
          alt: "ALTANA PROMOTORA",
        },
        description:
          "En esta sección se presentarán los futuros desarrollos inmobiliarios planificados por ALTANA PROMOTORA.",
      },
    ],
    active: true,
  },
] as const;

export const initialProperties = [
  {
    id: "property-001",
    projectId: "project-001",
    title: "Casa familiar en Pereira",
    images: [
      {
        src: placeholder,
        alt: "Fachada de la casa familiar en Pereira",
      },
      {
        src: placeholder,
        alt: "Sala de la casa familiar en Pereira",
      },
      {
        src: placeholder,
        alt: "Cocina de la casa familiar en Pereira",
      },
    ],
    operation: "sale",
    type: "house",
    city: "Pereira",
    bedrooms: 2,
    bathrooms: 2,
    area: 86,
    parkingSpaces: 1,
    price: 320000000,
    features: ["Patio", "Cocina integral", "Zona de ropas"],
    active: true,
  },
  {
    id: "property-002",
    projectId: "project-001",
    title: "Apartamento moderno en Pereira",
    images: [
      {
        src: placeholder,
        alt: "Vista principal del apartamento moderno en Pereira",
      },
      {
        src: placeholder,
        alt: "Balcón del apartamento moderno en Pereira",
      },
    ],
    operation: "sale",
    type: "apartment",
    city: "Pereira",
    bedrooms: 2,
    bathrooms: 1,
    area: 58,
    parkingSpaces: 1,
    price: 245000000,
    features: ["Balcón", "Cocina integral"],
    active: true,
  },
  {
    id: "property-003",
    projectId: "project-001",
    title: "Casa amplia en Pereira",
    images: [
      {
        src: placeholder,
        alt: "Fachada de la casa amplia en Pereira",
      },
      {
        src: placeholder,
        alt: "Jardín de la casa amplia en Pereira",
      },
      {
        src: placeholder,
        alt: "Interior de la casa amplia en Pereira",
      },
    ],
    operation: "rent",
    type: "house",
    city: "Pereira",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    parkingSpaces: 2,
    price: 2800000,
    features: ["Garaje cubierto", "Jardín", "Zona de ropas"],
    active: true,
  },
  {
    id: "property-004",
    projectId: "project-002",
    title: "Apartamento en Medellín",
    images: [
      {
        src: placeholder,
        alt: "Vista principal del apartamento en Medellín",
      },
      {
        src: placeholder,
        alt: "Sala del apartamento en Medellín",
      },
    ],
    operation: "sale",
    type: "apartment",
    city: "Medellín",
    bedrooms: 2,
    bathrooms: 2,
    area: 72,
    parkingSpaces: 1,
    price: 410000000,
    features: ["Balcón", "Closets empotrados", "Cocina integral"],
    active: true,
  },
  {
    id: "property-005",
    projectId: "project-002",
    title: "Casa en Medellín",
    images: [
      {
        src: placeholder,
        alt: "Fachada de la casa en Medellín",
      },
      {
        src: placeholder,
        alt: "Terraza de la casa en Medellín",
      },
    ],
    operation: "rent",
    type: "house",
    city: "Medellín",
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    parkingSpaces: 1,
    price: 3500000,
    features: ["Terraza", "Zona de ropas"],
    active: true,
  },
  {
    id: "property-006",
    title: "Apartamento en arriendo en Pereira",
    images: [
      {
        src: placeholder,
        alt: "Vista del apartamento en arriendo en Pereira",
      },
    ],
    operation: "rent",
    type: "apartment",
    city: "Pereira",
    bedrooms: 1,
    bathrooms: 1,
    area: 42,
    parkingSpaces: 0,
    price: 1200000,
    features: [],
    active: true,
  },
  {
    id: "property-007",
    projectId: "project-001",
    title: "Casa de 3 habitaciones en Pereira",
    images: [
      {
        src: placeholder,
        alt: "Fachada de la casa de 3 habitaciones en Pereira",
      },
      {
        src: placeholder,
        alt: "Estudio de la casa de 3 habitaciones en Pereira",
      },
      {
        src: placeholder,
        alt: "Patio de la casa de 3 habitaciones en Pereira",
      },
    ],
    operation: "sale",
    type: "house",
    city: "Pereira",
    bedrooms: 3,
    bathrooms: 3,
    area: 145,
    parkingSpaces: 2,
    price: 480000000,
    features: ["Patio", "Estudio", "Cocina integral", "Zona de ropas"],
    active: true,
  },
  {
    id: "property-008",
    projectId: "project-002",
    title: "Apartamento familiar en Medellín",
    images: [
      {
        src: placeholder,
        alt: "Vista principal del apartamento familiar en Medellín",
      },
      {
        src: placeholder,
        alt: "Balcón del apartamento familiar en Medellín",
      },
    ],
    operation: "rent",
    type: "apartment",
    city: "Medellín",
    bedrooms: 3,
    bathrooms: 2,
    area: 88,
    parkingSpaces: 1,
    price: 2900000,
    features: ["Balcón", "Depósito"],
    active: true,
  },
] as const;
