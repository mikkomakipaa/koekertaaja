#!/usr/bin/env node
/**
 * Generate map registry metadata file
 *
 * Scans the topojson directory and creates a registry with metadata
 * for each available map file.
 *
 * Usage:
 *   node generate-registry.js
 *
 * Output: public/maps/metadata/map-registry.json
 */

const fs = require('fs');
const path = require('path');

const TOPOJSON_DIR = path.join(__dirname, '../../public/maps/topojson');
const REGISTRY_PATH = path.join(__dirname, '../../public/maps/metadata/map-registry.json');

// Map metadata configuration
const MAP_METADATA = {
  'world-110m.json': {
    name: 'World (Low Resolution)',
    description: 'World map with country boundaries, 1:110 million scale',
    projection: 'naturalEarth1',
    bounds: [[-180, -90], [180, 90]],
    center: [0, 0],
    scale: 1,
    suitableFor: ['world overview', 'continent selection', 'global geography'],
    regions: ['world'],
    resolution: '110m',
    countries: 177,
  },
  'world-50m.json': {
    name: 'World (Medium Resolution)',
    description: 'World map with country boundaries, 1:50 million scale',
    projection: 'naturalEarth1',
    bounds: [[-180, -90], [180, 90]],
    center: [0, 0],
    scale: 1,
    suitableFor: ['detailed world map', 'regional focus', 'country identification'],
    regions: ['world'],
    resolution: '50m',
    countries: 177,
  },
  'europe-50m.json': {
    name: 'Europe (Medium Resolution)',
    description: 'European countries, 1:50 million scale',
    projection: 'mercator',
    bounds: [[-25, 35], [45, 72]],
    center: [10, 54],
    scale: 2.5,
    suitableFor: ['European geography', 'EU studies', 'regional focus'],
    regions: ['europe'],
    resolution: '50m',
    countries: 47,
  },
  'finland-50m.json': {
    name: 'Finland',
    description: 'Finland country boundaries and regions',
    projection: 'mercator',
    bounds: [[19.5, 59.5], [31.5, 70.5]],
    center: [26, 65],
    scale: 8,
    suitableFor: ['Finnish geography', 'local education', 'detailed country view'],
    regions: ['finland', 'nordic'],
    resolution: '50m',
    countries: 1,
  },
};

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return parseFloat((stats.size / 1024).toFixed(2));
}

/**
 * Read TopoJSON and extract metadata
 */
function extractTopoJSONMetadata(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Extract object keys (e.g., "countries", "country")
    const objectKeys = Object.keys(content.objects || {});

    // Count geometries
    let geometryCount = 0;
    if (objectKeys.length > 0) {
      const obj = content.objects[objectKeys[0]];
      geometryCount = obj.geometries ? obj.geometries.length : 0;
    }

    // Extract bounds from transform if available
    let bounds = null;
    if (content.transform && content.transform.scale && content.transform.translate) {
      const [scaleX, scaleY] = content.transform.scale;
      const [translateX, translateY] = content.transform.translate;
      // This is an approximation based on quantization
      bounds = [
        [translateX, translateY],
        [translateX + scaleX * 1e5, translateY + scaleY * 1e5]
      ];
    }

    return {
      objectKeys,
      geometryCount,
      bounds,
      hasTransform: !!content.transform,
      arcs: content.arcs ? content.arcs.length : 0,
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Generate registry
 */
function generateRegistry() {
  console.log('🗺️  Map Registry Generator');
  console.log('===========================\n');

  if (!fs.existsSync(TOPOJSON_DIR)) {
    console.error(`❌ TopoJSON directory not found: ${TOPOJSON_DIR}`);
    console.log('💡 Run "npm run maps:convert" first');
    process.exit(1);
  }

  // Ensure metadata directory exists
  const metadataDir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }

  const files = fs.readdirSync(TOPOJSON_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('.backup'));

  if (files.length === 0) {
    console.error('❌ No TopoJSON files found');
    process.exit(1);
  }

  const registry = {};

  console.log('📊 Processing files...\n');

  files.forEach(file => {
    const filePath = path.join(TOPOJSON_DIR, file);
    const fileId = file.replace('.json', '');

    console.log(`  → ${file}`);

    // Get configured metadata
    const config = MAP_METADATA[file] || {
      name: fileId,
      description: `Map data for ${fileId}`,
      projection: 'mercator',
      bounds: [[-180, -90], [180, 90]],
      center: [0, 0],
      scale: 1,
      suitableFor: ['general use'],
      regions: ['unknown'],
    };

    // Extract file metadata
    const fileSize = getFileSizeKB(filePath);
    const topoMetadata = extractTopoJSONMetadata(filePath);

    // Build registry entry
    registry[fileId] = {
      ...config,
      path: `/maps/topojson/${file}`,
      fileSizeKB: fileSize,
      geometryCount: topoMetadata?.geometryCount || 0,
      objectKeys: topoMetadata?.objectKeys || [],
      lastUpdated: new Date().toISOString(),
    };

    console.log(`    ✓ Size: ${fileSize} KB, Geometries: ${registry[fileId].geometryCount}`);
  });

  // Write registry file
  const registryContent = JSON.stringify(registry, null, 2);
  fs.writeFileSync(REGISTRY_PATH, registryContent);

  console.log('\n✅ Registry generated successfully!');
  console.log(`📁 Registry path: ${REGISTRY_PATH}`);
  console.log(`📊 Total maps: ${Object.keys(registry).length}`);

  // Summary table
  console.log('\n📋 Registry Summary:');
  console.log('─'.repeat(80));
  console.log('ID                    Name                          Size      Geometries');
  console.log('─'.repeat(80));

  Object.entries(registry).forEach(([id, data]) => {
    console.log(
      `${id.padEnd(22)}` +
      `${data.name.padEnd(30)}` +
      `${data.fileSizeKB.toString().padStart(6)} KB  ` +
      `${data.geometryCount.toString().padStart(6)}`
    );
  });
  console.log('─'.repeat(80));
}

// Run if called directly
if (require.main === module) {
  generateRegistry();
}

module.exports = { generateRegistry };
