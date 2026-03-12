import { countryCodeToFlag, getCountryDisplayName } from "@/lib/domain/countries";
import { useLanguage } from "@/lib/i18n/context";
import type { FriendSnapshot, OsuFriend, OsuGameMode, OsuViewer } from "@/lib/models";

const DEFAULT_AVATAR = "https://osu.ppy.sh/images/layout/avatar-guest@2x.png";

type LeftDrawerProps = {
  authMessage: string | null;
  demoMode: boolean;
  onSelectCountry: (code: string) => void;
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

export function LeftDrawer({
  authMessage,
  demoMode,
  onSelectCountry,
  snapshot,
  viewer
}: Readonly<LeftDrawerProps>) {
  const { locale, t } = useLanguage();

  const displayName = viewer?.username ?? "demo";
  const displayAvatar = viewer?.avatarUrl ?? DEFAULT_AVATAR;

  const allFriends = Object.values(snapshot.countries).flatMap((country) => country.friends);
  const modeCards = (["osu", "taiko", "fruits", "mania"] as OsuGameMode[]).map((mode) => {
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
  });
  const mappedCountries = Object.values(snapshot.countries).filter((country) => country.code !== "UNKNOWN");
  const topCountry =
    [...mappedCountries].sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name);
    })[0] ?? null;
  const rarestCountry =
    [...mappedCountries].sort((left, right) => {
      if (left.count !== right.count) {
        return left.count - right.count;
      }

      return left.name.localeCompare(right.name);
    })[0] ?? null;

  return (
    <aside className="panel drawer left-drawer">
      <div className="drawer__body">
        <section className="hero-card left-drawer__hero">
          <div className="profile-row">
            <img alt={displayName} height={64} src={displayAvatar} width={64} />
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
              <strong>{topCountry ? `${countryCodeToFlag(topCountry.code)} ${topCountry.code}` : "—"}</strong>
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
              <strong>{rarestCountry ? `${countryCodeToFlag(rarestCountry.code)} ${rarestCountry.code}` : "—"}</strong>
              <span className="left-drawer__country-pill-meta" suppressHydrationWarning>
                {rarestCountry
                  ? `${getCountryDisplayName(rarestCountry.code, locale)} · ${rarestCountry.count}`
                  : "—"}
              </span>
            </button>
          </div>
        </section>

        <h3 className="left-drawer__section-title">{t.topRanked}</h3>
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
              <a
                className="widget-card widget-card--metric mode-rank-card"
                href={`https://osu.ppy.sh/users/${card.friend.osuId}`}
                key={card.mode}
                rel="noreferrer"
                target="_blank"
              >
                {content}
              </a>
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
      </div>
    </aside>
  );
}
