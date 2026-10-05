import type { ContactPageData } from "./contact.types";

const contactLead =
  "Escríbenos para recibir información sobre ALTANA PROMOTORA. No es necesario crear una cuenta.";

export const contactPageData: ContactPageData = {
  hero: {
    eyebrow: "Contacto",
    titleLines: ["Hablemos", "de tu próximo", "proyecto."],
    description: contactLead,
  },
  bridge: {
    eyebrow: "Contacto",
    text: contactLead,
  },
  talk: {
    title: "Hablemos",
    lead: contactLead,
  },
  directContact: {
    title: "Contacto directo",
  },
};
