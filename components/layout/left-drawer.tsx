"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DataCorruption } from "@/components/fx/data-corruption";
import { SoundtrackDock } from "@/components/fx/soundtrack-dock";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountryDisplayName } from "@/lib/domain/countries";
import { useLanguage } from "@/lib/i18n/context";
import { playNotification } from "@/lib/audio/ui-sounds";
import type { FriendSnapshot, OsuFriend, OsuGameMode, OsuViewer } from "@/lib/models";

const TRANSMISSIONS = [
  { from: "ARCHIVE.SYS", body: "The observable universe spans roughly 93 billion light years across." },
  { from: "DEEP.FIELD", body: "A teaspoon of neutron star matter would weigh about 6 billion tons." },
  { from: "TELEMETRY", body: "Sunlight takes 8 minutes 20 seconds to reach Earth." },
  { from: "ARCHIVE.SYS", body: "Stars in the universe outnumber grains of sand on every beach on Earth." },
  { from: "LONG.RANGE", body: "Andromeda will collide with the Milky Way in about 4.5 billion years." },
  { from: "DEEP.FIELD", body: "Interstellar space sits near 2.7 Kelvin — barely above absolute zero." },
  { from: "TELEMETRY", body: "Proxima Centauri, the nearest star, is 4.24 light years away." },
  { from: "ARCHIVE.SYS", body: "A single day on Venus is longer than its entire year." },
  { from: "DEEP.FIELD", body: "Saturn is less dense than water — theoretically it could float." },
  { from: "LONG.RANGE", body: "Jupiter's Great Red Spot is a storm at least 350 years old." },
  { from: "TELEMETRY", body: "The Milky Way holds between 100 and 400 billion stars." },
  { from: "DEEP.FIELD", body: "Some neutron stars spin over 700 times every second." },
  { from: "ARCHIVE.SYS", body: "Light from the farthest galaxies we see has traveled over 13 billion years." },
  { from: "LONG.RANGE", body: "Nebula NGC-1569 sits roughly 11 million light years from Earth." },
  { from: "UNKNOWN", body: "Gravitational waves stretch and compress spacetime itself." },
  { from: "TELEMETRY", body: "The Sun loses about 4 million tons of mass per second to fusion." }
];

const DEFAULT_AVATAR = "https://osu.ppy.sh/images/layout/avatar-guest@2x.png";

type LeftDrawerProps = {
  authMessage: string | null;
  demoMode: boolean;
  onFriendSortModeChange: (mode: OsuGameMode) => void;
  onSelectCountry: (code: string | null) => void;
  snapshot: FriendSnapshot;
  viewer: OsuViewer | null;
};

// game mode labels stay in English per design
const MODE_LABELS: Record<OsuGameMode, string> = {
  fruits: "Catch",
  mania: "Mania",
  osu: "osu!",
  taiko: "Taiko"
};

function StatusBar({
  label,
  value,
  max,
  tone
}: Readonly<{ label: string; value: number; max: number; tone?: "accent" }>) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="status-bar" data-tone={tone}>
      <div className="status-bar__row">
        <span className="status-bar__label">{label}</span>
        <span className="status-bar__value">
          <strong>{value}</strong>
          <span className="status-bar__max">/{max}</span>
        </span>
      </div>
      <div className="status-bar__track">
        <div className="status-bar__fill" style={{ width: `${pct}%` }} />
        <span className="status-bar__pct">{pct}%</span>
      </div>
    </div>
  );
}

function Transmission({ onClose }: Readonly<{ onClose: () => void }>) {
  const [message] = useState(() => TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    playNotification();
    const dismissTimer = setTimeout(onClose, 10000);
    return () => clearTimeout(dismissTimer);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="github-toast" role="status">
      <svg className="github-toast__icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M8 1L1 4.5v4C1 12 4 14.5 8 15c4-.5 7-3 7-6.5v-4L8 1z" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
      <span className="github-toast__link" style={{ cursor: "default" }}>
        {message.from}: {message.body}
      </span>
      <button
        className="github-toast__close"
        onClick={onClose}
        type="button"
        aria-label="dismiss"
      >
        &times;
      </button>
    </div>,
    document.body
  );
}

export const LeftDrawer = memo(function LeftDrawer({
  authMessage,
  demoMode,
  onFriendSortModeChange,
  onSelectCountry,
  snapshot,
  viewer
}: Readonly<LeftDrawerProps>) {
  const { locale, t } = useLanguage();
  const [transmissionKey, setTransmissionKey] = useState(0);
  const openTransmission = useCallback(() => setTransmissionKey((k) => k + 1), []);
  const closeTransmission = useCallback(() => setTransmissionKey(0), []);

  const displayName = viewer?.username ?? "demo";
  const displayAvatar = viewer?.avatarUrl ?? DEFAULT_AVATAR;

  const allFriends = useMemo(
    () => Object.values(snapshot.countries).flatMap((country) => country.friends),
    [snapshot.countries]
  );
  const modeCards = useMemo(
    () =>
      (["osu", "taiko", "fruits", "mania"] as OsuGameMode[]).map((mode) => {
        const bestFriend = allFriends.reduce<{
          friend: OsuFriend | null;
          rank: number | null;
        }>(
          (currentBest, friend) => {
            const rank = friend.modeRanks?.[mode] ?? (mode === "osu" ? friend.globalRank : null);

            if (rank === null) {
              return currentBest;
            }

            if (currentBest.rank === null || rank < currentBest.rank) {
              return { friend, rank };
            }

            if (
              currentBest.rank === rank &&
              currentBest.friend &&
              friend.username.localeCompare(currentBest.friend.username) < 0
            ) {
              return { friend, rank };
            }

            return currentBest;
          },
          { friend: null, rank: null }
        );

        return {
          ...bestFriend,
          label: MODE_LABELS[mode],
          mode
        };
      }),
    [allFriends]
  );
  const mappedCountries = useMemo(
    () => Object.values(snapshot.countries).filter((country) => country.code !== "UNKNOWN"),
    [snapshot.countries]
  );
  const topCountry = useMemo(
    () =>
      [...mappedCountries].sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return left.name.localeCompare(right.name);
      })[0] ?? null,
    [mappedCountries]
  );
  const rarestCountry = useMemo(
    () =>
      [...mappedCountries].sort((left, right) => {
        if (left.count !== right.count) {
          return left.count - right.count;
        }

        return left.name.localeCompare(right.name);
      })[0] ?? null,
    [mappedCountries]
  );

  return (
    <aside className="panel drawer left-drawer">
      <div className="pulse-line" />
      <div className="drawer__body">
        <section className="hero-card left-drawer__hero">
          <div className="profile-row">
            <img alt={displayName} height={48} src={displayAvatar} width={48} />
            <div className="profile-meta">
              <strong>{displayName}</strong>
            </div>
          </div>

          <div className="unit-status">
            <div className="unit-status__header">
              <span className="unit-status__label">UNIT.STATUS</span>
              <span className="unit-status__id">OP // 0x42</span>
            </div>
            <div className="unit-status__counts">
              <span>
                <em>{t.friends}</em>
                <strong>{snapshot.totals.friendCount}</strong>
              </span>
              <span>
                <em>{t.countries}</em>
                <strong>{snapshot.totals.countryCount}</strong>
              </span>
            </div>
            <StatusBar
              label="MUTUAL"
              value={snapshot.totals.mutualCount ?? 0}
              max={Math.max(snapshot.totals.friendCount, 1)}
              tone="accent"
            />
          </div>

          <div className="left-drawer__country-strip">
            <button
              className="left-drawer__country-pill"
              disabled={!topCountry}
              onClick={() => topCountry && onSelectCountry(topCountry.code)}
              type="button"
            >
              <span className="left-drawer__country-pill-label">{t.top}</span>
              <strong>{topCountry ? <><CountryFlag code={topCountry.code} /> {topCountry.code}</> : "—"}</strong>
              <span className="left-drawer__country-pill-meta" suppressHydrationWarning>
                {topCountry
                  ? `${getCountryDisplayName(topCountry.code, locale)} · ${topCountry.count}`
                  : "—"}
              </span>
            </button>

            <button
              className="left-drawer__country-pill"
              data-tone="accent"
              disabled={!rarestCountry}
              onClick={() => rarestCountry && onSelectCountry(rarestCountry.code)}
              type="button"
            >
              <span className="left-drawer__country-pill-label">{t.rarest}</span>
              <strong>{rarestCountry ? <><CountryFlag code={rarestCountry.code} /> {rarestCountry.code}</> : "—"}</strong>
              <span className="left-drawer__country-pill-meta" suppressHydrationWarning>
                {rarestCountry
                  ? `${getCountryDisplayName(rarestCountry.code, locale)} · ${rarestCountry.count}`
                  : "—"}
              </span>
            </button>
          </div>
        </section>

        <h3 className="left-drawer__section-title">
          <DataCorruption text={t.topRanked} interval={10000} />
        </h3>
        <section className="widget-grid left-drawer__mode-grid">
          {modeCards.map((card) => {
            const content = (
              <>
                <span className="widget-card__label">{card.label}</span>
                <strong>{card.friend?.username ?? "—"}</strong>
                {card.rank !== null ? (
                  <span className="mode-rank-card__rank">#{card.rank.toLocaleString("en")}</span>
                ) : (
                  <span className="widget-card__subcopy">—</span>
                )}
              </>
            );

            return card.friend ? (
              <button
                className="widget-card widget-card--metric mode-rank-card"
                key={card.mode}
                onClick={() => {
                  if (card.friend!.countryCode) {
                    onSelectCountry(card.friend!.countryCode);
                  }
                  onFriendSortModeChange(card.mode);
                }}
                type="button"
              >
                {content}
              </button>
            ) : (
              <article
                className="widget-card widget-card--metric mode-rank-card"
                key={card.mode}
              >
                {content}
              </article>
            );
          })}
        </section>

        <button
          className="recon-archive"
          type="button"
          onClick={openTransmission}
          aria-label="open transmission"
        >
          <div className="recon-archive__frame">
            <div className="recon-archive__image" />
            <div className="recon-archive__scanlines" aria-hidden="true" />
            <svg className="recon-archive__sigil" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 4" />
              <circle cx="40" cy="40" r="8" fill="currentColor" opacity="0.15" />
              <circle cx="40" cy="40" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <line x1="40" y1="0" x2="40" y2="12" stroke="currentColor" strokeWidth="0.8" />
              <line x1="40" y1="68" x2="40" y2="80" stroke="currentColor" strokeWidth="0.8" />
              <line x1="0" y1="40" x2="12" y2="40" stroke="currentColor" strokeWidth="0.8" />
              <line x1="68" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="0.8" />
              <g className="recon-archive__spin">
                <line x1="40" y1="14" x2="40" y2="22" stroke="currentColor" strokeWidth="1.2" />
              </g>
            </svg>
            <span className="recon-archive__corner recon-archive__corner--tl" />
            <span className="recon-archive__corner recon-archive__corner--tr" />
            <span className="recon-archive__corner recon-archive__corner--bl" />
            <span className="recon-archive__corner recon-archive__corner--br" />
          </div>
        </button>

        {authMessage ? (
          <section className="status-card" data-tone="danger">
            {authMessage}
          </section>
        ) : null}

        <SoundtrackDock />
      </div>
      {transmissionKey > 0 ? <Transmission key={transmissionKey} onClose={closeTransmission} /> : null}
    </aside>
  );
}, areLeftDrawerPropsEqual);

LeftDrawer.displayName = "LeftDrawer";

function areLeftDrawerPropsEqual(
  previousProps: Readonly<LeftDrawerProps>,
  nextProps: Readonly<LeftDrawerProps>
) {
  return (
    previousProps.authMessage === nextProps.authMessage &&
    previousProps.demoMode === nextProps.demoMode &&
    previousProps.onFriendSortModeChange === nextProps.onFriendSortModeChange &&
    previousProps.onSelectCountry === nextProps.onSelectCountry &&
    previousProps.snapshot.countries === nextProps.snapshot.countries &&
    previousProps.snapshot.totals.friendCount === nextProps.snapshot.totals.friendCount &&
    previousProps.snapshot.totals.countryCount === nextProps.snapshot.totals.countryCount &&
    previousProps.viewer?.osuId === nextProps.viewer?.osuId &&
    previousProps.viewer?.username === nextProps.viewer?.username &&
    previousProps.viewer?.avatarUrl === nextProps.viewer?.avatarUrl
  );
}
