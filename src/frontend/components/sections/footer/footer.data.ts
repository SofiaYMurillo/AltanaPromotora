import { publicPaths } from "@/frontend/config/site";

import type { FooterData } from "./footer.types";

export const footerData: FooterData = {
  brandDescription:
    "En Altana Promotora ofrecemos soluciones inmobiliarias pensadas para las necesidades de nuestros clientes, brindando espacios de calidad, confianza y acompañamiento en cada etapa del proceso.",
  quickLinksTitle: "Enlaces Rápidos",
  contactTitle: "Contáctanos",
  projectCta: {
    title: "Hablemos de tu próximo proyecto",
    description:
      "Agenda una sesión de consultoría personalizada con nosotros.",
    href: publicPaths.contact,
    linkLabel: "Contáctanos",
  },
  copyright: "© 2026 Altana Inmobiliaria. Todos los derechos reservados.",
  legalLabels: ["Aviso Legal", "Política de Privacidad"],
};
