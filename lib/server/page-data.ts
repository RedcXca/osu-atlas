import "server-only";

import { AUTH_MESSAGE_BY_CODE } from "@/lib/config/auth";
import { createEmptyFriendSnapshot } from "@/lib/domain/friend-snapshot";
import type { FriendSnapshot, OsuViewer, WorldMapCountry } from "@/lib/models";
import { readSessionIdFromCookies } from "@/lib/server/cookies";
import { getStoredSession } from "@/lib/server/session-store";
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
  const sessionId = await readSessionIdFromCookies();
  const session = sessionId ? getStoredSession(sessionId) : null;
  const snapshot = session?.snapshot ?? createEmptyFriendSnapshot();

  return {
    authMessage,
    demoMode: !session,
    mapCountries: getProjectedWorldCountries(snapshot.countries),
    snapshot,
    viewer: session?.viewer ?? null
  };
}
