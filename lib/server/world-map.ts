import "server-only";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { getCountryDisplayName } from "@/lib/domain/countries";
import {
  countryNameByNumericId,
  getCountryCodeFromFeature,
  worldCountryFeatureCollection
} from "@/lib/domain/world-geo";
import type { CountryFriendBucket, WorldMapCountry } from "@/lib/models";

const projection = geoNaturalEarth1().fitExtent(
  [
    [24, 28],
    [976, 552]
  ],
  worldCountryFeatureCollection
);
const pathBuilder = geoPath(projection);

const BASE_WORLD_COUNTRIES = worldCountryFeatureCollection.features
  .map((countryFeature, featureIndex) => {
    const numericId = String(countryFeature.id ?? "");
    const code = getCountryCodeFromFeature(countryFeature);
    const name =
      countryNameByNumericId.get(numericId) ??
      countryFeature.properties?.name ??
      getCountryDisplayName(code);
    const path = pathBuilder(countryFeature);

    if (!path) {
      return null;
    }

    return {
      code,
      name,
      path,
      renderKey: `${numericId || "unknown"}-${code ?? "none"}-${featureIndex}`
    };
  })
  .filter(
    (
      country
    ): country is {
      code: string | null;
      name: string;
      path: string;
      renderKey: string;
    } => country !== null
  );

export function getWorldCountryName(
  countryCode: string | null,
  mapCountries?: WorldMapCountry[]
) {
  if (!countryCode) {
    return "Unknown";
  }

  const mappedName = mapCountries?.find((country) => country.code === countryCode)?.name;
  return mappedName ?? getCountryDisplayName(countryCode);
}

export function getProjectedWorldCountries(
  countriesByCode: Record<string, CountryFriendBucket>
): WorldMapCountry[] {
  return BASE_WORLD_COUNTRIES.map((country) => {
    const bucket = country.code ? countriesByCode[country.code] ?? null : null;

    return {
      code: country.code,
      count: bucket?.count ?? 0,
      hasFriends: Boolean(bucket),
      name: bucket?.name ?? country.name,
      path: country.path,
      renderKey: country.renderKey
    };
  });
}
