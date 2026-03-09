import { MapDashboard } from "@/components/dashboard/map-dashboard";
import { readHomePageData } from "@/lib/server/page-data";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const pageData = await readHomePageData((await searchParams) ?? {});

  return (
    <main className="page-shell">
      <MapDashboard {...pageData} />
    </main>
  );
}
