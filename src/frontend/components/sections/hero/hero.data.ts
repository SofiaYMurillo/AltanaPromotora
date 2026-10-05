import { altanaMediaAssets } from "@/frontend/config/media-assets.data";

import { publicPaths } from "@/frontend/config/site";



import type { HeroData } from "./hero.types";



export const heroData: HeroData = {

  headingLines: ["ELEVAMOS TU FORMA DE VIVIR"],

  subheading:

    "Encuentra propiedades para arrendar en ubicaciones estratégicas, con espacios pensados para brindarte comodidad, tranquilidad y calidad de vida.",

  cta: {

    label: "Ver proyectos",

    href: publicPaths.projects,

  },

  secondaryCta: {

    label: "Contáctanos",

    href: publicPaths.contact,

  },

  image: {

    ...altanaMediaAssets.escalera1,

    objectClassName: "object-cover object-center",

  },

};

