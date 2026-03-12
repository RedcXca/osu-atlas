import "server-only";

import { AUTH_MESSAGE_BY_CODE } from "@/lib/config/auth";
import { createDemoSnapshot } from "@/lib/domain/demo-data";
import { buildFriendSnapshot } from "@/lib/domain/friend-snapshot";
import type { FriendSnapshot, OsuViewer, WorldMapCountry } from "@/lib/models";
import { readSessionFromCookies } from "@/lib/server/cookies";
import { fetchFriends } from "@/lib/server/osu-api";
import { getProjectedWorldCountries } from "@/lib/server/world-map";

type SearchParamValue = string | string[] | undefined;

export type HomePageData = {
  authMessage: string | null;
  demoMode: boolean;
  mapCountries: WorldMapCountry[];
  snapshot: FriendSnapshot;
  viewer: OsuViewer | null;
};

function getSingleSearchParamValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export async function readHomePageData(
  searchParams: Record<string, SearchParamValue>
): Promise<HomePageData> {
  const authKey = getSingleSearchParamValue(searchParams.auth);
  const authMessage = authKey ? AUTH_MESSAGE_BY_CODE[authKey] ?? null : null;
  const session = await readSessionFromCookies();

  let snapshot: FriendSnapshot;
  let viewer: OsuViewer | null = null;

  if (session) {
    try {
      const friends = await fetchFriends(session.accessToken);
      snapshot = buildFriendSnapshot(session.viewer, friends);
      viewer = session.viewer;
    } catch {
      // token expired or API error — fall back to demo
      snapshot = createDemoSnapshot();
    }
  } else {
    snapshot = createDemoSnapshot();
  }

  return {
    authMessage,
    demoMode: !viewer,
    mapCountries: getProjectedWorldCountries(snapshot.countries),
    snapshot,
    viewer
  };
}
