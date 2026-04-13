import { memo } from "react";
import { CountryBreakdownList } from "@/components/countries/country-breakdown-list";
import { DataCorruption } from "@/components/fx/data-corruption";
import { FriendList } from "@/components/friends/friend-list";
import { SortAccordion } from "@/components/ui/sort-accordion";
import { useLanguage } from "@/lib/i18n/context";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountryDisplayName } from "@/lib/domain/countries";
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

export const RightDrawer = memo(function RightDrawer({
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
    ? getCountryDisplayName(selectedCountry.code, locale)
    : null;

  return (
    <aside className="panel drawer right-drawer">
      <div className="drawer__body">
        {selectedCountry ? (
          <>
            <div className="country-brief" key={selectedCountry.code}>
              <div className="country-brief__meta">
                <span className="country-brief__kicker">REGION // SCAN</span>
                <span className="country-brief__code">{selectedCountry.code.toUpperCase()}</span>
              </div>
              <div className="country-brief__row">
                <div className="country-brief__flag">
                  <CountryFlag code={selectedCountry.code} />
                </div>
                <div className="country-brief__body">
                  <h2 className="country-brief__name" suppressHydrationWarning>
                    {localizedCountryName}
                  </h2>
                  <div className="country-brief__stats">
                    <span className="country-brief__stat">
                      <span className="country-brief__stat-label">TARGETS</span>
                      <strong>{selectedCountry.count}</strong>
                    </span>
                    <span className="country-brief__divider" />
                    <span className="country-brief__stat">
                      <span className="country-brief__stat-label">CODE</span>
                      <strong>{selectedCountry.code}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="country-brief__ticks" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
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
              <h2 className="drawer__title"><DataCorruption text={t.countries} interval={12000} /></h2>
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
});

RightDrawer.displayName = "RightDrawer";
