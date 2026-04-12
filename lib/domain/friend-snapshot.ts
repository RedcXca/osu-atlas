import type {
  CountryFriendBucket,
  CountrySortMode,
  FriendSortMode,
  FriendSnapshot,
  OsuFriend,
  OsuGameMode,
  OsuModeRanks,
  OsuViewer
} from "@/lib/models";
import { getCountryDisplayName, normalizeCountryCode } from "@/lib/domain/countries";

function normalizeModeRanks(modeRanks?: Partial<OsuModeRanks>): OsuModeRanks {
  return {
    fruits: modeRanks?.fruits ?? null,
    mania: modeRanks?.mania ?? null,
    osu: modeRanks?.osu ?? null,
    taiko: modeRanks?.taiko ?? null
  };
}

export function normalizeSnapshotFriend(friend: OsuFriend): OsuFriend {
  const countryCode = normalizeCountryCode(friend.countryCode);
  const countryName = countryCode
    ? friend.countryName ?? getCountryDisplayName(countryCode)
    : null;

  return {
    avatarUrl: friend.avatarUrl,
    countryCode,
    countryName,
    globalRank: friend.globalRank,
    modeRanks: normalizeModeRanks(friend.modeRanks),
    mutual: friend.mutual ?? false,
    osuId: friend.osuId,
    username: friend.username
  };
}

export function buildFriendSnapshot(
  viewer: OsuViewer,
  rawFriends: OsuFriend[]
): FriendSnapshot {
  const countries = rawFriends.reduce<FriendSnapshot["countries"]>((accumulator, rawFriend) => {
    const friend = normalizeSnapshotFriend(rawFriend);
    const bucketCode = friend.countryCode ?? "UNKNOWN";
    const bucketName = friend.countryName ?? "Unknown";
    const bucket = accumulator[bucketCode] ?? {
      code: bucketCode,
      count: 0,
      friends: [],
      name: bucketName
    };

    bucket.count += 1;
    bucket.friends.push(friend);
    accumulator[bucketCode] = bucket;

    return accumulator;
  }, {});

  Object.values(countries).forEach((bucket) => {
    bucket.friends.sort((left, right) => left.username.localeCompare(right.username));
  });

  return {
    countries,
    owner: viewer,
    syncedAt: new Date().toISOString(),
    totals: {
      countryCount: Object.keys(countries).length,
      friendCount: rawFriends.length,
      mutualCount: rawFriends.filter((f) => f.mutual).length
    }
  };
}

export function createEmptyFriendSnapshot(): FriendSnapshot {
  return {
    countries: {},
    owner: null,
    syncedAt: new Date().toISOString(),
    totals: {
      countryCount: 0,
      friendCount: 0,
      mutualCount: 0
    }
  };
}

export function sortCountryBuckets(
  countries: Record<string, CountryFriendBucket>,
  mode: CountrySortMode = "count"
) {
  return Object.values(countries).sort((left, right) => {
    if (mode === "alphabetical") {
      return left.name.localeCompare(right.name);
    }

    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.name.localeCompare(right.name);
  });
}

export function getTopCountryBuckets(
  countries: Record<string, CountryFriendBucket>,
  limit = 5
) {
  return sortCountryBuckets(countries, "count").slice(0, limit);
}

export function getFriendRankForMode(friend: OsuFriend, mode: OsuGameMode) {
  return friend.modeRanks?.[mode] ?? (mode === "osu" ? friend.globalRank : null);
}

export function sortFriends(
  friends: OsuFriend[],
  mode: FriendSortMode = "alphabetical"
) {
  return [...friends].sort((left, right) => {
    if (mode !== "alphabetical") {
      const leftRank = getFriendRankForMode(left, mode);
      const rightRank = getFriendRankForMode(right, mode);

      if (leftRank !== null && rightRank !== null && leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if (leftRank !== null && rightRank === null) {
        return -1;
      }

      if (leftRank === null && rightRank !== null) {
        return 1;
      }
    }

    return left.username.localeCompare(right.username);
  });
}
