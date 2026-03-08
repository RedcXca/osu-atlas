import { getFriendRankForMode } from "@/lib/domain/friend-snapshot";
import type { FriendSortMode, OsuFriend, OsuGameMode } from "@/lib/models";

const MODE_LABELS: Record<OsuGameMode, string> = {
  fruits: "Catch",
  mania: "Mania",
  osu: "osu!",
  taiko: "Taiko"
};

type FriendCardProps = {
  friend: OsuFriend;
  sortMode: FriendSortMode;
};

function getFriendRankSummary(friend: OsuFriend, sortMode: FriendSortMode) {
  const rankMode = sortMode === "alphabetical" ? "osu" : sortMode;
  const rank = getFriendRankForMode(friend, rankMode);

  return rank !== null
    ? `${MODE_LABELS[rankMode]} #${rank.toLocaleString()}`
    : `${MODE_LABELS[rankMode]} Unranked`;
}

export function FriendCard({ friend, sortMode }: Readonly<FriendCardProps>) {
  return (
    <article className="friend-card">
      <img
        alt={friend.username}
        className="friend-card__avatar"
        height={56}
        src={friend.avatarUrl}
        width={56}
      />
      <div className="friend-card__meta">
        <strong>{friend.username}</strong>
        <span>{getFriendRankSummary(friend, sortMode)}</span>
      </div>
      <a className="friend-card__link" href={`https://osu.ppy.sh/users/${friend.osuId}`} rel="noreferrer" target="_blank">
        Profile
      </a>
    </article>
  );
}
