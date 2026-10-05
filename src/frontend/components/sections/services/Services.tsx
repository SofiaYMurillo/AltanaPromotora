import type { ServicesData } from "./services.types";

type ServicesProps = {
  data: ServicesData;
};

export function Services({ data }: ServicesProps) {
  return <section aria-label="Services" data-ready={Boolean(data)} />;
}
