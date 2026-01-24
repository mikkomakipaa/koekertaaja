# Map Data Pipeline Scripts

This directory contains scripts for downloading, converting, and optimizing geographic data for map-based questions.

## Overview

The map data pipeline converts Natural Earth shapefiles to optimized TopoJSON files suitable for web display.

**Pipeline stages:**
1. 📥 **Download** - Fetch Natural Earth data
2. 🔄 **Convert** - Shapefile → TopoJSON
3. 🗜️ **Optimize** - Simplify geometry and reduce file size
4. 📋 **Registry** - Generate metadata index

## Prerequisites

### Required Tools

Install the following Node.js packages globally or as dev dependencies:

```bash
# Install globally (recommended)
npm install -g shapefile topojson-server topojson-client topojson-simplify ndjson-cli

# OR install as dev dependencies
npm install --save-dev shapefile topojson-server topojson-client topojson-simplify ndjson-cli
```

### System Requirements

- **Node.js** 18+ (for running scripts)
- **curl** (for downloading files)
- **unzip** (for extracting archives)
- **bash** (for shell scripts)

## Quick Start

Run the entire pipeline:

```bash
npm run maps:all
```

This will:
1. Download Natural Earth data
2. Convert to TopoJSON
3. Optimize file sizes
4. Generate map registry

## Individual Scripts

### 1. Download Natural Earth Data

```bash
npm run maps:download
```

**What it does:**
- Downloads Natural Earth shapefiles (110m and 50m scale)
- Saves to `data/maps/natural-earth/`
- Skips files that already exist

**Output:**
```
data/maps/natural-earth/
├── ne_110m_admin_0_countries.zip
├── ne_110m_admin_0_countries/
│   ├── ne_110m_admin_0_countries.shp
│   ├── ne_110m_admin_0_countries.dbf
│   └── ...
├── ne_50m_admin_0_countries.zip
└── ne_50m_admin_0_countries/
    ├── ne_50m_admin_0_countries.shp
    └── ...
```

### 2. Convert to TopoJSON

```bash
npm run maps:convert
```

**What it does:**
- Converts shapefiles to TopoJSON format
- Creates subsets (Europe, Finland)
- Applies initial simplification

**Output:**
```
public/maps/topojson/
├── world-110m.json      (~35 KB)
├── world-50m.json       (~150 KB)
├── europe-50m.json      (~60 KB)
└── finland-50m.json     (~20 KB)
```

**Conversion process:**
1. Read shapefile using `shp2json`
2. Filter by bounding box (for subsets)
3. Convert to TopoJSON using `geo2topo`
4. Simplify geometry using Douglas-Peucker algorithm
5. Quantize coordinates for compression

### 3. Optimize Maps

```bash
npm run maps:optimize
```

**What it does:**
- Reduces file size while preserving visual quality
- Filters unnecessary properties
- Adjusts simplification based on target size

**Optimization targets:**
- `world-110m.json`: < 35 KB
- `world-50m.json`: < 150 KB
- `europe-50m.json`: < 60 KB
- `finland-50m.json`: < 20 KB

**Optimization techniques:**
- Property filtering (keep only essential metadata)
- Geometry simplification (Douglas-Peucker)
- Coordinate quantization (compress coordinate values)
- JSON minification (remove whitespace)

### 4. Generate Registry

```bash
npm run maps:registry
```

**What it does:**
- Scans `public/maps/topojson/` for available maps
- Generates metadata index with projection, bounds, file size
- Saves to `public/maps/metadata/map-registry.json`

**Registry structure:**
```json
{
  "world-110m": {
    "name": "World (Low Resolution)",
    "path": "/maps/topojson/world-110m.json",
    "projection": "naturalEarth1",
    "bounds": [[-180, -90], [180, 90]],
    "fileSizeKB": 35,
    "suitableFor": ["world overview", "continent selection"]
  }
}
```

## Script Details

### download-natural-earth.sh

**Usage:**
```bash
bash scripts/maps/download-natural-earth.sh
```

**Source data:**
- Natural Earth v5.1.0
- Public Domain (CC0 1.0)
- URL: https://www.naturalearthdata.com/

**Downloaded files:**
- `ne_110m_admin_0_countries` (1:110 million scale)
- `ne_50m_admin_0_countries` (1:50 million scale)

### convert-to-topojson.js

**Usage:**
```bash
node scripts/maps/convert-to-topojson.js
```

**Options:**
- No command-line options (configuration is hardcoded)

**Customization:**
Edit the script to:
- Add new map regions
- Adjust bounding boxes for subsets
- Change simplification levels

**Example: Adding a new region**
```javascript
// In convert-to-topojson.js
async function createNordicSubset(worldTopoJSONPath, outputName) {
  const nordicBBox = [4, 54, 32, 72]; // [minLon, minLat, maxLon, maxLat]
  // ... filter and convert logic
}
```

### optimize-maps.js

**Usage:**
```bash
node scripts/maps/optimize-maps.js [--target=FILE] [--max-size=KB]
```

**Options:**
- `--target=FILE`: Optimize specific file only
- `--max-size=KB`: Override target file size

**Examples:**
```bash
# Optimize all maps
node scripts/maps/optimize-maps.js

# Optimize specific map
node scripts/maps/optimize-maps.js --target=world-110m.json

# Set custom size target
node scripts/maps/optimize-maps.js --target=europe-50m.json --max-size=50
```

**Optimization strategies:**

| Strategy              | Description                          | Impact       |
|-----------------------|--------------------------------------|--------------|
| Property filtering    | Keep only essential properties       | -20% to -40% |
| Geometry simplification | Reduce coordinate precision        | -40% to -60% |
| Quantization          | Compress coordinate values           | -10% to -20% |
| Minification          | Remove whitespace                    | -5% to -10%  |

### generate-registry.js

**Usage:**
```bash
node scripts/maps/generate-registry.js
```

**Output:**
- `public/maps/metadata/map-registry.json`

**Registry metadata:**
- `name`: Human-readable map name
- `description`: Map description
- `projection`: Recommended D3.js projection
- `bounds`: Geographic bounding box
- `center`: Center point for initial view
- `scale`: Recommended D3.js scale factor
- `suitableFor`: Use cases
- `regions`: Geographic regions covered
- `fileSizeKB`: File size
- `geometryCount`: Number of countries/regions

## File Size Targets

| Map              | Target Size | Typical Size | Geometries | Coverage        |
|------------------|-------------|--------------|------------|-----------------|
| world-110m.json  | < 35 KB     | ~30-35 KB    | 177        | World (low-res) |
| world-50m.json   | < 150 KB    | ~140-150 KB  | 177        | World (med-res) |
| europe-50m.json  | < 60 KB     | ~55-60 KB    | 47         | Europe          |
| finland-50m.json | < 20 KB     | ~15-20 KB    | 1          | Finland         |

## Troubleshooting

### Error: "command not found: shp2json"

**Solution:** Install topojson tools globally:
```bash
npm install -g shapefile topojson-server topojson-client topojson-simplify ndjson-cli
```

### Error: "No such file or directory: data/maps/natural-earth"

**Solution:** Run download script first:
```bash
npm run maps:download
```

### Files are larger than target size

**Solution 1:** Increase simplification:
```javascript
// In optimize-maps.js, increase simplification value
const simplification = 0.7; // Was 0.5
```

**Solution 2:** Reduce quantization:
```javascript
// In optimize-maps.js, reduce precision
const quantization = 1e4; // Was 1e5
```

**Solution 3:** Filter more properties:
```javascript
// In optimize-maps.js, keep fewer properties
const KEEP_PROPERTIES = ['NAME', 'ISO_A2']; // Remove others
```

### Missing countries in subsets

**Solution:** Adjust bounding box in conversion script:
```javascript
// In convert-to-topojson.js
const europeBBox = [-30, 30, 50, 75]; // Expand bounds
```

## Adding New Maps

To add a new map region:

1. **Identify bounding box:**
   ```
   Use https://boundingbox.klokantech.com/
   Format: [minLon, minLat, maxLon, maxLat]
   ```

2. **Add conversion function:**
   ```javascript
   // In convert-to-topojson.js
   async function createNewRegionSubset(worldTopoJSONPath, outputName) {
     const bbox = [minLon, minLat, maxLon, maxLat];
     // ... filter and convert
   }
   ```

3. **Add to main() function:**
   ```javascript
   const newRegionResult = await createNewRegionSubset(
     path.join(OUTPUT_DIR, 'world-50m.json'),
     'new-region-50m.json'
   );
   ```

4. **Add optimization target:**
   ```javascript
   // In optimize-maps.js
   const OPTIMIZATION_TARGETS = {
     'new-region-50m.json': 50, // Target size in KB
   };
   ```

5. **Add registry metadata:**
   ```javascript
   // In generate-registry.js
   const MAP_METADATA = {
     'new-region-50m.json': {
       name: 'New Region',
       projection: 'mercator',
       bounds: bbox,
       // ...
     }
   };
   ```

6. **Run pipeline:**
   ```bash
   npm run maps:all
   ```

## Performance Considerations

### Download times
- world-110m: ~5-10 seconds
- world-50m: ~10-20 seconds
- Total: ~30 seconds

### Conversion times
- world-110m: ~5 seconds
- world-50m: ~15 seconds
- europe-50m: ~10 seconds
- finland-50m: ~5 seconds
- Total: ~35 seconds

### Optimization times
- Per file: ~5-10 seconds
- Total: ~30 seconds

**Full pipeline: ~2 minutes**

## License

All map data is sourced from Natural Earth (Public Domain, CC0 1.0).

Processing scripts are licensed under the same license as Koekertaaja.

See `/public/maps/LICENSES.md` for full licensing details.

## See Also

- [Map Assets README](/public/maps/README.md)
- [Map Question Design Proposal](/MAP_QUESTION_DESIGN_PROPOSAL.md)
- [Natural Earth Documentation](https://www.naturalearthdata.com/features/)
- [TopoJSON Specification](https://github.com/topojson/topojson-specification)
