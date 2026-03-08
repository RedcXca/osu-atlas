# Integration Notes

## osu! API references

- OAuth flow: https://osu.ppy.sh/docs/index.html#authentication
- Own profile endpoint: https://osu.ppy.sh/docs/index.html#get-own-data
- Friends endpoint and `friends.read` scope: https://osu.ppy.sh/docs/index.html#get-apiv2friends

## Map stack references

- D3 geo projections and path generation: https://d3js.org/d3-geo
- `world-atlas` country topology data: https://www.npmjs.com/package/world-atlas
- `topojson-client` for converting topology to GeoJSON: https://github.com/topojson/topojson-client

## Current implementation choices

- OAuth uses Authorization Code Grant and stores access-token expiry so sync can refresh tokens before calling the friends endpoint.
- The map is rendered from real country polygons rather than positioned hotspots.
- Country code matching is driven by `world-atlas` numeric country ids plus `world-countries` ISO metadata.
