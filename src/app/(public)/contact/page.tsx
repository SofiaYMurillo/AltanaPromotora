import { resolvePublicSiteSettings } from "@/backend/services/site-settings-service";
import { ContactPage } from "@/features/public/contact";
import { buildContactPageData } from "@/features/public/contact/build-contact-page-data";

export default async function ContactRoute() {
  const [siteSettings, data] = await Promise.all([
    resolvePublicSiteSettings(),
    buildContactPageData(),
  ]);

  const instagramUrl = siteSettings.socialLinks.find(
    (link) => link.platform.toLowerCase() === "instagram",
  )?.url;

  return (
    <ContactPage
      data={data}
      direct={{
        phones: siteSettings.phones.map((phone) => phone.number),
        emails: siteSettings.emails.map((email) => email.address),
        address: siteSettings.address,
      }}
      instagramUrl={instagramUrl}
    />
  );
}
