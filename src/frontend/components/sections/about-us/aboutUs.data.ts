import { altanaMediaAssets } from "@/frontend/config/media-assets.data";
import { publicPaths } from "@/frontend/config/site";

import type { AboutUsData } from "./aboutUs.types";

export const aboutUsData: AboutUsData = {
  eyebrow: "Sobre nosotros",
  title: "Encontramos espacios que se adaptan a tu estilo de vida.",
  description:
    "En Altana Promotora trabajamos para facilitar el acceso a espacios que respondan a las necesidades de nuestros clientes. Ofrecemos acompañamiento durante el proceso de búsqueda y arrendamiento, brindando una atención cercana y confiable.",
  cta: {
    label: "Conocer más",
    href: publicPaths.about,
  },
  image: altanaMediaAssets.casaExterior1,
  attributes: [
    {
      id: "support",
      title: "Acompañamiento personalizado",
      icon: "design",
    },
    {
      id: "quality",
      title: "Calidad Garantizada",
      icon: "quality",
    },
    {
      id: "location",
      title: "Ubicaciones Estratégicas",
      icon: "location",
    },
  ],
};
