import "server-only";

import { AUTH_MESSAGE_BY_CODE } from "@/lib/config/auth";
import { createDemoSnapshot } from "@/lib/domain/demo-data";
import type { FriendSnapshot, OsuViewer, WorldMapCountry } from "@/lib/models";
import { readSessionFromCookies } from "@/lib/server/cookies";
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
  const snapshot = session?.snapshot ?? createDemoSnapshot();

  return {
    authMessage,
    demoMode: !session,
    mapCountries: getProjectedWorldCountries(snapshot.countries),
    snapshot,
    viewer: session?.viewer ?? null
  };
}
