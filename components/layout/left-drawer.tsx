import { BASE_PATH } from "@/lib/config/constants";
import { APP_ROUTES } from "@/lib/config/routes";
import type { FriendSnapshot, OsuFriend, OsuGameMode, OsuViewer } from "@/lib/models";

type LeftDrawerProps = {
  authMessage: string | null;
  demoMode: boolean;
  snapshot: FriendSnapshot;
  viewer: OsuViewer | null;
};

export function LeftDrawer({
  authMessage,
  demoMode,
  snapshot,
  viewer
}: Readonly<LeftDrawerProps>) {
  const modeLabels: Record<OsuGameMode, string> = {
    fruits: "Catch",
    mania: "Mania",
    osu: "osu!",
    taiko: "Taiko"
  };
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
      label: modeLabels[mode],
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
        {demoMode || !viewer ? (
          <section className="hero-card login-card">
            <img
              alt="osu!"
              className="login-card__logo"
              height={96}
              src={`${BASE_PATH}/brand-mark.svg`}
              width={96}
            />
            <a className="button button--primary" href={APP_ROUTES.osuLogin}>
              Login with osu!
            </a>
          </section>
        ) : (
          <>
            <section className="hero-card left-drawer__hero">
              <div className="profile-row">
                <img alt={viewer.username} height={64} src={viewer.avatarUrl} width={64} />
                <div className="profile-meta">
                  <strong>{viewer.username}</strong>
                </div>
              </div>

              <div className="stat-grid left-drawer__stat-grid">
                <article className="stat-card left-drawer__stat-card">
                  <span>Friends</span>
                  <strong>{snapshot.totals.friendCount}</strong>
                </article>
                <article className="stat-card left-drawer__stat-card">
                  <span>Countries</span>
                  <strong>{snapshot.totals.countryCount}</strong>
                </article>
              </div>

              <div className="left-drawer__country-strip">
                <article className="left-drawer__country-pill">
                  <span className="left-drawer__country-pill-label">Top</span>
                  <strong>{topCountry?.code ?? "—"}</strong>
                  <span className="left-drawer__country-pill-meta">
                    {topCountry ? `${topCountry.name} · ${topCountry.count}` : "—"}
                  </span>
                </article>

                <article className="left-drawer__country-pill" data-tone="accent">
                  <span className="left-drawer__country-pill-label">Rarest</span>
                  <strong>{rarestCountry?.code ?? "—"}</strong>
                  <span className="left-drawer__country-pill-meta">
                    {rarestCountry ? `${rarestCountry.name} · ${rarestCountry.count}` : "—"}
                  </span>
                </article>
              </div>
            </section>

            <section className="widget-grid left-drawer__mode-grid">
              {modeCards.map((card) => (
                <article
                  className="widget-card widget-card--metric mode-rank-card"
                  key={card.mode}
                >
                  <span className="widget-card__label">{card.label}</span>
                  <strong>{card.friend?.username ?? "—"}</strong>
                  {card.rank !== null ? (
                    <span className="mode-rank-card__rank">#{card.rank.toLocaleString()}</span>
                  ) : (
                    <span className="widget-card__subcopy">—</span>
                  )}
                </article>
              ))}
            </section>
          </>
        )}

        {authMessage ? (
          <section className="status-card" data-tone="danger">
            {authMessage}
          </section>
        ) : null}
      </div>
    </aside>
  );
}
