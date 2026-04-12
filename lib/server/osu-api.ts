import "server-only";

import {
  OSU_OAUTH_SCOPES,
  REQUIRED_OSU_ENV_KEYS,
  type RequiredOsuEnvKey
} from "@/lib/config/auth";
import type { OsuFriend, OsuGameMode, OsuModeRanks, OsuViewer } from "@/lib/models";

const OSU_BASE_URL = "https://osu.ppy.sh";

type OsuTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
};

type OsuApiUser = {
  avatar_url: string;
  country?: {
    code?: string;
    name?: string;
  };
  country_code?: string | null;
  id: number;
  statistics?: {
    global_rank?: number | null;
  };
  statistics_rulesets?: Partial<
    Record<
      OsuGameMode,
      {
        global_rank?: number | null;
      }
    >
  >;
  username: string;
};

type OsuApiUsersResponse = {
  users?: OsuApiUser[];
};

const OSU_GAME_MODES: OsuGameMode[] = ["osu", "taiko", "fruits", "mania"];
const OSU_USERS_BATCH_SIZE = 50;

function readRequiredEnv(key: RequiredOsuEnvKey) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

export function getMissingOsuEnvKeys() {
  return REQUIRED_OSU_ENV_KEYS.filter((key) => !process.env[key]);
}

export function buildOsuAuthorizationUrl(state: string) {
  const url = new URL("/oauth/authorize", OSU_BASE_URL);

  url.searchParams.set("client_id", readRequiredEnv("OSU_CLIENT_ID"));
  url.searchParams.set("redirect_uri", readRequiredEnv("OSU_REDIRECT_URI"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", OSU_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", state);

  return url.toString();
}

export class OsuApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OsuApiError";
    this.status = status;
  }
}

async function osuApiFetch<T>(pathname: string, accessToken: string): Promise<T> {
  const response = await fetch(`${OSU_BASE_URL}${pathname}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new OsuApiError(`osu! API request failed with ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

async function postTokenRequest(tokenParams: URLSearchParams): Promise<OsuTokenResponse> {
  const requestBody = new URLSearchParams({
    client_id: readRequiredEnv("OSU_CLIENT_ID"),
    client_secret: readRequiredEnv("OSU_CLIENT_SECRET"),
    ...Object.fromEntries(tokenParams.entries())
  });

  const response = await fetch(`${OSU_BASE_URL}/oauth/token`, {
    body: requestBody,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });

  if (!response.ok) {
    throw new OsuApiError(`osu! token exchange failed with ${response.status}`, response.status);
  }

  return (await response.json()) as OsuTokenResponse;
}

export async function exchangeAuthorizationCode(code: string): Promise<OsuTokenResponse> {
  return postTokenRequest(
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: readRequiredEnv("OSU_REDIRECT_URI")
    })
  );
}

export async function refreshAccessToken(refreshToken: string): Promise<OsuTokenResponse> {
  return postTokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: OSU_OAUTH_SCOPES.join(" ")
    })
  );
}

export async function fetchOwnProfile(accessToken: string) {
  return osuApiFetch<OsuApiUser>("/api/v2/me/osu", accessToken);
}

function coerceUsersFromFriendsResponse(payload: unknown): OsuApiUser[] {
  if (Array.isArray(payload)) {
    return payload as OsuApiUser[];
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { friends?: unknown; users?: unknown };

    if (Array.isArray(candidate.users)) {
      return candidate.users as OsuApiUser[];
    }

    if (Array.isArray(candidate.friends)) {
      return candidate.friends as OsuApiUser[];
    }
  }

  return [];
}

function coerceUsersResponse(payload: OsuApiUsersResponse | unknown): OsuApiUser[] {
  if (payload && typeof payload === "object" && Array.isArray((payload as OsuApiUsersResponse).users)) {
    return (payload as OsuApiUsersResponse).users ?? [];
  }

  return [];
}

function chunkUserIds(userIds: number[], size: number) {
  const chunks: number[][] = [];

  for (let index = 0; index < userIds.length; index += size) {
    chunks.push(userIds.slice(index, index + size));
  }

  return chunks;
}

async function fetchUsersByIds(accessToken: string, userIds: number[]): Promise<OsuApiUser[]> {
  if (userIds.length === 0) {
    return [];
  }

  const users = await Promise.all(
    chunkUserIds(userIds, OSU_USERS_BATCH_SIZE).map(async (batchIds) => {
      const searchParams = new URLSearchParams();

      batchIds.forEach((userId) => {
        searchParams.append("ids[]", String(userId));
      });

      const payload = await osuApiFetch<OsuApiUsersResponse>(
        `/api/v2/users?${searchParams.toString()}`,
        accessToken
      );

      return coerceUsersResponse(payload);
    })
  );

  return users.flat();
}

function extractModeRanks(user: OsuApiUser): OsuModeRanks {
  return OSU_GAME_MODES.reduce<OsuModeRanks>(
    (accumulator, mode) => {
      accumulator[mode] =
        user.statistics_rulesets?.[mode]?.global_rank ??
        (mode === "osu" ? user.statistics?.global_rank ?? null : null);
      return accumulator;
    },
    {
      fruits: null,
      mania: null,
      osu: null,
      taiko: null
    }
  );
}

function toOsuFriend(user: OsuApiUser, mutual = false): OsuFriend {
  const modeRanks = extractModeRanks(user);

  return {
    avatarUrl: user.avatar_url,
    countryCode: user.country_code ?? user.country?.code ?? null,
    countryName: user.country?.name ?? null,
    globalRank: modeRanks.osu,
    modeRanks,
    mutual,
    osuId: user.id,
    username: user.username
  };
}

export async function fetchFriends(accessToken: string): Promise<OsuFriend[]> {
  const payload = await osuApiFetch<unknown>("/api/v2/friends", accessToken);
  const rawFriends = coerceUsersFromFriendsResponse(payload);

  // capture mutual status from the raw /friends response before hydration
  // the api returns { mutual: boolean, ... } per relation entry
  const mutualById = new Map<number, boolean>();
  if (Array.isArray(payload)) {
    for (const entry of payload as { id?: number; target_id?: number; mutual?: boolean }[]) {
      const id = entry.id ?? entry.target_id;
      if (id != null) mutualById.set(id, entry.mutual === true);
    }
  }

  const uniqueFriendIds = [...new Set(rawFriends.map((friend) => friend.id))];
  // hydrate per-ruleset ranks from the documented users endpoint instead of trusting /friends
  const detailedFriends = await fetchUsersByIds(accessToken, uniqueFriendIds);
  const detailedFriendsById = new Map(detailedFriends.map((friend) => [friend.id, friend]));

  return rawFriends.map((friend) =>
    toOsuFriend(detailedFriendsById.get(friend.id) ?? friend, mutualById.get(friend.id) ?? false)
  );
}

export function toOsuViewer(user: OsuApiUser): OsuViewer {
  return {
    avatarUrl: user.avatar_url,
    modeRanks: extractModeRanks(user),
    osuId: user.id,
    username: user.username
  };
}

export function getTokenExpiryTimestamp(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}
