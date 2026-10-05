import Link from "next/link";

import { Logo } from "@/frontend/components/layout/Logo";
import { SocialMediaLinks } from "@/frontend/components/social/SocialMediaLinks";
import type { NavItem } from "@/types/navigation";
import type { SiteSettings } from "@/types/site-settings";

import type { FooterData } from "./footer.types";

interface FooterProps {
  settings: SiteSettings;
  data: FooterData;
  navigation: NavItem[];
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-2.5 w-2.5 shrink-0 text-accent"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 3.5 10.5 8 6 12.5V3.5Z" />
    </svg>
  );
}

function FooterContactIcon({ kind }: { kind: "phone" | "email" | "location" }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-3.5 w-3.5 shrink-0 text-accent",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };

  if (kind === "phone") {
    return (
      <svg {...props}>
        <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L17.5 13l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6.5a2 2 0 0 1 2-2.5Z" />
      </svg>
    );
  }

  if (kind === "email") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function Footer({ settings, data, navigation }: FooterProps) {
  const emails = settings.emails.map((item) => item.address).filter(Boolean);
  const phones = settings.phones.map((item) => item.number).filter(Boolean);
  const instagram = settings.socialLinks.find(
    (link) => link.platform.toLowerCase() === "instagram",
  );

  return (
    <footer
      className="bg-primary text-background"
      aria-label={`${settings.companyName} — Pie de página`}
    >
      <div className="container px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-12">
          <div className="flex flex-col gap-6 sm:col-span-2 lg:col-span-1">
            <Logo settings={settings} tone="inverse" />
            <p className="max-w-sm text-[0.9rem] leading-[1.65] text-footer-muted">
              {data.brandDescription}
            </p>
            <SocialMediaLinks instagramUrl={instagram?.url} />
          </div>

          <nav aria-labelledby="footer-quick-links-heading">
            <h2
              id="footer-quick-links-heading"
              className="font-display text-[1.25rem] font-semibold text-background"
            >
              {data.quickLinksTitle}
            </h2>
            <ul className="footer-link-list mt-6 flex flex-col gap-3.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link">
                    <ChevronIcon />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-[1.25rem] font-semibold text-background">
              {data.contactTitle}
            </h2>
            <ul className="mt-6 flex flex-col gap-4 text-[0.9rem] text-footer-muted">
              {phones.map((phone) => (
                <li key={phone}>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="footer-contact-link"
                  >
                    <FooterContactIcon kind="phone" />
                    <span>{phone}</span>
                  </a>
                </li>
              ))}
              {emails.map((email) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className="footer-contact-link">
                    <FooterContactIcon kind="email" />
                    <span>{email}</span>
                  </a>
                </li>
              ))}
              {settings.address ? (
                <li>
                  <span className="footer-contact-link">
                    <FooterContactIcon kind="location" />
                    <span>{settings.address}</span>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-col gap-5 border-t border-secondary/30 pt-8 sm:border-t-0 sm:pt-0 lg:border-l lg:border-secondary/30 lg:pl-10">
            <h2 className="font-display text-[1.25rem] font-semibold leading-snug text-background">
              {data.projectCta.title}
            </h2>
            <p className="text-[0.9rem] leading-[1.65] text-footer-muted">
              {data.projectCta.description}
            </p>
            <Link
              href={data.projectCta.href}
              className="link-editorial link-editorial-inverse w-fit"
            >
              {data.projectCta.linkLabel} →
            </Link>
          </div>
        </div>

        <div className="footer-legal-bar mt-14 border-t border-secondary/45 pt-8 md:mt-16">
          <div className="flex flex-col gap-4 text-[0.8rem] leading-relaxed text-footer-muted/80 md:flex-row md:items-center md:justify-between">
            <p>{data.copyright}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {data.legalLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
