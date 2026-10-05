import type { ReactNode } from "react";

import { AdminCard } from "@/features/admin";

type DashboardSummaryCardProps = {
  title: string;
  children: ReactNode;
};

export function DashboardSummaryCard({
  title,
  children,
}: DashboardSummaryCardProps) {
  return (
    <AdminCard>
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b border-border pb-6">
          <h2 className="text-heading-sm text-foreground">{title}</h2>
        </header>
        <section className="flex flex-1 flex-col pt-6">{children}</section>
      </div>
    </AdminCard>
  );
}
