import { MapDashboard } from "@/components/dashboard/map-dashboard";
import { createEmptyFriendSnapshot } from "@/lib/domain/friend-snapshot";
import type { OsuViewer } from "@/lib/models";
import { getProjectedWorldCountries } from "@/lib/server/world-map";

const PLACEHOLDER_VIEWER: OsuViewer = {
  avatarUrl: "https://a.ppy.sh/35592545",
  osuId: 35592545,
  username: "RedcXca"
};

export default function Home() {
  const snapshot = createEmptyFriendSnapshot();

  return (
    <main className="page-shell">
      <MapDashboard
        authMessage={null}
        demoMode={false}
        mapCountries={getProjectedWorldCountries(snapshot.countries)}
        snapshot={snapshot}
        viewer={PLACEHOLDER_VIEWER}
      />
    </main>
  );
}
