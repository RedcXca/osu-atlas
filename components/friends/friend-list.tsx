import { FriendCard } from "@/components/friends/friend-card";
import type { FriendSortMode, OsuFriend } from "@/lib/models";

type FriendListProps = {
  friends: OsuFriend[];
  sortMode: FriendSortMode;
};

export function FriendList({ friends, sortMode }: Readonly<FriendListProps>) {
  return (
    <div className="friend-list">
      {friends.map((friend) => (
        <FriendCard friend={friend} key={friend.osuId} sortMode={sortMode} />
      ))}
    </div>
  );
}
