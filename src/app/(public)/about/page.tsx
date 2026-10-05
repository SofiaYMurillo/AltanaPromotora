import { AboutPage } from "@/features/public/about";
import { buildAboutPageData } from "@/features/public/about/build-about-page-data";

export default async function AboutRoute() {
  const data = await buildAboutPageData();
  return <AboutPage data={data} />;
}
