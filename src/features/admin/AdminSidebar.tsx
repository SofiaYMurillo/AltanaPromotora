"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavigation } from "./navigation/navigation.types";

type AdminSidebarProps = {
  navigation: AdminNavigation;
};

export function AdminSidebar({ navigation }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación administrativa"
      className="admin-sidebar flex w-full shrink-0 flex-col border-b lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r"
    >
      <div className="border-b border-white/10 px-6 py-4 lg:py-6">
        <p className="font-display text-heading-sm text-background">ALTANA</p>
        <p className="text-caption text-on-primary-muted">Panel Administrativo</p>
      </div>

      <div className="px-3 py-3 lg:flex-1 lg:overflow-y-auto lg:py-4">
        <div className="flex flex-col gap-6">
          {navigation.sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-2">
              {section.label ? (
                <p className="px-3 text-caption uppercase tracking-[0.14em] text-on-primary-muted">
                  {section.label}
                </p>
              ) : null}

              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className="admin-sidebar-link block whitespace-nowrap rounded-md px-3 py-2 text-label transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
