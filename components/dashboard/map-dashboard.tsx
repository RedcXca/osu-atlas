"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPanel } from "@/components/dashboard/map-panel";
import { BootSequence } from "@/components/fx/boot-sequence";
import { LanguageProvider } from "@/lib/i18n/context";
import { playDeselect, playSelect } from "@/lib/audio/ui-sounds";
import type {
  CountryFriendBucket,
  CountrySortMode,
  FriendSortMode,
  FriendSnapshot,
  OsuViewer,
  WorldMapCountry
} from "@/lib/models";

const DashboardChrome = dynamic(
  () => import("@/components/dashboard/dashboard-chrome").then((m) => m.DashboardChrome),
  { ssr: false, loading: () => null }
);
const LeftDrawer = dynamic(
  () => import("@/components/layout/left-drawer").then((m) => m.LeftDrawer),
  { ssr: false, loading: () => null }
);
const SiteHeader = dynamic(
  () => import("@/components/layout/site-header").then((m) => m.SiteHeader),
  { ssr: false, loading: () => null }
);
const DashboardFx = dynamic(
  () => import("@/components/dashboard/dashboard-fx").then((m) => m.DashboardFx),
  { ssr: false, loading: () => null }
);


type MapDashboardProps = {
  authMessage: string | null;
  mapCountries: WorldMapCountry[];
  snapshot: FriendSnapshot;
  viewer: OsuViewer | null;
};

export function MapDashboard({
  authMessage,
  mapCountries,
  snapshot,
  viewer
}: Readonly<MapDashboardProps>) {
  const [hasWebGL] = useState(() => {
    if (typeof document === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [bootEntered, setBootEntered] = useState(!hasWebGL);
  const [globeReady, setGlobeReady] = useState(!hasWebGL);
  const [countrySortMode, setCountrySortMode] = useState<CountrySortMode>("count");
  const [friendSortMode, setFriendSortMode] = useState<FriendSortMode>("alphabetical");
  const [mutualOnly, setMutualOnly] = useState(false);
  const [query, setQuery] = useState("");

  // when mutual-only is active, rebuild snapshot with only mutual friends
  const effectiveSnapshot = useMemo(() => {
    if (!mutualOnly) return snapshot;
    const countries: Record<string, CountryFriendBucket> = {};
    for (const [code, bucket] of Object.entries(snapshot.countries)) {
      // treat undefined as mutual (old data without the field)
      const friends = bucket.friends.filter((f) => f.mutual !== false);
      if (friends.length > 0) {
        countries[code] = { ...bucket, count: friends.length, friends };
      }
    }
    const friendCount = Object.values(countries).reduce((sum, b) => sum + b.count, 0);
    return {
      ...snapshot,
      countries,
      totals: { countryCount: Object.keys(countries).length, friendCount, mutualCount: friendCount }
    };
  }, [mutualOnly, snapshot]);

  const effectiveMapCountries = useMemo(() => {
    if (!mutualOnly) return mapCountries;
    return mapCountries.map((mc) => {
      const count = effectiveSnapshot.countries[mc.code ?? ""]?.count ?? 0;
      return { ...mc, count, hasFriends: count > 0 };
    });
  }, [effectiveSnapshot, mapCountries, mutualOnly]);

  // refs so callbacks stay stable across renders
  const selectedCodeRef = useRef(selectedCode);
  selectedCodeRef.current = selectedCode;

  useEffect(() => {
    setQuery("");
  }, [selectedCode]);

  const handleSelectCountry = useCallback((code: string | null) => {
    if (code) {
      playSelect();
    } else if (selectedCodeRef.current) {
      playDeselect();
    }
    setSelectedCode(code);
  }, []);

  const handleGlobeReady = useCallback(() => setGlobeReady(true), []);
  const handleBootEnter = useCallback(() => setBootEntered(true), []);

  return (
    <LanguageProvider>
      <BootSequence onEnter={handleBootEnter} skip={!hasWebGL} username={viewer?.username}>
        <div className={`page-layout ${globeReady ? "globe-revealed" : ""}`}>
          {bootEntered && (
            <SiteHeader
              mutualOnly={mutualOnly}
              onMutualOnlyChange={setMutualOnly}
              viewer={viewer}
            />
          )}
          <section className="dashboard-grid">
            {bootEntered && (
            <LeftDrawer
              authMessage={authMessage}
              onFriendSortModeChange={setFriendSortMode}
              onSelectCountry={handleSelectCountry}
              snapshot={effectiveSnapshot}
                viewer={viewer}
              />
            )}
            <MapPanel
              bootEntered={bootEntered}
              globeReady={globeReady}
              hasWebGL={hasWebGL}
              mapCountries={effectiveMapCountries}
              onGlobeReady={handleGlobeReady}
              onSelectCountry={handleSelectCountry}
              selectedCode={selectedCode}
              unknownCount={effectiveSnapshot.countries["UNKNOWN"]?.count ?? 0}
            />
            {bootEntered && (
              <DashboardChrome
                countrySortMode={countrySortMode}
                friendSortMode={friendSortMode}
                mapCountries={effectiveMapCountries}
                onCountrySortModeChange={setCountrySortMode}
                onFriendSortModeChange={setFriendSortMode}
                onQueryChange={setQuery}
                onSelectCountry={handleSelectCountry}
                query={query}
                selectedCode={selectedCode}
                snapshot={effectiveSnapshot}
              />
            )}
          </section>
        </div>
        {globeReady && (
          <DashboardFx
            countryCount={effectiveSnapshot.totals.countryCount}
            friendCount={effectiveSnapshot.totals.friendCount}
            username={viewer?.username ?? "demo"}
          />
        )}
      </BootSequence>
    </LanguageProvider>
  );
}
