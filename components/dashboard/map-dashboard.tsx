"use client";

import dynamic from "next/dynamic";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LeftDrawer } from "@/components/layout/left-drawer";
import { RightDrawer } from "@/components/layout/right-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { WorldMap } from "@/components/map/world-map";

const AtlasGlobe = dynamic(
  () => import("@/components/globe/atlas-globe").then((m) => m.AtlasGlobe),
  { ssr: false }
);
import { BootSequence } from "@/components/fx/boot-sequence";
import { ChromaticAberration } from "@/components/fx/chromatic-aberration";
import { CircuitOverlay } from "@/components/fx/circuit-overlay";
import { FloatingMarquee } from "@/components/fx/floating-marquee";
import { GithubToast } from "@/components/fx/github-toast";
import { ScanLines } from "@/components/fx/scan-lines";
import { UiSoundProvider } from "@/components/fx/ui-sound-provider";
import { Vignette } from "@/components/fx/vignette";
import { LanguageProvider } from "@/lib/i18n/context";
import { playClick, playDeselect, playHover, playSelect } from "@/lib/audio/ui-sounds";
import { sortCountryBuckets, sortFriends } from "@/lib/domain/friend-snapshot";
import type {
  CountrySortMode,
  FriendSortMode,
  FriendSnapshot,
  OsuViewer,
  WorldMapCountry
} from "@/lib/models";


type MapDashboardProps = {
  authMessage: string | null;
  demoMode: boolean;
  mapCountries: WorldMapCountry[];
  snapshot: FriendSnapshot;
  viewer: OsuViewer | null;
};

export function MapDashboard({
  authMessage,
  demoMode,
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
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [bootEntered, setBootEntered] = useState(!hasWebGL);
  const [globeReady, setGlobeReady] = useState(!hasWebGL);
  const [countrySortMode, setCountrySortMode] = useState<CountrySortMode>("count");
  const [friendSortMode, setFriendSortMode] = useState<FriendSortMode>("alphabetical");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery("");
  }, [selectedCode]);

  const visibleCountries = useMemo(
    () =>
      sortCountryBuckets(snapshot.countries, countrySortMode).filter(
        (country) => country.code !== "UNKNOWN"
      ),
    [countrySortMode, snapshot.countries]
  );

  const selectedCountry = useMemo(() => {
    if (!selectedCode) {
      return null;
    }

    return (
      snapshot.countries[selectedCode] ?? {
        code: selectedCode,
        count: 0,
        friends: [],
        name: mapCountries.find((country) => country.code === selectedCode)?.name ?? selectedCode
      }
    );
  }, [mapCountries, selectedCode, snapshot.countries]);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const visibleFriends = useMemo(() => {
    if (!selectedCountry) {
      return [];
    }

    const matchingFriends = !normalizedQuery
      ? selectedCountry.friends
      : selectedCountry.friends.filter((friend) =>
      friend.username.toLowerCase().includes(normalizedQuery)
    );

    return sortFriends(matchingFriends, friendSortMode);
  }, [friendSortMode, normalizedQuery, selectedCountry]);

  const handleSelectCountry = (code: string | null) => {
    if (code) {
      playSelect();
    } else if (selectedCode) {
      playDeselect();
    }
    setSelectedCode(code);
  };

  const handleHoverCountry = (code: string | null) => {
    if (code && code !== hoveredCode && globeReady) {
      playHover();
    }
    setHoveredCode(code);
  };

  return (
    <LanguageProvider>
      <BootSequence onEnter={() => setBootEntered(true)} skip={!hasWebGL}>
        <div className={`page-layout ${globeReady ? "globe-revealed" : ""}`}>
          <SiteHeader viewer={viewer} />
          <section className="dashboard-grid">
            <LeftDrawer
              authMessage={authMessage}
              demoMode={demoMode}
              onFriendSortModeChange={setFriendSortMode}
              onSelectCountry={handleSelectCountry}
              snapshot={snapshot}
              viewer={viewer}
            />
            {!hasWebGL ? (
              <WorldMap
                hoveredCode={hoveredCode}
                mapCountries={mapCountries}
                unknownCount={snapshot.countries["UNKNOWN"]?.count ?? 0}
                onHoverChange={handleHoverCountry}
                onSelectCountry={handleSelectCountry}
                selectedCode={selectedCode}
              />
            ) : (
              <AtlasGlobe
                bootEntered={bootEntered}
                hoveredCode={hoveredCode}
                mapCountries={mapCountries}
                onGlobeReady={() => setGlobeReady(true)}
                onHoverChange={handleHoverCountry}
                onSelectCountry={handleSelectCountry}
                selectedCode={selectedCode}
              />
            )}
            <RightDrawer
              countries={visibleCountries}
              countrySortMode={countrySortMode}
              filteredFriends={visibleFriends}
              onCountrySortModeChange={setCountrySortMode}
              onFriendSortModeChange={setFriendSortMode}
              onQueryChange={setQuery}
              onSelectCountry={handleSelectCountry}
              friendSortMode={friendSortMode}
              query={query}
              selectedCountry={selectedCountry}
              totalFriends={snapshot.totals.friendCount}
            />
          </section>
        </div>
        <FloatingMarquee
          friendCount={snapshot.totals.friendCount}
          countryCount={snapshot.totals.countryCount}
          username={viewer?.username ?? "demo"}
        />
        <GithubToast />
        <UiSoundProvider />
        <CircuitOverlay />
        <ChromaticAberration />
        <ScanLines />
        <Vignette />
      </BootSequence>
    </LanguageProvider>
  );
}
