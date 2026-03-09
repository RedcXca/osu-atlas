import { MapDashboard } from "@/components/dashboard/map-dashboard";
import { createEmptyFriendSnapshot } from "@/lib/domain/friend-snapshot";
import { getProjectedWorldCountries } from "@/lib/server/world-map";

export default function Home() {
  const snapshot = createEmptyFriendSnapshot();

  return (
    <main className="page-shell">
      <MapDashboard
        authMessage={null}
        demoMode={true}
        mapCountries={getProjectedWorldCountries(snapshot.countries)}
        snapshot={snapshot}
        viewer={null}
      />
    </main>
  );
}
