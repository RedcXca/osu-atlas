import { countryCodeToFlag } from "@/lib/domain/countries";

type CountryFlagProps = {
  code: string | null;
};

export function CountryFlag({ code }: Readonly<CountryFlagProps>) {
  if (!code) {
    return null;
  }

  return <span className="country-flag">{countryCodeToFlag(code)}</span>;
}
