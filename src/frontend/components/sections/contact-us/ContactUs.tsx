import type { ContactUsData } from "./contactUs.types";

type ContactUsProps = {
  data: ContactUsData;
};

export function ContactUs({ data }: ContactUsProps) {
  return <section aria-label="Contact us" data-ready={Boolean(data)} />;
}
