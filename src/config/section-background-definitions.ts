export type SectionBackgroundDefinition = {
  id: string;
  pageKey: string;
  sectionKey: string;
  label: string;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsSolid: boolean;
};

export const sectionBackgroundDefinitions: SectionBackgroundDefinition[] = [
  {
    id: "home.hero",
    pageKey: "home",
    sectionKey: "hero",
    label: "Home — Hero",
    supportsImage: true,
    supportsVideo: true,
    supportsSolid: true,
  },
  {
    id: "home.faq",
    pageKey: "home",
    sectionKey: "faq",
    label: "Home — FAQ",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "about.hero",
    pageKey: "about",
    sectionKey: "hero",
    label: "About — Hero",
    supportsImage: true,
    supportsVideo: true,
    supportsSolid: true,
  },
  {
    id: "about.historia",
    pageKey: "about",
    sectionKey: "historia",
    label: "About — Nuestra Historia",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "about.confianza",
    pageKey: "about",
    sectionKey: "confianza",
    label: "About — Confianza",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "about.valores",
    pageKey: "about",
    sectionKey: "valores",
    label: "About — Valores",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "about.equipo",
    pageKey: "about",
    sectionKey: "equipo",
    label: "About — Equipo",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "about.finalCta",
    pageKey: "about",
    sectionKey: "finalCta",
    label: "About — CTA final",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "projects.header",
    pageKey: "projects",
    sectionKey: "header",
    label: "Projects — Header editorial",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
  {
    id: "contact.hero",
    pageKey: "contact",
    sectionKey: "hero",
    label: "Contact — Hero",
    supportsImage: true,
    supportsVideo: true,
    supportsSolid: true,
  },
  {
    id: "contact.hablemos",
    pageKey: "contact",
    sectionKey: "hablemos",
    label: "Contact — Hablemos",
    supportsImage: true,
    supportsVideo: false,
    supportsSolid: true,
  },
];
