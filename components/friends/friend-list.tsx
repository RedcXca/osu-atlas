import { getFriendRankForMode } from "@/lib/domain/friend-snapshot";
import { useLanguage } from "@/lib/i18n/context";
import type { FriendSortMode, OsuFriend, OsuGameMode } from "@/lib/models";

const MODE_LABELS: Record<OsuGameMode, string> = {
  fruits: "Catch",
  mania: "Mania",
  osu: "osu!",
  taiko: "Taiko"
};

type FriendListProps = {
  friends: OsuFriend[];
  sortMode: FriendSortMode;
};

export function FriendList({ friends, sortMode }: Readonly<FriendListProps>) {
  const { t } = useLanguage();
  const rankMode = sortMode === "alphabetical" ? "osu" : sortMode;

  return (
    <div className="friend-list">
      {friends.map((friend, index) => {
        const rank = getFriendRankForMode(friend, rankMode);
        const rankSummary = rank !== null
          ? `${MODE_LABELS[rankMode]} #${rank.toLocaleString("en")}`
          : `${MODE_LABELS[rankMode]} ${t.unranked}`;

        return (
          <article className="friend-card" key={`${friend.osuId}-${index}`}>
            <img
              alt={friend.username}
              className="friend-card__avatar"
              height={56}
              src={friend.avatarUrl}
              width={56}
            />
            <div className="friend-card__meta">
              <strong>{friend.username}</strong>
              <span>{rankSummary}</span>
            </div>
            <a className="friend-card__link" href={`https://osu.ppy.sh/users/${friend.osuId}`} rel="noreferrer" target="_blank">
              {t.profile}
            </a>
          </article>
        );
      })}
    </div>
  );
}
