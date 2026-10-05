import Image from "next/image";
import Link from "next/link";

import type { SiteSettings } from "@/types/site-settings";

const DEFAULT_LOGO_ALT = "ALTANA PROMOTORA";

interface LogoProps {
  settings: SiteSettings;
  tone?: "default" | "inverse";
  /** Inline brand link (header/footer) or circular mark (admin topbar). */
  variant?: "inline" | "circle";
  /** Header uses a larger responsive scale; footer and other inline uses stay compact. */
  placement?: "header" | "inline";
  /** When false, renders branding without linking home (admin mark). */
  linkToHome?: boolean;
}

const inlineLogoImageClassName =
  "h-9 w-auto max-h-11 object-contain md:h-10";

/** Scales with `--layout-header-logo-height` (fluid clamp in design tokens). */
const headerLogoImageClassName =
  "h-[var(--layout-header-logo-height)] w-auto max-h-[var(--layout-header-logo-height)] object-contain";

const inlineLogoShellClassName =
  "inline-flex max-w-[min(100%,16rem)] items-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

const headerLogoShellClassName =
  "inline-flex shrink-0 max-w-[min(42vw,var(--layout-header-logo-max-width))] items-center transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

function logoAlt(settings: SiteSettings) {
  const alt = settings.logo.alt?.trim();
  if (alt) {
    return alt;
  }
  return settings.companyName.trim() || DEFAULT_LOGO_ALT;
}

function resolveLogoSrc(settings: SiteSettings) {
  const url = settings.logo.url.trim();
  if (!url) {
    return url;
  }

  const version = settings.logo.updatedAt.trim();
  if (!version || url.includes("?")) {
    return url;
  }

  return `${url}?v=${encodeURIComponent(version)}`;
}

function shouldServeLogoUnoptimized(logo: SiteSettings["logo"]) {
  const url = logo.url.toLowerCase();
  return logo.mimeType === "image/png" || url.includes(".png");
}

function LogoImage({
  settings,
  className,
  priority,
}: {
  settings: SiteSettings;
  className: string;
  priority?: boolean;
}) {
  const src = resolveLogoSrc(settings);

  return (
    <Image
      src={src}
      alt={logoAlt(settings)}
      width={settings.logo.width > 0 ? settings.logo.width : 160}
      height={settings.logo.height > 0 ? settings.logo.height : 40}
      className={className}
      priority={priority}
      unoptimized={shouldServeLogoUnoptimized(settings.logo)}
    />
  );
}

function LogoFallbackText({
  settings,
  tone,
  className,
}: {
  settings: SiteSettings;
  tone: "default" | "inverse";
  className?: string;
}) {
  const toneClass =
    tone === "inverse" ? "text-background" : "text-foreground";

  return (
    <span
      className={`text-heading-sm tracking-[0.12em] md:text-base ${toneClass} ${className ?? ""}`}
    >
      {settings.companyName}
    </span>
  );
}

export function Logo({
  settings,
  tone = "default",
  variant = "inline",
  placement = "inline",
  linkToHome = true,
}: LogoProps) {
  const toneClass =
    tone === "inverse" ? "text-background" : "text-foreground";
  const hasLogoImage = settings.logo.url.trim().length > 0;

  if (variant === "circle") {
    return (
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-background/25 bg-background/10 p-1.5 shadow-sm sm:h-12 sm:w-12"
        role="img"
        aria-label={logoAlt(settings)}
      >
        {hasLogoImage ? (
          <LogoImage
            settings={settings}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-center text-[0.55rem] font-semibold uppercase leading-tight tracking-[0.08em] text-background">
            {settings.companyName.split(" ")[0] ?? "ALTANA"}
          </span>
        )}
      </div>
    );
  }

  const logoImageClassName =
    placement === "header"
      ? headerLogoImageClassName
      : inlineLogoImageClassName;

  const content = hasLogoImage ? (
    <LogoImage
      settings={settings}
      className={logoImageClassName}
      priority={placement === "header"}
    />
  ) : (
    <LogoFallbackText settings={settings} tone={tone} />
  );

  const shellClassName =
    placement === "header" ? headerLogoShellClassName : inlineLogoShellClassName;
  const className = `${shellClassName} ${toneClass}`;

  if (!linkToHome) {
    return (
      <span className={className} aria-label={logoAlt(settings)}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href="/"
      className={className}
      aria-label={`${settings.companyName} — Inicio`}
    >
      {content}
    </Link>
  );
}
