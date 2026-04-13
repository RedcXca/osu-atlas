import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import worldAtlas110m from "world-atlas/countries-110m.json";
import worldAtlas50m from "world-atlas/countries-50m.json";
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

// use low-res 110m as base, patch in 50m geometry for small countries that got dropped
const features110m = feature(
  worldAtlas110m as never,
  (worldAtlas110m as { objects: { countries: unknown } }).objects.countries as never
) as unknown as WorldGeoFeatureCollection;

const features50m = feature(
  worldAtlas50m as never,
  (worldAtlas50m as { objects: { countries: unknown } }).objects.countries as never
) as unknown as WorldGeoFeatureCollection;

const ids110m = new Set(features110m.features.map((f) => String(f.id)));
const missingFeatures = features50m.features.filter((f) => !ids110m.has(String(f.id)));

export const worldCountryFeatureCollection: WorldGeoFeatureCollection = {
  ...features110m,
  features: [...features110m.features, ...missingFeatures]
};

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
