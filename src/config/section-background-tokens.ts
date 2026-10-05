export const SECTION_BACKGROUND_TOKENS = [
  "primary",
  "surface",
  "background",
  "accent",
  "secondary",
  "carbon",
  "hueso",
] as const;

export type SectionBackgroundToken =
  (typeof SECTION_BACKGROUND_TOKENS)[number];
