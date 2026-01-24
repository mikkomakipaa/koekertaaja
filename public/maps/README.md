# Map Assets

This directory contains geographic data files used for map-based questions in Koekertaaja.

## Directory Structure

```
/public/maps/
├── topojson/          # Optimized TopoJSON files (production)
│   ├── world-110m.json     # World map, low resolution (~35 KB)
│   ├── world-50m.json      # World map, medium resolution (~150 KB)
│   ├── europe-50m.json     # Europe subset (~60 KB)
│   └── finland-50m.json    # Finland only (~20 KB)
├── geojson/           # GeoJSON files (if needed for specific tools)
├── metadata/          # Map registry and configuration
│   └── map-registry.json   # Index of all available maps
├── LICENSES.md        # Attribution and licensing information
└── README.md          # This file
```

## File Format: TopoJSON

We use **TopoJSON** instead of GeoJSON for the following reasons:

- **Smaller file size**: 80% smaller than GeoJSON (topology eliminates duplicate coordinates)
- **Faster loading**: Less data to transfer over the network
- **Efficient rendering**: Direct D3.js support with minimal processing
- **Preserves topology**: Ensures shared borders between countries don't have gaps

### Size Comparison

| Map            | GeoJSON | TopoJSON | Reduction |
|----------------|---------|----------|-----------|
| World (110m)   | ~180 KB | ~35 KB   | 81%       |
| World (50m)    | ~750 KB | ~150 KB  | 80%       |
| Europe (50m)   | ~300 KB | ~60 KB   | 80%       |
| Finland (50m)  | ~100 KB | ~20 KB   | 80%       |

## Data Source

All map data is sourced from **Natural Earth**, a public domain map dataset.

- **Source**: [Natural Earth Data](https://www.naturalearthdata.com/)
- **License**: Public Domain (CC0 1.0 Universal)
- **Version**: Natural Earth v5.1.0
- **Attribution**: Not required, but appreciated (see LICENSES.md)

### Resolutions Available

- **110m scale** (1:110 million): Low resolution, ideal for world overviews
- **50m scale** (1:50 million): Medium resolution, good balance for most uses
- **10m scale** (1:10 million): High resolution (not included due to file size)

## Usage

### In React Components

```typescript
import { feature } from 'topojson-client';

// Load TopoJSON file
const response = await fetch('/maps/topojson/world-110m.json');
const topology = await response.json();

// Convert to GeoJSON for rendering
const countries = feature(topology, topology.objects.countries);

// Use with D3.js or similar
svg.selectAll('path')
  .data(countries.features)
  .enter()
  .append('path')
  .attr('d', pathGenerator);
```

### Map Registry

The `metadata/map-registry.json` file provides metadata about all available maps:

```json
{
  "world-110m": {
    "name": "World (Low Resolution)",
    "path": "/maps/topojson/world-110m.json",
    "projection": "naturalEarth1",
    "bounds": [[-180, -90], [180, 90]],
    "fileSizeKB": 35,
    "suitable_for": ["world overview", "continent selection"]
  }
}
```

## Generating Maps

To regenerate or update map files:

```bash
# 1. Download source data from Natural Earth
npm run maps:download

# 2. Convert shapefiles to TopoJSON
npm run maps:convert

# 3. Optimize file sizes
npm run maps:optimize

# 4. Update map registry
npm run maps:registry
```

## Optimization Targets

| File              | Target Size | Actual Size | Status |
|-------------------|-------------|-------------|--------|
| world-110m.json   | < 35 KB     | ~35 KB      | ✅     |
| world-50m.json    | < 150 KB    | ~150 KB     | ✅     |
| europe-50m.json   | < 60 KB     | ~60 KB      | ✅     |
| finland-50m.json  | < 20 KB     | ~20 KB      | ✅     |

## Coordinate Reference System

- **CRS**: WGS 84 (EPSG:4326)
- **Format**: Longitude, Latitude (GeoJSON standard)
- **Bounds**: [-180, -90] to [180, 90]

## Properties Included

To minimize file size, only essential properties are included:

- `NAME`: Country name (English)
- `NAME_LONG`: Full official name
- `ISO_A2`: 2-letter country code (e.g., "FI")
- `ISO_A3`: 3-letter country code (e.g., "FIN")
- `CONTINENT`: Continent name
- `REGION_UN`: UN region classification
- `SUBREGION`: Geographic subregion
- `POP_EST`: Population estimate
- `GDP_MD_EST`: GDP estimate (million USD)

## Caching Strategy

Map files are static and should be cached aggressively:

```typescript
// In next.config.js
{
  headers: [
    {
      source: '/maps/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
}
```

## Future Additions

Potential maps to add:

- [ ] US states (50m)
- [ ] Nordic countries (10m for higher detail)
- [ ] World major cities (point data)
- [ ] Historical borders (time-based)

## Troubleshooting

### Files are too large

1. Increase simplification in `scripts/maps/optimize-maps.js`
2. Reduce quantization precision (e.g., 1e4 instead of 1e5)
3. Filter more properties (remove POP_EST, GDP_MD_EST if not needed)

### Missing countries or borders

1. Check bounding box filters in conversion scripts
2. Ensure simplification isn't too aggressive (< 0.3 may remove small islands)
3. Verify source data includes the region

### Gaps between countries

This shouldn't happen with TopoJSON (topology preserves shared borders).
If gaps appear, check:
1. Projection settings in D3.js
2. SVG path rendering precision
3. Browser zoom level (sub-pixel rendering artifacts)

## See Also

- [Natural Earth Documentation](https://www.naturalearthdata.com/features/)
- [TopoJSON Specification](https://github.com/topojson/topojson-specification)
- [D3.js Geo Documentation](https://d3js.org/d3-geo)
- [Map Question Design Proposal](../../MAP_QUESTION_DESIGN_PROPOSAL.md)
