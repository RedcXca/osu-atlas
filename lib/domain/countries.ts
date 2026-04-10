// inline flag image tag from a 2-letter country code
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "";
  return `<img src="https://flagcdn.com/${code.toLowerCase()}.svg" alt="${upper}" width="16" height="12" style="display:inline-block;vertical-align:middle" />`;
}

export function getCountryDisplayName(countryCode: string | null, locale = "en") {
  if (!countryCode || countryCode === "UNKNOWN") {
    return "";
  }

  try {
    const regions = new Intl.DisplayNames([locale], { type: "region" });
    return regions.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase();
  } catch {
    return countryCode.toUpperCase();
  }
}

export function normalizeCountryCode(countryCode: string | null) {
  return countryCode ? countryCode.toUpperCase() : null;
}

