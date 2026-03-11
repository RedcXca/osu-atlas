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

// converts a 2-letter country code to its flag emoji via regional indicator symbols
export function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase();

  if (upper.length !== 2) {
    return "";
  }

  return String.fromCodePoint(
    upper.charCodeAt(0) + 0x1F1A5,
    upper.charCodeAt(1) + 0x1F1A5
  );
}
