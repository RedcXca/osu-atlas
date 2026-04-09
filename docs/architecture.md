# Architecture

## Overview

osu! Atlas is a Next.js 15 (App Router) app that visualizes where a user's osu! friends are located on a 3D globe. Users authenticate via osu! OAuth, and their friends list is fetched and grouped by country. The UI is styled after NieR: Automata's Bunker command terminal — monochrome, translucent panels, chamfered corners, and digital FX overlays.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Custom CSS (no framework)
- **Globe**: react-globe.gl (Three.js under the hood, dynamic import, SSR-safe)
- **3D**: Three.js + postprocessing (chromatic aberration, glitch effect on globe renderer)
- **Auth**: osu! OAuth Authorization Code Grant
- **Session**: Lightweight cookie sessions
- **i18n**: Custom React Context with 37 locales

## Directory Structure

```
app/                        # Next.js App Router
  api/auth/osu/             # OAuth login + callback routes
  api/auth/logout/          # logout route
  api/friends/sync/         # re-fetch friends from osu! API
  globe-test/               # standalone globe test page
  globals.css               # all styles (NieR palette, chamfers, FX, responsive)
  layout.tsx                # root layout
  page.tsx                  # home page (server component)

components/
  dashboard/                # MapDashboard — main orchestrator, state machine owner
  fx/                       # visual + audio effects
    boot-sequence.tsx        # terminal startup → glitch → fade reveal
    chromatic-aberration.tsx  # subtle color fringing overlay
    circuit-overlay.tsx      # decorative circuit trace lines
    data-corruption.tsx      # text-level unicode glitch effect
    floating-marquee.tsx     # scrolling operator status ticker
    github-toast.tsx         # one-time GitHub link toast
    glitch-flicker.tsx       # horizontal slice displacement (periodic)
    hud-overlay.tsx          # heads-up display corner elements
    scan-lines.tsx           # CRT scanline overlay
    soundtrack-dock.tsx      # NieR OST preview player (iTunes API)
    space-background.tsx     # CSS starfield with parallax
    static-noise.tsx         # canvas noise grain overlay
    ui-sound-provider.tsx    # hover/click sound bindings for UI elements
    vignette.tsx             # radial edge darkening
  globe/
    atlas-globe.tsx          # 3D globe with countries, friend markers, route arcs, starfield, post-processing
  layout/                   # site header, left/right drawers, language selector
  friends/                  # friend list

lib/
  audio/
    ui-sounds.ts             # Web Audio API synth — hover, click, select, glitch sounds
  config/                   # auth constants, route paths
  domain/                   # pure logic (countries, demo data, snapshot utils, world-geo)
  i18n/                     # LanguageProvider context + 37 translation objects
  models.ts                 # all TypeScript types
  server/                   # server-only: osu API, cookies, session store, map projection

public/
  favicon.svg
  brand-mark.svg
```

## Visual Design — NieR: Automata Terminal

### Color System

Monochrome palette with warm off-white text on near-black translucent panels:

| Variable | Value | Purpose |
|----------|-------|---------|
| `--bg-page` | `#0a0a0c` | void background |
| `--bg-panel` | `rgba(18, 18, 22, 0.70)` | translucent panel glass |
| `--text` | `#e8e6e3` | warm off-white |
| `--accent` | `#c8c0b8` | warm beige (NieR signature) |
| `--line` | `rgba(255, 255, 255, 0.08)` | faint dividers |

### Chamfered Corners

CSS `clip-path: polygon()` with top-left and bottom-right chamfers (asymmetric military look). Three sizes via `--clip-lg`, `--clip-md`, `--clip-sm`. Applied to panels, cards, buttons, inputs, badges. **Not** applied to containers with dropdowns (clip-path clips overflow).

### Panel Glass

All panels use `backdrop-filter: blur(16px) saturate(0.3)`. No box-shadows — depth comes from translucency layers and border brightness.

### Typography

Share Tech Mono for terminal readouts and data labels. Slight letter-spacing on labels. Numbers displayed as monospaced readouts.

## 3D Globe

### Implementation

`react-globe.gl` loaded via Next.js `dynamic()` with `{ ssr: false }`. The globe renders country polygons from bundled `world-atlas` TopoJSON (no CDN fetches).

### Visual Elements

- **Globe material**: dark `MeshBasicMaterial` (#161616, 0.95 opacity)
- **Country polygons**: translucent overlays, intensity scales with friend count
- **Friend markers**: white dots at country centroids
- **Route arcs**: animated dashed white lines connecting friend locations
- **Graticule grid**: faint lat/lon lines
- **Background starfield**: 2400 Three.js Points on a large sphere (r=600-1200), rotates with camera
- **Foreground particles**: 120 glowing circles (radial gradient canvas texture) orbiting close to globe, breathing in size and opacity
- **Post-processing**: chromatic aberration + periodic glitch effect on the globe's own renderer (intercepted render loop)

### Interaction

- Auto-rotate (0.28 speed), resumes 3s after user interaction
- Country hover: outline brightens, slight altitude lift
- Country click: selects country, zooms to centroid, opens right drawer
- Globe click (empty): deselects
- `minDistance: 170` / `maxDistance: 420` for user zoom

## Boot Sequence & Load Stages

The app has a staged entrance animation controlled by a state machine in `BootSequence` and props in `MapDashboard`:

```
Phase 1: "boot"      — terminal lines type out (320ms per line)
Phase 2: "waiting"   — "[PRESS ENTER]" prompt, waits for user gesture
Phase 3: "glitch"    — 600ms glitch effect (shake + tear slices + static SFX)
                        dispatches "nier-boot-enter" event
                        sets bootEntered=true → globe starts zoom-out
Phase 4: "fade"      — boot overlay fades to transparent (1800ms CSS transition)
                        globe is zooming out underneath
Phase 5: "done"      — overlay removed from DOM
Phase 6: globeReady  — globe zoom completes (4500ms after enter)
                        .globe-revealed class added to .page-layout
                        panels animate in (slide + fade, staggered)
```

The globe renders behind the boot overlay the entire time. It parks at altitude 0.01 (surface level) on mount, then zooms out to 2.2 when `bootEntered` becomes true. `minDistance` smoothly eases from 101→170 during zoom to prevent camera snapping.

### Panel Entrance

Panels start hidden (`opacity: 0`, translated off-axis). When `.globe-revealed` is set:
- Header: drops in from top (50ms delay)
- Left drawer: slides in from left (0ms delay)
- Right drawer: slides in from right (150ms delay)
- Floating marquee: rises from bottom (300ms delay)

All transitions: 800ms with NieR easing `cubic-bezier(0.16, 1, 0.3, 1)`.

## Audio

### UI Sounds (`lib/audio/ui-sounds.ts`)

Synthesized via Web Audio API — zero audio files:

| Sound | Trigger | Character |
|-------|---------|-----------|
| `playHover` | country/globe hover | short 900Hz sine blip |
| `playHoverSoft` | UI element hover | quieter 600Hz sine |
| `playClick` | button/link click | 700Hz sine |
| `playSelect` | country select | ascending two-tone |
| `playDeselect` | country deselect | descending two-tone |
| `playGlitch` | boot glitch phase | soft lowpassed white noise hiss |
| `playNotification` | alerts | three-tone chime |

### Soundtrack Dock

Bottom-left panel fetches a NieR track preview from iTunes Search API. Audio is unlocked via silent play during user gesture (boot enter), then starts playback after a delay. Manual play/pause/mute controls.

## Data Flow

```
osu! OAuth login
  → /api/auth/osu/login (sets state cookie, redirects to osu.ppy.sh)
  → osu.ppy.sh redirects back to /api/auth/osu/callback
  → callback exchanges code for token, fetches profile + friends
  → builds FriendSnapshot, stores in cookie session
  → redirects to /

Page load (/)
  → server component reads session cookie
  → if session: loads real snapshot + viewer
  → if no session: loads demo snapshot (osu! mascots)
  → passes data to MapDashboard client component
```

### FriendSnapshot

Core data structure: all friends grouped by country code, total counts, and the owner's profile.

### Demo Mode

When no session exists, renders with osu! mascot characters. Login button shown in header and left drawer.

## FX Overlay Stack

Layered over the UI (all `pointer-events: none`, fixed position):

1. **CircuitOverlay** — decorative circuit trace SVG lines
2. **ChromaticAberration** — subtle RGB fringe on panel borders via CSS box-shadow
3. **ScanLines** — CRT horizontal lines (4px repeat, slow drift)
4. **Vignette** — radial edge darkening (z-index 9996)
5. **FloatingMarquee** — operator status ticker at viewport bottom (z-index 9997)
6. **BootSequence overlay** — opaque black during boot (z-index 10000)

## Lessons Learned

- **clip-path kills dropdowns**: never apply to containers with overflow menus
- **SVG filters on root = blur/dim**: use targeted CSS shadows for chromatic aberration
- **StaticNoise / GlitchFlicker removed**: too distracting. NieR aesthetic is clean — distortion goes in data (DataCorruption), not rendering
- **Local geography > CDN fetches**: bundled `world-atlas` for deterministic country selection
- **Globe polygons need altitude**: ≥0.01 for reliable raycasting
- **Dynamic imports for Three.js**: use `dynamic()` or `import()` inside effects, not top-level in server contexts
- **Boot overlay must not hide children**: globe needs to mount and initialize behind the overlay for the cinematic reveal to work
- **minDistance clamping**: controls.minDistance limits how close the camera can get — must be lowered for the zoom-in starting position, then eased back up
