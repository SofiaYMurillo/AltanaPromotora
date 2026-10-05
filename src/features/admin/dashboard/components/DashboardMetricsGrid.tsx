import type { ReactNode } from "react";

type DashboardMetricsGridProps = {
  children: ReactNode;
};

export function DashboardMetricsGrid({
  children,
}: DashboardMetricsGridProps) {
  return (
    <div className="grid-layout gap-6">
      {children}
    </div>
  );
}
