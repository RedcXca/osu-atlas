import { memo, useMemo } from "react";
import { DataCorruption } from "@/components/fx/data-corruption";
import { SoundtrackDock } from "@/components/fx/soundtrack-dock";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountryDisplayName } from "@/lib/domain/countries";
import { useLanguage } from "@/lib/i18n/context";
import type { FriendSnapshot, OsuFriend, OsuGameMode, OsuViewer } from "@/lib/models";

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

export const LeftDrawer = memo(function LeftDrawer({
  authMessage,
  demoMode,
  onFriendSortModeChange,
  onSelectCountry,
  snapshot,
  viewer
}: Readonly<LeftDrawerProps>) {
  const { locale, t } = useLanguage();

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

          <div className="stat-grid left-drawer__stat-grid">
            <article className="stat-card left-drawer__stat-card">
              <span>{t.friends}</span>
              <strong>{snapshot.totals.friendCount}</strong>
            </article>
            <article className="stat-card left-drawer__stat-card">
              <span>{t.countries}</span>
              <strong>{snapshot.totals.countryCount}</strong>
            </article>
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

        {authMessage ? (
          <section className="status-card" data-tone="danger">
            {authMessage}
          </section>
        ) : null}

        <SoundtrackDock />
      </div>
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
