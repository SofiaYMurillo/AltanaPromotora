import type { ReactNode } from "react";

type DashboardMetricDescriptionProps = {
  children: ReactNode;
};

export function DashboardMetricDescription({
  children,
}: DashboardMetricDescriptionProps) {
  return (
    <p className="text-body-sm text-muted">
      {children}
    </p>
  );
}
