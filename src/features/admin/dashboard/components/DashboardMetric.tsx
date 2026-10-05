import type { ReactNode } from "react";

type DashboardMetricProps = {
  children: ReactNode;
};

export function DashboardMetric({
  children,
}: DashboardMetricProps) {
  return (
    <p className="text-display-lg text-foreground">
      {children}
    </p>
  );
}
