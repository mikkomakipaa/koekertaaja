# Task: Map data licensing, attribution, and compliance

## Context

- Geographic data has licensing requirements that must be followed.
- Natural Earth Data is Public Domain (no attribution required).
- OpenStreetMap data requires attribution (ODbL license).
- Must document all map sources and their licenses.
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`
- Related files: `/public/maps/LICENSES.md`, `README.md`

## Scope

- In scope:
  - Document all map data sources with URLs and licenses.
  - Create attribution file in `/public/maps/LICENSES.md`.
  - Add attribution section to app footer (if using ODbL data).
  - Verify compliance with license terms (attribution, share-alike).
  - Add data provenance metadata to map registry.
- Out of scope:
  - Legal review (consult lawyer if using commercial data).
  - Creating custom maps from scratch.

## Changes

- [ ] Create `/public/maps/LICENSES.md` documenting all data sources.
- [ ] Add source, license, URL, and attribution text for each map.
- [ ] Update `/public/maps/metadata/map-registry.json` to include `license` and `attribution` fields.
- [ ] Add attribution footer component if using ODbL data (OpenStreetMap).
- [ ] Update main `README.md` with "Map Data Sources" section.
- [ ] Review license compliance checklist:
  - [ ] Attribution provided where required
  - [ ] Share-alike terms followed (if applicable)
  - [ ] No commercial restrictions violated
  - [ ] License files included in repo

## Acceptance Criteria

- [ ] `/public/maps/LICENSES.md` lists all map sources with licenses.
- [ ] Attribution text is displayed in app (if required by license).
- [ ] Map registry includes `license` and `attribution` fields.
- [ ] README documents map data sources.
- [ ] No license violations (verified via checklist).
- [ ] All map files have correct license headers/metadata.

## Testing

- [ ] Review: Check all licenses are correctly documented.
- [ ] Manual: Verify attribution appears in app footer/about page.
- [ ] Manual: Cross-check map sources against license requirements.
- [ ] Manual: Verify no commercial-only data is used without proper license.

---

## Recommended Primary Sources

**✅ Natural Earth Data (Public Domain - No attribution required)**
- World: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/
- Europe: https://www.naturalearthdata.com/downloads/50m-cultural-vectors/
- License: Public Domain (CC0-like)
- Attribution: Optional but recommended

**✅ TopoJSON World Atlas (ISC License - Permissive)**
- URL: https://github.com/topojson/world-atlas
- License: ISC (similar to MIT)
- Attribution: Not required but recommended

**⚠️ OpenStreetMap (ODbL License - Attribution required)**
- URL: https://www.openstreetmap.org/
- License: Open Database License (ODbL)
- **Attribution required:** "© OpenStreetMap contributors"
- **Share-alike:** Derivative works must use ODbL

---

## Example LICENSES.md Content

```markdown
# Map Data Sources and Licenses

## Natural Earth Data
- **Source:** https://www.naturalearthdata.com/
- **License:** Public Domain (no copyright)
- **Files:** world-110m.json, europe-50m.json, finland-regions-10m.json
- **Attribution:** Not required (but we credit them anyway)

Natural Earth is a public domain map dataset available at 1:10m, 1:50m, and 1:110 million scales.

## TopoJSON World Atlas
- **Source:** https://github.com/topojson/world-atlas
- **License:** ISC License
- **Files:** countries-110m.json
- **Attribution:** Not required

Copyright (c) 2017-2021 Mike Bostock
```
