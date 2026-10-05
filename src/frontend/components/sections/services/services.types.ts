import type { Publishable } from "@/types/publishable";

export interface ServiceItem extends Publishable {
  id: string;
  title: string;
  description: string;
}

export interface ServicesData extends Partial<Pick<Publishable, "isPublished">> {
  title: string;
  description?: string;
  items: ServiceItem[];
}
