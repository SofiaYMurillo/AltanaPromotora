"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { HeaderCtaLink } from "@/frontend/components/layout/HeaderCtaLink";
import { Logo } from "@/frontend/components/layout/Logo";
import { MobileMenu } from "@/frontend/components/layout/MobileMenu";
import { Navigation } from "@/frontend/components/layout/Navigation";
import {
  headerCta,
  overlayHeaderPaths,
  resolveHeaderCtaForPath,
} from "@/frontend/config/site";
import type { NavItem } from "@/types/navigation";
import type { SiteSettings } from "@/types/site-settings";

interface HeaderProps {
  settings: SiteSettings;
  navigation: NavItem[];
}

function subscribeToScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => {
    window.removeEventListener("scroll", onStoreChange);
  };
}

function getScrollSnapshot() {
  return window.scrollY > 0;
}

function getScrollServerSnapshot() {
  return false;
}

export function Header({ settings, navigation }: HeaderProps) {
  const pathname = usePathname();
  const resolvedCta = useMemo(
    () => resolveHeaderCtaForPath(pathname, headerCta),
    [pathname],
  );
  const overlay = overlayHeaderPaths.includes(pathname);
  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrollSnapshot,
    getScrollServerSnapshot,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen((previous) => !previous);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCloseMenu, isMenuOpen]);

  const inverse = overlay && !isMenuOpen;
  const tone = inverse ? "inverse" : "default";

  const positionClass = overlay ? "fixed" : "sticky";
  const surfaceClass = overlay
    ? isMenuOpen
      ? "border-b border-border bg-surface py-[var(--layout-header-padding-y-compact)]"
      : isScrolled
        ? "bg-primary/95 py-[var(--layout-header-padding-y-compact)] backdrop-blur-[2px]"
        : "bg-transparent py-[var(--layout-header-padding-y)]"
    : isScrolled
      ? "border-b border-border bg-surface py-[var(--layout-header-padding-y-compact)] shadow-sm"
      : "bg-background py-[var(--layout-header-padding-y)]";
  const colorClass = inverse ? "text-background" : "text-foreground";

  return (
    <header
      className={`${positionClass} top-0 z-50 w-full transition-all duration-300 ${surfaceClass} ${colorClass}`}
    >
      <div className="container relative flex min-h-[var(--layout-header-logo-height)] items-center justify-between gap-4 sm:gap-6">
        <Logo settings={settings} tone={tone} placement="header" />

        <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
          <Navigation
            items={navigation}
            variant="desktop"
            tone={tone}
            currentPath={pathname}
          />
        </div>

        <div className="flex items-center gap-6">
          <HeaderCtaLink {...resolvedCta} className="hidden lg:inline-flex" />
          <MobileMenu
            items={navigation}
            cta={resolvedCta}
            currentPath={pathname}
            isOpen={isMenuOpen}
            onToggle={handleToggleMenu}
            onClose={handleCloseMenu}
          />
        </div>
      </div>
    </header>
  );
}
