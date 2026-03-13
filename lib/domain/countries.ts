export function getCountryDisplayName(countryCode: string | null, locale = "en") {
  if (!countryCode || countryCode === "UNKNOWN") {
    return "Unknown";
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

