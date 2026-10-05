import { statIcons } from "@/frontend/components/icons/EditorialIcons";

import type { StatsData } from "./stats.types";

type StatsProps = {
  data: StatsData;
};

export function Stats({ data }: StatsProps) {
  return (
    <section
      aria-label="Cifras institucionales"
      className="section-y-compact border-t border-border bg-surface"
    >
      <div className="container">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-10 md:gap-y-14 lg:grid-cols-4 lg:gap-0">
          {data.items.map((item, index) => {
            const Icon = statIcons[item.icon];

            return (
              <li
                key={item.id}
                className={`flex flex-col items-center px-2 text-center sm:px-4 lg:px-10 ${
                  index % 2 === 1 ? "border-l border-border/60 lg:border-l-0" : ""
                } ${index > 0 ? "lg:border-l lg:border-border" : ""}`}
              >
                <Icon className="h-5 w-5 text-accent" title={item.label} />
                <p className="mt-4 text-heading-xl tabular-nums text-foreground md:text-display-lg">
                  {item.value}
                </p>
                <p className="mt-2 max-w-[12rem] text-caption uppercase tracking-[0.16em] text-secondary">
                  {item.label}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
