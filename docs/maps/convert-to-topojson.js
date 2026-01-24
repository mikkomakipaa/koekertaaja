#!/usr/bin/env node
/**
 * Convert Natural Earth shapefiles to TopoJSON format
 *
 * Usage:
 *   node convert-to-topojson.js
 *
 * Prerequisites:
 *   npm install -g shapefile topojson-server topojson-simplify topojson-client
 *   OR
 *   npm install --save-dev shapefile topojson-server topojson-simplify topojson-client
 *
 * Input: data/maps/natural-earth/*.shp
 * Output: public/maps/topojson/*.json
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DATA_DIR = path.join(__dirname, '../../data/maps/natural-earth');
const OUTPUT_DIR = path.join(__dirname, '../../public/maps/topojson');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert shapefile to TopoJSON
 */
async function convertShapefileToTopoJSON(shpPath, outputName, options = {}) {
  const { bbox, properties = [], simplify = 0.5 } = options;

  console.log(`\n🔄 Converting ${path.basename(shpPath)} to TopoJSON...`);

  const outputPath = path.join(OUTPUT_DIR, outputName);

  // Build geo2topo command
  // shapefile is used to read .shp, then piped to geo2topo
  let cmd = `shp2json ${shpPath}`;

  // Filter by bounding box if provided
  if (bbox) {
    cmd += ` | ndjson-filter 'd.bbox && d.bbox[0] >= ${bbox[0]} && d.bbox[1] >= ${bbox[1]} && d.bbox[2] <= ${bbox[2]} && d.bbox[3] <= ${bbox[3]}'`;
  }

  // Convert to TopoJSON
  cmd += ` | geo2topo countries=-`;

  // Simplify geometry
  if (simplify > 0) {
    cmd += ` | toposimplify -p ${simplify} -f`;
  }

  // Quantize (compress coordinates)
  cmd += ` | topoquantize 1e5`;

  // Save to file
  cmd += ` > ${outputPath}`;

  try {
    await execAsync(cmd);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Created ${outputName} (${fileSizeKB} KB)`);

    return { outputPath, fileSizeKB };
  } catch (error) {
    console.error(`❌ Error converting ${shpPath}:`, error.message);
    throw error;
  }
}

/**
 * Create Europe subset from world data
 */
async function createEuropeSubset(worldTopoJSONPath, outputName) {
  console.log(`\n🔄 Creating Europe subset from world data...`);

  const outputPath = path.join(OUTPUT_DIR, outputName);

  // Europe bounding box: [lon_min, lat_min, lon_max, lat_max]
  // Roughly: -25°W to 45°E, 35°N to 72°N
  const europeBBox = [-25, 35, 45, 72];

  // Use topo2geo to convert to GeoJSON, filter, then back to TopoJSON
  const cmd = `topo2geo countries=- < ${worldTopoJSONPath} | \
    ndjson-split 'd.features' | \
    ndjson-filter 'd.bbox && ((d.bbox[0] >= ${europeBBox[0]} && d.bbox[0] <= ${europeBBox[2]}) || (d.bbox[2] >= ${europeBBox[0]} && d.bbox[2] <= ${europeBBox[2]})) && ((d.bbox[1] >= ${europeBBox[1]} && d.bbox[1] <= ${europeBBox[3]}) || (d.bbox[3] >= ${europeBBox[1]} && d.bbox[3] <= ${europeBBox[3]}))' | \
    ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' | \
    geo2topo countries=- | \
    toposimplify -p 0.3 -f | \
    topoquantize 1e5 > ${outputPath}`;

  try {
    await execAsync(cmd);

    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Created ${outputName} (${fileSizeKB} KB)`);

    return { outputPath, fileSizeKB };
  } catch (error) {
    console.error(`❌ Error creating Europe subset:`, error.message);
    throw error;
  }
}

/**
 * Create Finland-only file from world data
 */
async function createFinlandSubset(worldTopoJSONPath, outputName) {
  console.log(`\n🔄 Creating Finland subset from world data...`);

  const outputPath = path.join(OUTPUT_DIR, outputName);

  // Filter for Finland (ISO_A2 = FI or NAME = Finland)
  const cmd = `topo2geo countries=- < ${worldTopoJSONPath} | \
    ndjson-split 'd.features' | \
    ndjson-filter 'd.properties.ISO_A2 === "FI" || d.properties.NAME === "Finland"' | \
    ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' | \
    geo2topo country=- | \
    topoquantize 1e5 > ${outputPath}`;

  try {
    await execAsync(cmd);

    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Created ${outputName} (${fileSizeKB} KB)`);

    return { outputPath, fileSizeKB };
  } catch (error) {
    console.error(`❌ Error creating Finland subset:`, error.message);
    throw error;
  }
}

/**
 * Main conversion process
 */
async function main() {
  console.log('🗺️  Natural Earth to TopoJSON Converter');
  console.log('=========================================\n');

  const conversions = [];

  // Convert world-110m (low resolution)
  const world110mShp = path.join(DATA_DIR, 'ne_110m_admin_0_countries/ne_110m_admin_0_countries.shp');
  if (fs.existsSync(world110mShp)) {
    const result = await convertShapefileToTopoJSON(
      world110mShp,
      'world-110m.json',
      { simplify: 0.5 }
    );
    conversions.push({ name: 'world-110m', ...result });
  } else {
    console.warn(`⚠️  Shapefile not found: ${world110mShp}`);
  }

  // Convert world-50m (medium resolution)
  const world50mShp = path.join(DATA_DIR, 'ne_50m_admin_0_countries/ne_50m_admin_0_countries.shp');
  if (fs.existsSync(world50mShp)) {
    const result = await convertShapefileToTopoJSON(
      world50mShp,
      'world-50m.json',
      { simplify: 0.3 }
    );
    conversions.push({ name: 'world-50m', ...result });

    // Create Europe subset from world-50m
    const europeResult = await createEuropeSubset(
      path.join(OUTPUT_DIR, 'world-50m.json'),
      'europe-50m.json'
    );
    conversions.push({ name: 'europe-50m', ...europeResult });

    // Create Finland subset from world-50m
    const finlandResult = await createFinlandSubset(
      path.join(OUTPUT_DIR, 'world-50m.json'),
      'finland-50m.json'
    );
    conversions.push({ name: 'finland-50m', ...finlandResult });
  } else {
    console.warn(`⚠️  Shapefile not found: ${world50mShp}`);
  }

  // Summary
  console.log('\n\n📊 Conversion Summary');
  console.log('=====================\n');
  conversions.forEach(({ name, fileSizeKB }) => {
    console.log(`  ${name.padEnd(20)} ${fileSizeKB.padStart(8)} KB`);
  });

  console.log('\n✅ All conversions complete!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Conversion failed:', error);
    process.exit(1);
  });
}

module.exports = { convertShapefileToTopoJSON, createEuropeSubset, createFinlandSubset };
