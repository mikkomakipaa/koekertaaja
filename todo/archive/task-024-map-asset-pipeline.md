# Task: Map asset pipeline - Data sourcing, conversion, and optimization

## Context

- Map questions require optimized geographic data files (TopoJSON/GeoJSON/SVG).
- Raw data from sources like Natural Earth needs conversion and optimization.
- Assets must be stored in `/public/maps/` with proper caching strategy.
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`
- Related files: N/A (new pipeline)

## Scope

- In scope:
  - Download and convert Natural Earth data to TopoJSON format.
  - Create optimization scripts for reducing file sizes.
  - Set up asset directory structure (`/public/maps/topojson/`, `/public/maps/geojson/`).
  - Create map registry JSON for indexing available maps.
  - Document licensing and attribution requirements.
- Out of scope:
  - UI components or rendering logic.
  - Real-time map data updates.

## Changes

- [ ] Create `/scripts/maps/download-natural-earth.sh` to fetch source data.
- [ ] Create `/scripts/maps/convert-to-topojson.js` for data conversion.
- [ ] Create `/scripts/maps/optimize-maps.js` for geometry simplification.
- [ ] Set up `/public/maps/` directory structure with README.
- [ ] Create `/public/maps/metadata/map-registry.json` index file.
- [ ] Document attribution requirements in `/public/maps/LICENSES.md`.

## Acceptance Criteria

- [ ] TopoJSON files for world, Europe, Finland are available in `/public/maps/topojson/`.
- [ ] Map registry JSON lists all available maps with metadata (projection, bounds, file size).
- [ ] Files are optimized: world-110m.json < 35KB, europe-50m.json < 60KB.
- [ ] Attribution and licensing documented properly.
- [ ] Scripts are documented with usage examples.

## Testing

- [ ] Manual: Run conversion scripts and verify output files.
- [ ] Manual: Load TopoJSON in browser and verify rendering.
- [ ] Verify file sizes meet optimization targets.
- [ ] Check licenses are correctly attributed.
