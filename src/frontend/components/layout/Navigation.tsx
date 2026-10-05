import Link from "next/link";

import type { NavItem } from "@/types/navigation";

type NavigationProps = {
  items: NavItem[];
  variant: "desktop" | "mobile";
  tone?: "default" | "inverse";
  currentPath?: string;
  onNavigate?: () => void;
};

function isNavItemActive(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function Navigation({
  items,
  variant,
  tone = "default",
  currentPath = "",
  onNavigate,
}: NavigationProps) {
  const isDesktop = variant === "desktop";
  const toneClass = tone === "inverse" ? "nav-link-inverse" : "nav-link-default";

  return (
    <nav aria-label="Navegación principal">
      <ul
        className={
          isDesktop ? "flex items-center gap-8 xl:gap-10" : "flex flex-col gap-8"
        }
      >
        {items.map((item) => {
          const active = isNavItemActive(currentPath, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link ${toneClass}`}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
