import { AboutUs } from "@/frontend/components/sections/about-us";
import { Faq } from "@/frontend/components/sections/faq";
import { Hero } from "@/frontend/components/sections/hero";
import { Projects } from "@/frontend/components/sections/projects";
import type { HomePageData } from "./home.types";

type HomePageProps = {
  data: HomePageData;
};

export function HomePage({ data }: HomePageProps) {
  return (
    <main className="flex flex-col">
      <Hero data={data.hero} />
      <AboutUs data={data.aboutUs} />
      <Projects data={data.featuredProjects} />
      <Faq data={data.faq} />
    </main>
  );
}
