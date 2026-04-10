import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-50m.json";
import worldCountries from "world-countries";

type AtlasCountryProperties = {
  code?: string | null;
  ISO_A2?: string;
  iso_a2?: string;
  name?: string;
};

type WorldCountryRecord = {
  cca2: string;
  ccn3: string;
  name: {
    common: string;
  };
};

export type WorldGeoFeature = Feature<Polygon | MultiPolygon, AtlasCountryProperties>;
export type WorldGeoFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  AtlasCountryProperties
>;

const worldCountryRecords = worldCountries as WorldCountryRecord[];

function buildNumericCountryMap<T>(pickValue: (country: WorldCountryRecord) => T | null) {
  return new Map<string, T>(
    worldCountryRecords.flatMap((country) => {
      const value = pickValue(country);

      if (!country.ccn3 || value === null) {
        return [];
      }

      const numericId = Number.parseInt(country.ccn3, 10);

      return [
        [country.ccn3, value] as const,
        ...(Number.isNaN(numericId) ? [] : [[String(numericId), value] as const])
      ];
    })
  );
}

export const countryCodeByNumericId = buildNumericCountryMap((country) => country.cca2 ?? null);
export const countryNameByNumericId = buildNumericCountryMap(
  (country) => country.name.common ?? null
);

export const worldCountryFeatureCollection = feature(
  worldAtlas as never,
  (worldAtlas as { objects: { countries: unknown } }).objects.countries as never
) as unknown as WorldGeoFeatureCollection;

export function getCountryCodeFromFeature(
  countryFeature: Pick<WorldGeoFeature, "id" | "properties"> | null | undefined
) {
  if (!countryFeature) {
    return null;
  }

  const explicitCode =
    countryFeature.properties?.code ??
    countryFeature.properties?.iso_a2 ??
    countryFeature.properties?.ISO_A2;

  if (typeof explicitCode === "string" && explicitCode.length === 2) {
    return explicitCode.toUpperCase();
  }

  if (countryFeature.id == null) {
    return null;
  }

  const numericId = String(countryFeature.id);

  return (
    countryCodeByNumericId.get(numericId) ??
    countryCodeByNumericId.get(numericId.padStart(3, "0")) ??
    null
  );
}
