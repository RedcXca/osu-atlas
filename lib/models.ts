export type OsuGameMode = "osu" | "taiko" | "fruits" | "mania";

export type OsuModeRanks = Record<OsuGameMode, number | null>;

export type OsuViewer = {
  avatarUrl: string;
  modeRanks?: OsuModeRanks;
  osuId: number;
  username: string;
};

export type OsuFriend = {
  avatarUrl: string;
  countryCode: string | null;
  countryName: string | null;
  globalRank: number | null;
  modeRanks?: OsuModeRanks;
  mutual: boolean;
  osuId: number;
  username: string;
};

export type CountryFriendBucket = {
  code: string;
  count: number;
  friends: OsuFriend[];
  name: string;
};

export type CountrySortMode = "alphabetical" | "count";

export type FriendSortMode = "alphabetical" | OsuGameMode;

export type FriendSnapshot = {
  countries: Record<string, CountryFriendBucket>;
  owner: OsuViewer | null;
  syncedAt: string;
  totals: {
    countryCount: number;
    friendCount: number;
    mutualCount: number;
  };
};

export type WorldMapCountry = {
  code: string | null;
  count: number;
  hasFriends: boolean;
  name: string;
  path: string;
  renderKey: string;
};

export type StoredSession = {
  accessToken: string;
  accessTokenExpiresAt: string | null;
  createdAt: string;
  id: string;
  refreshToken?: string;
  snapshot: FriendSnapshot;
  updatedAt: string;
  viewer: OsuViewer;
};
