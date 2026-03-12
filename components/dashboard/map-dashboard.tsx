"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LeftDrawer } from "@/components/layout/left-drawer";
import { RightDrawer } from "@/components/layout/right-drawer";
import { SiteHeader } from "@/components/layout/site-header";
import { WorldMap } from "@/components/map/world-map";
import { LanguageProvider } from "@/lib/i18n/context";
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
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
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
    setSelectedCode(code);
  };

  return (
    <LanguageProvider>
      <div className="page-layout">
        <SiteHeader viewer={viewer} />
        <section className="dashboard-grid">
          <LeftDrawer
            authMessage={authMessage}
            demoMode={demoMode}
            snapshot={snapshot}
            viewer={viewer}
          />
          <WorldMap
            hoveredCode={hoveredCode}
            mapCountries={mapCountries}
            unknownCount={snapshot.countries.UNKNOWN?.count ?? 0}
            onHoverChange={setHoveredCode}
            onSelectCountry={handleSelectCountry}
            selectedCode={selectedCode}
          />
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
    </LanguageProvider>
  );
}
