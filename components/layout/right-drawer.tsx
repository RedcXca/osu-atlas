import { CountryBreakdownList } from "@/components/countries/country-breakdown-list";
import { FriendList } from "@/components/friends/friend-list";
import { SortAccordion } from "@/components/ui/sort-accordion";
import type {
  CountryFriendBucket,
  CountrySortMode,
  FriendSortMode,
  OsuFriend
} from "@/lib/models";

type RightDrawerProps = {
  countries: CountryFriendBucket[];
  countrySortMode: CountrySortMode;
  filteredFriends: OsuFriend[];
  onCountrySortModeChange: (mode: CountrySortMode) => void;
  onFriendSortModeChange: (mode: FriendSortMode) => void;
  onQueryChange: (value: string) => void;
  onSelectCountry: (code: string) => void;
  friendSortMode: FriendSortMode;
  query: string;
  selectedCountry: CountryFriendBucket | null;
  totalFriends: number;
};

const FRIEND_SORT_OPTIONS: { label: string; value: FriendSortMode }[] = [
  { label: "A-Z", value: "alphabetical" },
  { label: "osu!", value: "osu" },
  { label: "Taiko", value: "taiko" },
  { label: "Catch", value: "fruits" },
  { label: "Mania", value: "mania" }
];

export function RightDrawer({
  countries,
  countrySortMode,
  filteredFriends,
  onCountrySortModeChange,
  onFriendSortModeChange,
  onQueryChange,
  onSelectCountry,
  friendSortMode,
  query,
  selectedCountry,
  totalFriends
}: Readonly<RightDrawerProps>) {
  return (
    <aside className="panel drawer right-drawer">
      <div className="drawer__body">
        {selectedCountry ? (
          <>
            <div className="stack">
              <h2 className="drawer__title drawer__title--proper">{selectedCountry.name}</h2>
              <p className="drawer__copy">
                {selectedCountry.count} friend{selectedCountry.count === 1 ? "" : "s"}
              </p>
            </div>

            {selectedCountry.count > 0 ? (
              <div className="toolbar-row toolbar-row--split">
                <input
                  className="input"
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search friends"
                  value={query}
                />
                <SortAccordion
                  label="Sort users"
                  onChange={onFriendSortModeChange}
                  options={FRIEND_SORT_OPTIONS}
                  value={friendSortMode}
                />
              </div>
            ) : null}

            <section>
              {filteredFriends.length > 0 ? (
                <FriendList friends={filteredFriends} sortMode={friendSortMode} />
              ) : selectedCountry.count === 0 ? (
                <div className="empty-card">
                  No friends mapped here yet.
                </div>
              ) : (
                <div className="empty-card">
                  No matches for <strong>{query}</strong>.
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="toolbar-row toolbar-row--split">
              <h2 className="drawer__title drawer__title--proper">Countries</h2>
              <SortAccordion
                label="Sort countries"
                onChange={onCountrySortModeChange}
                options={[
                  { label: "Count", value: "count" },
                  { label: "A-Z", value: "alphabetical" }
                ] satisfies { label: string; value: CountrySortMode }[]}
                value={countrySortMode}
              />
            </div>

            {countries.length > 0 ? (
              <CountryBreakdownList
                countries={countries}
                onSelectCountry={onSelectCountry}
                totalFriends={totalFriends}
              />
            ) : (
              <section className="empty-card">No mapped countries yet.</section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
