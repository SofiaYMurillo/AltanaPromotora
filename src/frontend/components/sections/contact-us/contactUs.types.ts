import type { Publishable } from "@/types/publishable";

export interface ContactUsData extends Partial<Pick<Publishable, "isPublished">> {
  title: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  businessHours?: string;
}
