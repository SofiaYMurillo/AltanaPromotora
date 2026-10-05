import {
  primaryPhoneFromSettings,
  resolvePublicSiteSettings,
} from "@/backend/services/site-settings-service";
import { Header } from "@/frontend/components/layout/Header";
import { WhatsAppFloatingButton } from "@/frontend/components/layout/WhatsAppFloatingButton";
import { Footer } from "@/frontend/components/sections/footer";
import { footerData } from "@/frontend/components/sections/footer/footer.data";
import { mainNavigation } from "@/frontend/config/site";
import { buildWhatsAppHref } from "@/frontend/utils/whatsapp";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await resolvePublicSiteSettings();
  const whatsAppHref = buildWhatsAppHref(primaryPhoneFromSettings(settings) ?? "");

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <Header settings={settings} navigation={mainNavigation} />
      {children}
      <Footer
        settings={settings}
        data={footerData}
        navigation={mainNavigation}
      />
      {whatsAppHref ? <WhatsAppFloatingButton href={whatsAppHref} /> : null}
    </div>
  );
}
