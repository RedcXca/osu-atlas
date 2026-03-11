import type { FriendSnapshot, OsuFriend } from "@/lib/models";
import { getCountryDisplayName } from "@/lib/domain/countries";

// osu! mascot avatars from the official wiki
const MASCOT_AVATARS: Record<string, string> = {
  pippi: "https://i.ppy.sh/86c781878e959781d57f13309934f6ac4b9277c5/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f70697070692e706e67",
  Mocha: "https://i.ppy.sh/8662e30071c8d108af6bf3d3bc5f9d4ebd9750f5/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f4d6f6368612e706e67",
  Yuzu: "https://i.ppy.sh/f9830746d834bc5b28d63fc2998ea34aba05506a/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f59757a752e706e67",
  Don: "https://i.ppy.sh/bcd934a16dd30e566f44702032eb9142d87178a4/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f446f6e2e706e67",
  Mani: "https://i.ppy.sh/af44d8275508b687416a60580970c87d6464c52b/68747470733a2f2f6173736574732e7070792e73682f6d656469612f6d6172692d6d616e692f77696b692d6b65792d636f6e64656e7365642e706e67",
  Mari: "https://i.ppy.sh/af44d8275508b687416a60580970c87d6464c52b/68747470733a2f2f6173736574732e7070792e73682f6d656469612f6d6172692d6d616e692f77696b692d6b65792d636f6e64656e7365642e706e67",
  Aiko: "https://i.ppy.sh/91b42b20786587195275d026f58223d982a6552e/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f41696b6f2e706e67",
  Alisa: "https://i.ppy.sh/364df05d2412d1ecd28a773356e0cd2f15185508/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f416c6973612e706e67",
  Chirou: "https://i.ppy.sh/d052e965c8097666477de3b0951d8db06fc5dc74/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f436869726f752e706e67",
  Taikonator: "https://i.ppy.sh/3c2203e1c9a1b83155115e7a1c72dc24f7e77978/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f5461696b6f6e61746f722e706e67",
  Tama: "https://i.ppy.sh/f8d16e0e586c1fcc3544d2e41d22d85f085424d3/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f54616d612e706e67",
  "Ryūta": "https://i.ppy.sh/6303063752f8667c8f1611c9f833aeb6e35a4945/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f5279757574612e706e67",
  "Agent J": "https://i.ppy.sh/3813ecfc93b8bcac77efeaadd0d3e4f227d1402e/68747470733a2f2f6f73752e7070792e73682f77696b692f696d616765732f4d6173636f74732f696d672f4167656e745f4a2e706e67",
};

function demoFriend(
  osuId: number,
  username: string,
  countryCode: string,
  globalRank: number | null,
  modeRanks?: Partial<Record<"osu" | "taiko" | "fruits" | "mania", number | null>>
): OsuFriend {
  return {
    avatarUrl: MASCOT_AVATARS[username] ?? "https://osu.ppy.sh/images/layout/avatar-guest@2x.png",
    countryCode,
    countryName: getCountryDisplayName(countryCode),
    globalRank,
    modeRanks: {
      osu: modeRanks?.osu ?? null,
      taiko: modeRanks?.taiko ?? null,
      fruits: modeRanks?.fruits ?? null,
      mania: modeRanks?.mania ?? null
    },
    osuId,
    username
  };
}

const DEMO_FRIENDS: OsuFriend[] = [
  // japan — main mascots
  demoFriend(100001, "pippi", "JP", 1200, { osu: 1200, taiko: 800 }),
  demoFriend(100002, "Mocha", "JP", 4500, { osu: 4500, taiko: 1200 }),
  demoFriend(100003, "Yuzu", "JP", 12000, { osu: 12000, fruits: 3400 }),
  demoFriend(100004, "Don", "JP", 28000, { taiko: 500 }),

  // south korea — mania twins
  demoFriend(100005, "Mani", "KR", 650, { osu: 650, mania: 420 }),
  demoFriend(100006, "Mari", "KR", 7800, { osu: 7800, mania: 1900 }),

  // community mascots spread across countries
  demoFriend(100007, "Aiko", "US", 3200, { osu: 3200, taiko: 6500 }),
  demoFriend(100008, "Alisa", "DE", 5600, { osu: 5600, mania: 7200 }),
  demoFriend(100009, "Chirou", "PH", 2100, { osu: 2100, taiko: 4300 }),
  demoFriend(100010, "Taikonator", "AU", 9800, { osu: 9800, taiko: 1400 }),
  demoFriend(100011, "Tama", "BR", 6300, { osu: 6300, taiko: 2800 }),

  // legacy mascots
  demoFriend(100012, "Ryūta", "CA", 11000, { osu: 11000, fruits: 2100 }),
  demoFriend(100013, "Agent J", "GB", 7400, { osu: 7400 }),
];

export function createDemoSnapshot(): FriendSnapshot {
  const countries: Record<string, FriendSnapshot["countries"][string]> = {};

  for (const friend of DEMO_FRIENDS) {
    const code = friend.countryCode ?? "UNKNOWN";
    const name = friend.countryName ?? "Unknown";

    if (!countries[code]) {
      countries[code] = { code, count: 0, friends: [], name };
    }

    countries[code].count += 1;
    countries[code].friends.push(friend);
  }

  for (const bucket of Object.values(countries)) {
    bucket.friends.sort((a, b) => a.username.localeCompare(b.username));
  }

  return {
    countries,
    owner: null,
    syncedAt: new Date().toISOString(),
    totals: {
      countryCount: Object.keys(countries).length,
      friendCount: DEMO_FRIENDS.length
    }
  };
}
