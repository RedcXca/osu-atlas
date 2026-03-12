# Architecture

## Overview

osu! Atlas is a Next.js 15 (App Router) app that visualizes where a user's osu! friends are located on a world map. Users authenticate via osu! OAuth, and their friends list is fetched and grouped by country.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Custom CSS (no framework)
- **Map**: D3 geo projections + world-atlas topology data
- **Auth**: osu! OAuth Authorization Code Grant
- **Session**: In-memory store (server-side `Map`)
- **i18n**: Custom React Context with 37 locales

## Directory Structure

```
app/                        # Next.js App Router
  api/auth/osu/             # OAuth login + callback routes
  api/auth/logout/          # logout route
  api/friends/sync/         # re-fetch friends from osu! API
  globals.css               # all styles
  layout.tsx                # root layout
  page.tsx                  # home page (server component)

components/
  countries/                # country breakdown list
  dashboard/                # MapDashboard (main orchestrator)
  friends/                  # friend list + cards
  layout/                   # site header, left/right drawers, language selector
  map/                      # world map SVG renderer
  ui/                       # sort accordion

lib/
  config/                   # auth constants, route paths
  domain/                   # pure logic (countries, demo data, snapshot utils)
  i18n/                     # LanguageProvider context + 37 translation objects
  models.ts                 # all TypeScript types
  server/                   # server-only: osu API, cookies, session store, map projection

public/
  favicon.svg               # globe icon
  brand-mark.svg            # header logo (white globe)
  world-110m.json           # TopoJSON world geometry

docs/                       # documentation
```

## Data Flow

```
osu! OAuth login
  → /api/auth/osu/login (sets state cookie, redirects to osu.ppy.sh)
  → osu.ppy.sh redirects back to /api/auth/osu/callback
  → callback exchanges code for token, fetches profile + friends
  → builds FriendSnapshot, stores in-memory session
  → sets session cookie, redirects to /

Page load (/)
  → server component reads session cookie
  → if session exists: loads real snapshot + viewer
  → if no session: loads demo snapshot (osu! mascots)
  → passes data to MapDashboard client component
```

## Key Concepts

### FriendSnapshot
The core data structure. Contains all friends grouped by country, total counts, and the owner's profile. Built once on login and updated on sync.

### Demo Mode
When no session exists, the app renders with demo data using osu! mascot characters. A login button is shown in the header and left drawer.

### In-Memory Session Store
Sessions live in a `Map` on the server process. This means sessions are lost on server restart and don't work across multiple instances. Sufficient for a hobby project.
