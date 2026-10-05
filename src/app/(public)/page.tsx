import { HomePage } from "@/frontend/features/home";
import { buildHomePageData } from "@/frontend/features/home/build-home-page-data";

export default async function Home() {
  const data = await buildHomePageData();
  return <HomePage data={data} />;
}
