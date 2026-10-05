import { AboutConfianzaSection } from "./components/AboutConfianzaSection";
import { AboutEquipoSection } from "./components/AboutEquipoSection";
import { AboutFinalCtaSection } from "./components/AboutFinalCtaSection";
import { AboutHistoriaSection } from "./components/AboutHistoriaSection";
import { AboutPageHero } from "./components/AboutPageHero";
import { AboutValoresSection } from "./components/AboutValoresSection";
import type { AboutPageData } from "./about.types";

type AboutPageProps = {
  data: AboutPageData;
};

export function AboutPage({ data }: AboutPageProps) {
  return (
    <main className="flex flex-col">
      <AboutPageHero data={data.hero} />
      <AboutHistoriaSection data={data.historia} />
      <AboutConfianzaSection data={data.confianza} />
      <AboutValoresSection data={data.valores} />
      <AboutEquipoSection data={data.equipo} />
      <AboutFinalCtaSection data={data.finalCta} />
    </main>
  );
}
