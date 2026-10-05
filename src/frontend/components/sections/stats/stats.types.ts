import type { StatIconName } from "@/frontend/components/icons/EditorialIcons";

export interface StatItem {
  id: string;
  value: string;
  label: string;
  icon: StatIconName;
}

export interface StatsData {
  items: StatItem[];
}
