import { CountryBreakdownList } from "@/components/countries/country-breakdown-list";
import { FriendList } from "@/components/friends/friend-list";
import { SortAccordion } from "@/components/ui/sort-accordion";
import { useLanguage } from "@/lib/i18n/context";
import { countryCodeToFlag, getCountryDisplayName } from "@/lib/domain/countries";
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

// game mode sort labels stay in English
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
  const { locale, t } = useLanguage();
  const localizedCountryName = selectedCountry
    ? `${countryCodeToFlag(selectedCountry.code)} ${getCountryDisplayName(selectedCountry.code, locale)}`
    : null;

  return (
    <aside className="panel drawer right-drawer">
      <div className="drawer__body">
        {selectedCountry ? (
          <>
            <div className="stack">
              <h2 className="drawer__title drawer__title--proper">{localizedCountryName}</h2>
              <p className="drawer__copy">
                {t.friendCount(selectedCountry.count)}
              </p>
            </div>

            {selectedCountry.count > 0 ? (
              <div className="toolbar-row toolbar-row--split">
                <input
                  className="input"
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={t.searchFriends}
                  value={query}
                />
                <SortAccordion
                  label={t.sortUsers}
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
                  {t.noFriendsMapped}
                </div>
              ) : (
                <div className="empty-card">
                  {t.noMatchesFor} <strong>{query}</strong>.
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="toolbar-row toolbar-row--split">
              <h2 className="drawer__title drawer__title--proper">{t.countries}</h2>
              <SortAccordion
                label={t.sortCountries}
                onChange={onCountrySortModeChange}
                options={[
                  { label: t.count, value: "count" },
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
              <section className="empty-card">{t.noMappedCountries}</section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
