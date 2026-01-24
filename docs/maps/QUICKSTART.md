# Map Pipeline Quick Start

Get map data up and running in 5 minutes.

## TL;DR

```bash
# Install dependencies
npm install -g shapefile topojson-server topojson-client topojson-simplify ndjson-cli

# Run pipeline
npm run maps:all

# Verify output
npm run maps:verify
```

## What You Get

After running the pipeline, you'll have:

- ✅ 4 optimized TopoJSON files in `/public/maps/topojson/`
- ✅ Map registry JSON in `/public/maps/metadata/map-registry.json`
- ✅ All files under size targets (35-150 KB)

## Available Maps

| File              | Size   | Coverage | Use Case                    |
|-------------------|--------|----------|-----------------------------|
| world-110m.json   | ~35 KB | World    | Continent selection         |
| world-50m.json    | ~150 KB| World    | Country identification      |
| europe-50m.json   | ~60 KB | Europe   | European geography          |
| finland-50m.json  | ~20 KB | Finland  | Finnish local geography     |

## Next Steps

### Use in React Component

```typescript
import { feature } from 'topojson-client';

// Load map
const response = await fetch('/maps/topojson/world-110m.json');
const topology = await response.json();

// Convert to GeoJSON
const countries = feature(topology, topology.objects.countries);

// Render with D3.js or similar
svg.selectAll('path')
  .data(countries.features)
  .enter()
  .append('path')
  .attr('d', pathGenerator);
```

### Load Map Registry

```typescript
const response = await fetch('/maps/metadata/map-registry.json');
const registry = await response.json();

// Get map metadata
const worldMap = registry['world-110m'];
console.log(worldMap.name); // "World (Low Resolution)"
console.log(worldMap.fileSizeKB); // 35
console.log(worldMap.suitableFor); // ["world overview", "continent selection"]
```

## Troubleshooting

### Missing dependencies?

```bash
npm install -g shapefile topojson-server topojson-client topojson-simplify ndjson-cli
```

### Need to regenerate?

```bash
# Delete existing files
rm -rf data/maps/natural-earth/
rm -rf public/maps/topojson/*.json

# Run pipeline again
npm run maps:all
```

### Want to verify?

```bash
npm run maps:verify
```

## Common Tasks

### Add a new region

1. Edit `scripts/maps/convert-to-topojson.js`
2. Add new subset function with bounding box
3. Run `npm run maps:convert`
4. Run `npm run maps:optimize`
5. Run `npm run maps:registry`

### Change file size targets

1. Edit `scripts/maps/optimize-maps.js`
2. Update `OPTIMIZATION_TARGETS` object
3. Run `npm run maps:optimize`

### Update source data

```bash
# Delete old data
rm -rf data/maps/natural-earth/

# Download latest
npm run maps:download

# Re-run pipeline
npm run maps:convert && npm run maps:optimize && npm run maps:registry
```

## Questions?

See full documentation:
- [Map Pipeline Documentation](./README.md)
- [Map Assets README](../../public/maps/README.md)
- [Map Implementation Summary](../../Documentation/MAP_ASSET_PIPELINE.md)
