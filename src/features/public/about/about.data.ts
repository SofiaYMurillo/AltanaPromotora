import { altanaMediaAssets } from "@/frontend/config/media-assets.data";
import { publicPaths } from "@/frontend/config/site";

import type { AboutPageData } from "./about.types";

export const aboutData: Omit<AboutPageData, "equipo"> = {
  hero: {
    title: "Sobre Nosotros",
    subtitle:
      "En ALTANA PROMOTORA convertimos espacios en oportunidades: proyectos inmobiliarios pensados para las personas, con calidad, transparencia y una visión de largo plazo en la región.",
    architecturalImage: {
      src: "/images/about/about-house-hero.png",
      alt: "Representación arquitectónica 3D de un proyecto residencial contemporáneo de ALTANA PROMOTORA",
      width: 679,
      height: 1024,
    },
  },
  historia: {
    eyebrow: "Nuestra Historia",
    title: "Nacimos de una visión, crecemos con cada oportunidad.",
    paragraphs: [
      "Altana nace de la visión de crear nuevas oportunidades en el sector inmobiliario, convirtiendo espacios en posibilidades para quienes buscan un lugar donde comenzar una nueva etapa. Creemos que cada propiedad representa más que un espacio: es el punto de partida para nuevos proyectos, experiencias y sueños.",
      "Hoy seguimos construyendo nuestra historia con la mirada puesta en el futuro, creciendo junto a nuestros clientes y fortaleciendo nuestra presencia en el sector inmobiliario de la región.",
    ],
    cta: {
      label: "Ver portafolio",
      href: publicPaths.projects,
    },
    image: altanaMediaAssets.casaExterior1,
  },
  confianza: {
    title: "Proyectamos confianza. Construimos futuro",
    quote:
      "Consolidarnos como una empresa reconocida por la calidad de nuestros proyectos y por la confianza que generamos en nuestros clientes, contribuyendo al crecimiento del sector inmobiliario en la región.",
  },
  valores: {
    eyebrow: "Nuestros valores",
    title: "Los pilares de nuestra identidad",
    items: [
      {
        id: "transparency",
        title: "Transparencia",
        description:
          "Actuamos con claridad y honestidad en cada proceso, construyendo relaciones basadas en la confianza y el respeto.",
        icon: "transparency",
      },
      {
        id: "commitment",
        title: "Compromiso",
        description:
          "Cumplimos los compromisos adquiridos y asumimos cada proceso con dedicación, responsabilidad y disposición hacia nuestros clientes.",
        icon: "commitment",
      },
      {
        id: "responsibility",
        title: "Responsabilidad",
        description:
          "Trabajamos de manera responsable, teniendo en cuenta las necesidades de nuestros clientes y el compromiso que asumimos en cada proceso.",
        icon: "responsibility",
      },
    ],
  },
  finalCta: {
    title: "¿Listo para encontrar tu próximo hogar?",
    description:
      "Descubre nuestros proyectos exclusivos o contáctanos para más información.",
    cta: {
      label: "Contáctanos",
      href: publicPaths.contact,
    },
  },
};
