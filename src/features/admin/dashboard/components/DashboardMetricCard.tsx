import { DashboardMetric } from "./DashboardMetric";
import { DashboardMetricDescription } from "./DashboardMetricDescription";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

type DashboardMetricCardProps = {
  title: string;
  value: number;
  description: string;
};

export function DashboardMetricCard({
  title,
  value,
  description,
}: DashboardMetricCardProps) {
  return (
    <DashboardSummaryCard title={title}>
      <DashboardMetric>{value}</DashboardMetric>

      <DashboardMetricDescription>
        {description}
      </DashboardMetricDescription>
    </DashboardSummaryCard>
  );
}
