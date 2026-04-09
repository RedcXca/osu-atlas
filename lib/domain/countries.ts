// regional indicator emoji flag from a 2-letter country code
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "";
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
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

