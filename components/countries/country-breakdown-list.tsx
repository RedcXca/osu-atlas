import type { CSSProperties } from "react";
import { countryCodeToFlag } from "@/lib/domain/countries";
import type { CountryFriendBucket } from "@/lib/models";

type CountryBreakdownListProps = {
  countries: CountryFriendBucket[];
  onSelectCountry: (code: string) => void;
  totalFriends: number;
};

export function CountryBreakdownList({
  countries,
  onSelectCountry,
  totalFriends
}: Readonly<CountryBreakdownListProps>) {

  return (
    <div className="country-breakdown-list">
      {countries.map((country, index) => {
        const share = Math.round((country.count / Math.max(totalFriends, 1)) * 100);
        const barStyle = {
          "--country-share": `${Math.max(share, 4)}%`
        } as CSSProperties;

        return (
          <button
            className="country-breakdown-row"
            key={country.code}
            onClick={() => onSelectCountry(country.code)}
            type="button"
          >
            <span className="country-breakdown-row__rank">{countryCodeToFlag(country.code)}</span>
            <div className="country-breakdown-row__body">
              <div className="country-breakdown-row__meta">
                <strong>{country.name}</strong>
                <span>{country.count}</span>
              </div>
              <span
                aria-hidden="true"
                className="country-breakdown-row__bar"
                style={barStyle}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
