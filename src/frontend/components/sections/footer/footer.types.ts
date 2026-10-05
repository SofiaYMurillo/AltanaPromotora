export interface FooterProjectCta {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

export interface FooterData {
  brandDescription: string;
  quickLinksTitle: string;
  contactTitle: string;
  projectCta: FooterProjectCta;
  copyright: string;
  legalLabels: string[];
}
