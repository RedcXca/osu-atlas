"use client";

import { memo, useDeferredValue, useMemo } from "react";
import { RightDrawer } from "@/components/layout/right-drawer";
import { sortCountryBuckets, sortFriends } from "@/lib/domain/friend-snapshot";
import type {
  CountrySortMode,
  FriendSnapshot,
  FriendSortMode,
  WorldMapCountry
} from "@/lib/models";

type DashboardChromeProps = {
  countrySortMode: CountrySortMode;
  friendSortMode: FriendSortMode;
  mapCountries: WorldMapCountry[];
  onCountrySortModeChange: (mode: CountrySortMode) => void;
  onFriendSortModeChange: (mode: FriendSortMode) => void;
  onQueryChange: (value: string) => void;
  onSelectCountry: (code: string | null) => void;
  query: string;
  selectedCode: string | null;
  snapshot: FriendSnapshot;
};

export const DashboardChrome = memo(function DashboardChrome({
  countrySortMode,
  friendSortMode,
  mapCountries,
  onCountrySortModeChange,
  onFriendSortModeChange,
  onQueryChange,
  onSelectCountry,
  query,
  selectedCode,
  snapshot
}: Readonly<DashboardChromeProps>) {
  const deferredQuery = useDeferredValue(query);

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

  return (
    <RightDrawer
      countries={visibleCountries}
      countrySortMode={countrySortMode}
      filteredFriends={visibleFriends}
      onCountrySortModeChange={onCountrySortModeChange}
      onFriendSortModeChange={onFriendSortModeChange}
      onQueryChange={onQueryChange}
      onSelectCountry={onSelectCountry}
      friendSortMode={friendSortMode}
      query={query}
      selectedCountry={selectedCountry}
      totalFriends={snapshot.totals.friendCount}
    />
  );
});

DashboardChrome.displayName = "DashboardChrome";
