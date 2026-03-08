import "server-only";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";
import worldCountries from "world-countries";
import { getCountryDisplayName } from "@/lib/domain/countries";
import type { CountryFriendBucket, WorldMapCountry } from "@/lib/models";

type AtlasCountryProperties = {
  name: string;
};

type WorldCountryRecord = {
  cca2: string;
  ccn3: string;
  name: {
    common: string;
  };
};

const worldCountryRecords = worldCountries as WorldCountryRecord[];
const countryCodeByNumericId = new Map(
  worldCountryRecords.map((country) => [country.ccn3, country.cca2])
);
const countryNameByNumericId = new Map(
  worldCountryRecords.map((country) => [country.ccn3, country.name.common])
);

const countryFeatureCollection = feature(
  worldAtlas as never,
  (worldAtlas as { objects: { countries: unknown } }).objects.countries as never
) as unknown as FeatureCollection<Polygon | MultiPolygon, AtlasCountryProperties>;

const projection = geoNaturalEarth1().fitExtent(
  [
    [24, 28],
    [976, 552]
  ],
  countryFeatureCollection
);
const pathBuilder = geoPath(projection);

const BASE_WORLD_COUNTRIES = countryFeatureCollection.features
  .map((countryFeature, featureIndex) => {
    const numericId = String(countryFeature.id ?? "");
    const code = countryCodeByNumericId.get(numericId) ?? null;
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
