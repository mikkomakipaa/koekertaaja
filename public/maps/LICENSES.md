# Map Data Licenses and Attribution

This document describes the licensing and attribution requirements for all map data used in Koekertaaja.

## Summary Table

| Data Source | License | Attribution Required | Commercial Use | Share-Alike |
|------------|---------|---------------------|----------------|-------------|
| Natural Earth | CC0 1.0 (Public Domain) | ❌ No (recommended) | ✅ Yes | ❌ No |
| TopoJSON World Atlas | ISC | ❌ No (recommended) | ✅ Yes | ❌ No |
| OpenStreetMap | ODbL 1.0 | ✅ **YES** | ✅ Yes | ✅ **YES** |

---

## Natural Earth Data

### License

Primary map data is sourced from **Natural Earth**, which is released into the **Public Domain** under the **CC0 1.0 Universal (CC0 1.0) Public Domain Dedication**.

- **License Type**: CC0 1.0 Universal (Public Domain)
- **License URL**: https://creativecommons.org/publicdomain/zero/1.0/
- **Source**: https://www.naturalearthdata.com/
- **Version**: Natural Earth v5.1.0

### What This Means

You can:
- ✅ Use the data for any purpose (commercial or non-commercial)
- ✅ Modify the data
- ✅ Distribute the data
- ✅ Use without attribution (though attribution is appreciated)

No restrictions:
- ❌ No copyright
- ❌ No permission required
- ❌ No attribution required (but see below)

### Attribution (Optional but Recommended)

While **not required** by the CC0 license, Natural Earth requests the following attribution:

> Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.

**Recommended attribution format for Koekertaaja:**

```
Map data © Natural Earth (naturalearthdata.com), Public Domain
```

## Files Covered

The following files are derived from Natural Earth data:

| File                        | Source Dataset                            | License    |
|-----------------------------|-------------------------------------------|------------|
| `topojson/world-110m.json`  | ne_110m_admin_0_countries (v5.1.0)        | CC0 1.0    |
| `topojson/world-50m.json`   | ne_50m_admin_0_countries (v5.1.0)         | CC0 1.0    |
| `topojson/europe-50m.json`  | ne_50m_admin_0_countries (v5.1.0, subset) | CC0 1.0    |
| `topojson/finland-50m.json` | ne_50m_admin_0_countries (v5.1.0, subset) | CC0 1.0    |

## Data Processing

All files have been processed using the following open-source tools:

- **shapefile** (BSD-3-Clause) - https://github.com/mbostock/shapefile
- **topojson-server** (ISC) - https://github.com/topojson/topojson-server
- **topojson-client** (ISC) - https://github.com/topojson/topojson-client
- **topojson-simplify** (ISC) - https://github.com/topojson/topojson-simplify

Processing scripts are located in `/scripts/maps/` and are licensed under the same license as Koekertaaja (see root LICENSE file).

## Modifications Made

The Natural Earth source data has been modified as follows:

1. **Format conversion**: Shapefile (.shp) → TopoJSON (.json)
2. **Geometry simplification**: Reduced coordinate precision using Douglas-Peucker algorithm
3. **Coordinate quantization**: Compressed coordinate values (quantize = 1e5)
4. **Property filtering**: Only essential properties retained:
   - NAME (Country name)
   - NAME_LONG (Full country name)
   - ISO_A2 (2-letter country code)
   - ISO_A3 (3-letter country code)
   - CONTINENT
   - REGION_UN
   - SUBREGION
   - POP_EST (Population estimate)
   - GDP_MD_EST (GDP estimate)
5. **Subset extraction**: Europe and Finland files extracted from world data using bounding box filters

All modifications are documented in `/scripts/maps/` scripts.

---

## TopoJSON World Atlas

### License

Pre-optimized world maps from the **TopoJSON World Atlas** project.

- **License Type**: ISC License (permissive, similar to MIT)
- **License URL**: https://opensource.org/licenses/ISC
- **Source**: https://github.com/topojson/world-atlas
- **Version**: 3.0.1
- **Copyright**: Copyright (c) 2017-2021 Mike Bostock

### License Text

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Attribution (Optional but Recommended)

```
Map data: TopoJSON World Atlas (github.com/topojson/world-atlas)
```

### Files Used

- `countries-110m.json` - Pre-optimized world countries TopoJSON (~30KB)

---

## Third-Party Map Data (Future)

If additional map data sources are added in the future, they will be documented here with appropriate license information.

### Potential Future Sources

- **OpenStreetMap** (ODbL 1.0) - For detailed city/street data
  - License: Open Database License (ODbL)
  - **Attribution required**: "© OpenStreetMap contributors"
  - **Share-alike required**: Derivatives must use ODbL
  - License URL: https://opendatacommons.org/licenses/odbl/
  - Copyright: https://www.openstreetmap.org/copyright
  - ⚠️ **IMPORTANT**: Attribution MUST be displayed on all pages showing OSM data

- **GADM** (Custom License) - For administrative boundaries
  - License: Free for academic and non-commercial use
  - Commercial use requires license
  - URL: https://gadm.org/license.html

- **WorldClim** (CC BY-SA 4.0) - For climate/elevation data
  - License: Creative Commons Attribution-ShareAlike 4.0
  - Attribution required
  - URL: https://www.worldclim.org/

⚠️ **Important**: Any future additions must be compatible with Koekertaaja's license and educational mission.

## How to Display Attribution

### In the Application

For map-based questions, include attribution in one of these locations:

1. **Footer of map component** (recommended):
   ```tsx
   <div className="map-attribution">
     Map data © <a href="https://naturalearthdata.com">Natural Earth</a>
   </div>
   ```

2. **About page or Credits section**:
   ```markdown
   ## Map Data
   Maps are powered by Natural Earth, a public domain map dataset.
   Learn more at naturalearthdata.com.
   ```

3. **Hover tooltip on map**:
   ```tsx
   <map title="Map data © Natural Earth (Public Domain)" />
   ```

### In Documentation

This file (LICENSES.md) serves as the primary attribution and license documentation for all map assets.

## Compliance Checklist

### Current Data Sources (Natural Earth + TopoJSON)
- [x] Natural Earth data is Public Domain (CC0 1.0)
- [x] TopoJSON World Atlas uses ISC License (permissive)
- [x] Attribution included (optional but recommended for both)
- [x] Modifications documented
- [x] Processing tools credited
- [x] License file present in /public/maps/
- [x] License and attribution fields added to map-registry.json
- [x] Attribution displayed in UI via MapAttribution component
- [x] MapQuestion component shows attribution below maps

### If Using OpenStreetMap (Not Currently Used)
- [ ] Attribution text "© OpenStreetMap contributors" displayed
- [ ] Attribution links to https://www.openstreetmap.org/copyright
- [ ] Attribution visible on every page showing OSM data
- [ ] Modified/derived data shared under ODbL license (if applicable)
- [ ] Source attribution in map data files

## Questions?

For questions about licensing or attribution:
- **Natural Earth**: https://www.naturalearthdata.com/about/terms-of-use/
- **CC0 1.0 License**: https://creativecommons.org/publicdomain/zero/1.0/
- **Koekertaaja License**: See root LICENSE file

## Changelog

| Date       | Change                                          |
|------------|-------------------------------------------------|
| 2026-01-19 | Initial license documentation for Natural Earth |
| 2026-01-19 | Added TopoJSON World Atlas to license documentation |
| 2026-01-19 | Added license and attribution fields to map-registry.json |
| 2026-01-19 | Created MapAttribution component with support for Natural Earth, TopoJSON, and OSM |
| 2026-01-19 | Integrated attribution display in MapQuestion component |

---

**Summary**: All map data is Public Domain (CC0 1.0) via Natural Earth. No attribution required, but recommended. Safe for commercial and educational use.
