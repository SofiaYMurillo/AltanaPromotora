import type { AboutAttributeIconName } from "@/frontend/components/icons/EditorialIcons";

export interface AboutUsAttribute {
  id: string;
  title: string;
  icon: AboutAttributeIconName;
}

export interface AboutUsCta {
  label: string;
  href: string;
}

export interface AboutUsData {
  eyebrow: string;
  title: string;
  description: string;
  secondaryDescription?: string;
  cta: AboutUsCta;
  image: {
    src: string;
    alt: string;
  };
  attributes: AboutUsAttribute[];
}
