# Data Models

All types are defined in `lib/models.ts`.

## Core Types

### OsuViewer
The logged-in user's profile.

| Field      | Type            | Description                    |
|------------|-----------------|--------------------------------|
| avatarUrl  | string          | profile picture URL            |
| modeRanks  | OsuModeRanks?   | rank per game mode (optional)  |
| osuId      | number          | osu! user ID                   |
| username   | string          | display name                   |

### OsuFriend
A single friend from the osu! API.

| Field       | Type             | Description                          |
|-------------|------------------|--------------------------------------|
| avatarUrl   | string           | profile picture URL                  |
| countryCode | string \| null   | ISO 3166-1 alpha-2 (e.g. "JP")      |
| countryName | string \| null   | display name (e.g. "Japan")          |
| globalRank  | number \| null   | overall rank (null if unranked)      |
| modeRanks   | OsuModeRanks?    | rank per game mode                   |
| osuId       | number           | osu! user ID                         |
| username    | string           | display name                         |

### OsuModeRanks
`Record<OsuGameMode, number | null>` — rank for each of the four game modes.

### OsuGameMode
`"osu" | "taiko" | "fruits" | "mania"`

## Snapshot Types

### FriendSnapshot
The main data blob passed to the dashboard. Built from the friends list on login/sync.

| Field     | Type                                    | Description                        |
|-----------|-----------------------------------------|------------------------------------|
| countries | Record<string, CountryFriendBucket>     | friends grouped by country code    |
| owner     | OsuViewer \| null                       | the logged-in user (null in demo)  |
| syncedAt  | string                                  | ISO timestamp of last sync         |
| totals    | { countryCount: number; friendCount: number } | summary counts             |

### CountryFriendBucket
One country's group of friends.

| Field   | Type         | Description                    |
|---------|--------------|--------------------------------|
| code    | string       | ISO country code (e.g. "JP")   |
| count   | number       | number of friends in country   |
| friends | OsuFriend[]  | the friends in this country    |
| name    | string       | display name (e.g. "Japan")    |

## Map Types

### WorldMapCountry
A renderable country polygon for the SVG map.

| Field      | Type            | Description                              |
|------------|-----------------|------------------------------------------|
| code       | string \| null  | ISO code (null for unmatchable polygons)  |
| count      | number          | friend count for this country             |
| hasFriends | boolean         | whether any friends are here              |
| name       | string          | display name                              |
| path       | string          | SVG path `d` attribute                   |
| renderKey  | string          | unique key for React rendering            |

## Session Types

### StoredSession
Server-side session stored in memory.

| Field                | Type              | Description                         |
|----------------------|-------------------|-------------------------------------|
| accessToken          | string            | osu! API access token               |
| accessTokenExpiresAt | string \| null    | ISO expiry timestamp                |
| createdAt            | string            | ISO timestamp                       |
| id                   | string            | UUID session identifier             |
| refreshToken         | string?           | osu! refresh token (optional)       |
| snapshot             | FriendSnapshot    | cached friend data                  |
| updatedAt            | string            | ISO timestamp of last update        |
| viewer               | OsuViewer         | the session owner's profile         |

## Sort Types

- **CountrySortMode**: `"alphabetical" | "count"`
- **FriendSortMode**: `"alphabetical" | OsuGameMode`
