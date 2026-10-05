"use client";

import { useEffect, useId } from "react";

import { HeaderCtaLink } from "@/frontend/components/layout/HeaderCtaLink";
import { Navigation } from "@/frontend/components/layout/Navigation";
import type { HeaderCta, NavItem } from "@/types/navigation";

type MobileMenuProps = {
  items: NavItem[];
  cta: HeaderCta;
  currentPath: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

const menuButtonStyles =
  "relative flex h-10 w-10 items-center justify-center rounded-md text-current transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function MobileMenu({
  items,
  cta,
  currentPath,
  isOpen,
  onToggle,
  onClose,
}: MobileMenuProps) {
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className={menuButtonStyles}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={onToggle}
      >
        <span className="sr-only">
          {isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        </span>
        <span
          aria-hidden="true"
          className="flex w-6 flex-col items-end justify-center gap-1.5"
        >
          <span
            className={`block h-0.5 w-6 origin-center bg-current transition-all duration-300 ${
              isOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
              isOpen ? "scale-x-0 opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-4 bg-current transition-all duration-300 ${
              isOpen ? "-translate-y-2.5 w-6 -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      <div
        id={menuId}
        className={`fixed inset-x-0 top-0 bottom-0 z-40 max-w-[100vw] bg-primary text-background transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "hidden opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="container flex h-full flex-col pb-8 pt-28">
          <Navigation
            items={items}
            variant="mobile"
            tone="inverse"
            currentPath={currentPath}
            onNavigate={onClose}
          />
          <div className="mt-10">
            <HeaderCtaLink {...cta} onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
