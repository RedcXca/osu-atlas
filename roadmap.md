# osu! Atlas Roadmap

Assumption: this project is a fresh Next.js App Router app that has not been built yet.

## Product Goal

Build a web app where a user:

1. signs in with their osu! account
2. lets the app read their friend list
3. sees a world map colored by how many friends they have in each country
4. hovers a country to preview the count
5. clicks a country to open a right-side drawer listing those friends

The layout should feel visually balanced:

- left drawer: auth, profile, sync actions, filters, summary stats
- center: interactive world map
- right drawer: selected country details and friend list

## MVP Definition

The first version should do only these things well:

- osu! OAuth login
- fetch authenticated user's friend list
- transform friends into a country-keyed object
- render an interactive world map
- show friend counts on hover
- open a right drawer with friend cards on click
- persist one synced snapshot per user

Anything beyond that should be treated as later polish.

## Core UX

### Signed Out

- left drawer contains product intro, short explanation, and `Login with osu!`
- center map can still render, but in a muted demo state with no personal data
- right drawer stays empty or shows a prompt to sign in

### Signed In

- left drawer becomes the control panel
- center map becomes the main interaction surface
- right drawer shows country details when a country is selected

### Left Drawer Recommendation

This should not exist only for symmetry. It should earn its space.

Recommended contents:

- user avatar and username
- last synced time
- total friend count
- number of represented countries
- top 5 countries by friend count
- search filter for friend name
- `Sync friends` button
- `Logout` button

This gives the page visual balance without wasting a whole panel.

### Right Drawer Recommendation

When a country is selected, show:

- country name and flag/code
- total friends in that country
- sortable friend list
- each friend card with avatar, username, country, and profile link

Hover should show lightweight info. Click should open the persistent drawer.

## Data Shape

For MVP, store one JSON snapshot per user instead of fully normalizing everything.

```ts
type FriendSnapshot = {
  owner: {
    osuId: number
    username: string
    avatarUrl: string
  }
  syncedAt: string
  totals: {
    friendCount: number
    countryCount: number
  }
  countries: Record<
    string,
    {
      code: string
      name: string
      count: number
      friends: Array<{
        osuId: number
        username: string
        avatarUrl: string
        countryCode: string | null
        countryName: string | null
      }>
    }
  >
}
```

This structure makes the UI simple:

- map reads `countries[code].count`
- hover reads `countries[code]`
- right drawer reads `countries[selectedCode].friends`

## Technical Plan

### Phase 0: External API Validation

Do this before building UI:

- register an osu! OAuth app
- confirm redirect URI works locally and in production
- request at least `identify` and `friends.read`
- keep `public` available if friend-country enrichment needs extra user lookups
- verify whether `GET /api/v2/friends` already includes country metadata
- if it does not, enrich missing fields through additional user lookups

Important risk:

- the whole product depends on friend data including enough country information to map users cleanly

## Suggested App Structure

```txt
app/
  page.tsx
  api/
    auth/
      osu/
        login/route.ts
        callback/route.ts
    friends/
      sync/route.ts
lib/
  osu.ts
  auth.ts
  friends.ts
  country-map.ts
components/
  layout/
    left-drawer.tsx
    right-drawer.tsx
  map/
    world-map.tsx
    map-tooltip.tsx
    country-legend.tsx
  friends/
    friend-list.tsx
    friend-card.tsx
```

## Build Phases

### Phase 1: App Scaffold

- create Next.js app with TypeScript and App Router
- set up environment variables for osu client ID, secret, redirect URI, session secret
- add a minimal page shell with left panel, map area, and right panel placeholders
- decide storage:
  - quickest MVP: SQLite or Postgres with one JSON column per user snapshot
  - super-temporary local development: file or in-memory storage only if you want zero setup

### Phase 2: Auth and Session

- build `login` route that redirects to osu authorization screen
- build `callback` route that exchanges code for token
- fetch authenticated user profile
- create app session
- store token server-side only

Do not expose osu access tokens to the browser if you can avoid it.

### Phase 3: Friend Sync Pipeline

- call osu friends endpoint after login or manual sync
- transform raw friend list into the country-keyed snapshot object
- handle null or missing country values with an `Unknown` bucket
- persist the snapshot
- record `syncedAt`

### Phase 4: Map Integration

- load a world geography dataset keyed by ISO country code
- match geometry country codes to snapshot country codes
- color countries by count buckets
- on hover: show tooltip with country name and friend count
- on click: set selected country and open right drawer

### Phase 5: Drawer UI

- left drawer:
  - auth state
  - user summary
  - sync controls
  - search and filters
- right drawer:
  - selected country summary
  - filtered friend list
  - empty state when no country is selected

### Phase 6: Polish

- loading skeletons
- proper error states for auth and sync failures
- empty state for users with zero friends or zero mapped countries
- responsive layout
- mobile behavior where drawers become sheets or stacked panels
- subtle animation for hover, drawer open, and country highlight

## Suggested Interaction Rules

- hover should never lock the UI; it is only for preview
- click selects the country and opens the right drawer
- clicking the same country again can collapse the drawer
- left drawer stays persistent on desktop
- on smaller screens, only one drawer should be open at a time

## Design Direction

Aim for a clean game-adjacent feel, not a generic dashboard.

- dark or muted background with brighter country highlights
- map should remain the hero element
- drawers should feel like control surfaces, not giant white sidebars
- use country color intensity to encode friend count
- keep labels minimal so the map does not feel cluttered

## Open Product Decisions

These do not block MVP, but they should be decided early:

1. Is this private per-user only, or can users share their map publicly?
2. Should sync happen only on button press, or automatically after login?
3. Do you want search-by-friend-name only, or also filters like online status / supporter / mode?
4. Should `Unknown country` friends be shown in the right drawer as their own pseudo-country?
5. Do you want profile links to open osu! user pages directly?

## Recommended MVP Order

Build in this order:

1. OAuth login
2. fetch own profile
3. fetch friend list
4. transform into country snapshot
5. render static map
6. connect hover counts
7. connect right drawer
8. fill left drawer with real data
9. add polish and responsive behavior

## Nice-to-Haves Later

- public share link for a user's map
- compare two users' friend geography
- friend search autocomplete
- top regions / continents summary
- animated replay of map fill after sync
- cached historical snapshots to show changes over time

## Definition of Done for V1

V1 is done when:

- a user can log in with osu!
- the app can sync their friends successfully
- the map shows correct counts per country
- clicking a country reliably opens the matching friend list
- the page works on desktop and mobile
- sync, loading, empty, and error states all exist

## References

- osu! API docs: https://osu.ppy.sh/docs/
- relevant auth scope: `friends.read`
- relevant endpoint: `GET /api/v2/friends`
