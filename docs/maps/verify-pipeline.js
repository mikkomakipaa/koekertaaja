#!/usr/bin/env node
/**
 * Verify map data pipeline
 *
 * Tests that all required files exist, sizes are acceptable,
 * and data is valid TopoJSON.
 *
 * Usage:
 *   node verify-pipeline.js
 */

const fs = require('fs');
const path = require('path');

const TOPOJSON_DIR = path.join(__dirname, '../../public/maps/topojson');
const METADATA_DIR = path.join(__dirname, '../../public/maps/metadata');

// Expected files and their size limits
const EXPECTED_FILES = {
  'world-110m.json': { maxSizeKB: 40, minGeometries: 150 },
  'world-50m.json': { maxSizeKB: 160, minGeometries: 150 },
  'europe-50m.json': { maxSizeKB: 70, minGeometries: 40 },
  'finland-50m.json': { maxSizeKB: 25, minGeometries: 1 },
};

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return parseFloat((stats.size / 1024).toFixed(2));
}

/**
 * Validate TopoJSON structure
 */
function validateTopoJSON(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check required properties
    if (!content.type || content.type !== 'Topology') {
      return { valid: false, error: 'Missing or invalid "type" property' };
    }

    if (!content.objects || typeof content.objects !== 'object') {
      return { valid: false, error: 'Missing "objects" property' };
    }

    if (!content.arcs || !Array.isArray(content.arcs)) {
      return { valid: false, error: 'Missing or invalid "arcs" property' };
    }

    // Extract object keys and count geometries
    const objectKeys = Object.keys(content.objects);
    if (objectKeys.length === 0) {
      return { valid: false, error: 'No objects found in topology' };
    }

    let totalGeometries = 0;
    objectKeys.forEach(key => {
      const obj = content.objects[key];
      if (obj.geometries && Array.isArray(obj.geometries)) {
        totalGeometries += obj.geometries.length;
      }
    });

    return {
      valid: true,
      objectKeys,
      geometryCount: totalGeometries,
      arcCount: content.arcs.length,
      hasTransform: !!content.transform,
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Main verification
 */
function main() {
  console.log('🔍 Map Data Pipeline Verification');
  console.log('==================================\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  // Check directories exist
  console.log('📁 Checking directories...');
  const dirsToCheck = [
    { path: TOPOJSON_DIR, name: 'TopoJSON directory' },
    { path: METADATA_DIR, name: 'Metadata directory' },
  ];

  dirsToCheck.forEach(({ path: dir, name }) => {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ ${name}: ${dir}`);
    } else {
      console.error(`  ❌ ${name} not found: ${dir}`);
      totalErrors++;
    }
  });

  // Check TopoJSON files
  console.log('\n📊 Verifying TopoJSON files...\n');

  const results = [];

  Object.entries(EXPECTED_FILES).forEach(([fileName, { maxSizeKB, minGeometries }]) => {
    const filePath = path.join(TOPOJSON_DIR, fileName);

    console.log(`  → ${fileName}`);

    if (!fs.existsSync(filePath)) {
      console.error(`    ❌ File not found`);
      totalErrors++;
      results.push({ fileName, status: 'MISSING' });
      return;
    }

    // Check file size
    const actualSizeKB = getFileSizeKB(filePath);
    const sizeOk = actualSizeKB <= maxSizeKB;

    if (sizeOk) {
      console.log(`    ✅ Size: ${actualSizeKB} KB (target: < ${maxSizeKB} KB)`);
    } else {
      console.warn(`    ⚠️  Size: ${actualSizeKB} KB exceeds target (${maxSizeKB} KB)`);
      totalWarnings++;
    }

    // Validate TopoJSON
    const validation = validateTopoJSON(filePath);

    if (!validation.valid) {
      console.error(`    ❌ Invalid TopoJSON: ${validation.error}`);
      totalErrors++;
      results.push({ fileName, status: 'INVALID', error: validation.error });
      return;
    }

    // Check geometry count
    const geomOk = validation.geometryCount >= minGeometries;
    if (geomOk) {
      console.log(`    ✅ Geometries: ${validation.geometryCount} (min: ${minGeometries})`);
    } else {
      console.error(`    ❌ Too few geometries: ${validation.geometryCount} (min: ${minGeometries})`);
      totalErrors++;
    }

    // Check transform
    if (validation.hasTransform) {
      console.log(`    ✅ Transform present (quantized)`);
    } else {
      console.warn(`    ⚠️  No transform (coordinates not quantized)`);
      totalWarnings++;
    }

    results.push({
      fileName,
      status: 'OK',
      sizeKB: actualSizeKB,
      geometries: validation.geometryCount,
      arcs: validation.arcCount,
      sizeOk,
      geomOk,
    });
  });

  // Check registry file
  console.log('\n📋 Verifying map registry...');
  const registryPath = path.join(METADATA_DIR, 'map-registry.json');

  if (!fs.existsSync(registryPath)) {
    console.error(`  ❌ Registry file not found: ${registryPath}`);
    totalErrors++;
  } else {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      const registryKeys = Object.keys(registry);

      console.log(`  ✅ Registry file exists`);
      console.log(`  ✅ Contains ${registryKeys.length} maps`);

      // Verify all expected files are in registry
      Object.keys(EXPECTED_FILES).forEach(fileName => {
        const fileId = fileName.replace('.json', '');
        if (registry[fileId]) {
          console.log(`    ✅ ${fileId} registered`);
        } else {
          console.warn(`    ⚠️  ${fileId} missing from registry`);
          totalWarnings++;
        }
      });
    } catch (error) {
      console.error(`  ❌ Invalid registry JSON: ${error.message}`);
      totalErrors++;
    }
  }

  // Check license file
  console.log('\n📄 Verifying documentation...');
  const licensePath = path.join(__dirname, '../../public/maps/LICENSES.md');
  const readmePath = path.join(__dirname, '../../public/maps/README.md');

  [
    { path: licensePath, name: 'LICENSES.md' },
    { path: readmePath, name: 'README.md' },
  ].forEach(({ path: docPath, name }) => {
    if (fs.existsSync(docPath)) {
      console.log(`  ✅ ${name} exists`);
    } else {
      console.warn(`  ⚠️  ${name} not found`);
      totalWarnings++;
    }
  });

  // Summary
  console.log('\n\n📊 Verification Summary');
  console.log('======================\n');

  if (results.length > 0) {
    console.log('File                  Status    Size         Geometries   Arcs');
    console.log('─'.repeat(75));

    results.forEach(result => {
      if (result.status === 'MISSING') {
        console.log(`${result.fileName.padEnd(22)}❌ MISSING`);
      } else if (result.status === 'INVALID') {
        console.log(`${result.fileName.padEnd(22)}❌ INVALID  ${result.error}`);
      } else {
        const sizeIcon = result.sizeOk ? '✅' : '⚠️';
        const geomIcon = result.geomOk ? '✅' : '❌';
        console.log(
          `${result.fileName.padEnd(22)}` +
          `${sizeIcon}       ` +
          `${result.sizeKB.toString().padStart(6)} KB   ` +
          `${geomIcon} ${result.geometries.toString().padStart(6)}    ` +
          `${result.arcs.toString().padStart(6)}`
        );
      }
    });
    console.log('─'.repeat(75));
  }

  // Final status
  console.log('');
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ All checks passed!');
    console.log('🎉 Map data pipeline is ready to use');
    return 0;
  } else {
    if (totalErrors > 0) {
      console.error(`❌ ${totalErrors} error(s) found`);
    }
    if (totalWarnings > 0) {
      console.warn(`⚠️  ${totalWarnings} warning(s) found`);
    }

    if (totalErrors > 0) {
      console.log('\n💡 To fix errors, run: npm run maps:all');
      return 1;
    } else {
      console.log('\n⚠️  Warnings can be ignored for development');
      return 0;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { validateTopoJSON, getFileSizeKB };
