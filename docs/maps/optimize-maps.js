#!/usr/bin/env node
/**
 * Optimize TopoJSON files for production use
 *
 * Optimization strategies:
 * - Geometry simplification (reduce coordinate precision)
 * - Property filtering (remove unnecessary metadata)
 * - Quantization (compress coordinate values)
 * - Minification (remove whitespace)
 *
 * Usage:
 *   node optimize-maps.js
 *   node optimize-maps.js --target=world-110m.json
 *   node optimize-maps.js --max-size=35
 *
 * Prerequisites:
 *   npm install --save-dev topojson-simplify topojson-client
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const TOPOJSON_DIR = path.join(__dirname, '../../public/maps/topojson');

// Optimization targets (max file size in KB)
const OPTIMIZATION_TARGETS = {
  'world-110m.json': 35,
  'world-50m.json': 150,
  'europe-50m.json': 60,
  'finland-50m.json': 20,
};

// Properties to keep (remove all others to reduce file size)
const KEEP_PROPERTIES = [
  'NAME',           // Country name
  'NAME_LONG',      // Full country name
  'ISO_A2',         // 2-letter country code
  'ISO_A3',         // 3-letter country code
  'CONTINENT',      // Continent name
  'REGION_UN',      // UN region
  'SUBREGION',      // Subregion
  'POP_EST',        // Population estimate
  'GDP_MD_EST',     // GDP estimate
];

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Optimize a single TopoJSON file
 */
async function optimizeTopoJSON(inputPath, options = {}) {
  const {
    simplification = 0.5,
    quantization = 1e5,
    filterProperties = true,
    targetSizeKB = null,
  } = options;

  const fileName = path.basename(inputPath);
  const backupPath = inputPath.replace('.json', '.backup.json');
  const tempPath = inputPath.replace('.json', '.temp.json');

  console.log(`\n🔧 Optimizing ${fileName}...`);

  // Create backup
  fs.copyFileSync(inputPath, backupPath);
  const originalSizeKB = getFileSizeKB(inputPath);
  console.log(`   Original size: ${originalSizeKB} KB`);

  try {
    // Read TopoJSON
    const topoJSON = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    // 1. Filter properties if enabled
    if (filterProperties) {
      console.log('   → Filtering properties...');
      const objects = topoJSON.objects;
      for (const key in objects) {
        if (objects[key].geometries) {
          objects[key].geometries = objects[key].geometries.map(geom => {
            if (geom.properties) {
              const filteredProps = {};
              KEEP_PROPERTIES.forEach(prop => {
                if (geom.properties[prop] !== undefined) {
                  filteredProps[prop] = geom.properties[prop];
                }
              });
              geom.properties = filteredProps;
            }
            return geom;
          });
        }
      }
    }

    // Write intermediate result
    fs.writeFileSync(tempPath, JSON.stringify(topoJSON));

    // 2. Simplify geometry using toposimplify
    console.log(`   → Simplifying geometry (p=${simplification})...`);
    await execAsync(`toposimplify -p ${simplification} -f < ${tempPath} > ${inputPath}`);

    // 3. Quantize coordinates
    console.log(`   → Quantizing coordinates (${quantization})...`);
    await execAsync(`topoquantize ${quantization} < ${inputPath} > ${tempPath}`);
    fs.renameSync(tempPath, inputPath);

    // Check final size
    const optimizedSizeKB = getFileSizeKB(inputPath);
    const reduction = ((1 - optimizedSizeKB / originalSizeKB) * 100).toFixed(1);

    console.log(`   ✅ Optimized size: ${optimizedSizeKB} KB (${reduction}% reduction)`);

    // Check if target size is met
    if (targetSizeKB && parseFloat(optimizedSizeKB) > targetSizeKB) {
      console.warn(`   ⚠️  File size (${optimizedSizeKB} KB) exceeds target (${targetSizeKB} KB)`);
      console.warn(`   💡 Tip: Increase simplification factor or reduce quantization`);
    } else if (targetSizeKB) {
      console.log(`   ✅ Target size met (${targetSizeKB} KB)`);
    }

    // Clean up backup
    fs.unlinkSync(backupPath);

    return {
      fileName,
      originalSizeKB: parseFloat(originalSizeKB),
      optimizedSizeKB: parseFloat(optimizedSizeKB),
      reduction: parseFloat(reduction),
      targetMet: targetSizeKB ? parseFloat(optimizedSizeKB) <= targetSizeKB : null,
    };

  } catch (error) {
    console.error(`   ❌ Optimization failed: ${error.message}`);

    // Restore from backup
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, inputPath);
      fs.unlinkSync(backupPath);
      console.log('   ↩️  Restored from backup');
    }

    throw error;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * Main optimization process
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let targetFile = null;
  let maxSize = null;

  args.forEach(arg => {
    if (arg.startsWith('--target=')) {
      targetFile = arg.split('=')[1];
    } else if (arg.startsWith('--max-size=')) {
      maxSize = parseFloat(arg.split('=')[1]);
    }
  });

  console.log('🗺️  TopoJSON Map Optimizer');
  console.log('===========================\n');

  if (!fs.existsSync(TOPOJSON_DIR)) {
    console.error(`❌ TopoJSON directory not found: ${TOPOJSON_DIR}`);
    console.log('💡 Run "npm run maps:convert" first');
    process.exit(1);
  }

  const files = targetFile
    ? [targetFile]
    : fs.readdirSync(TOPOJSON_DIR).filter(f => f.endsWith('.json') && !f.includes('.backup'));

  if (files.length === 0) {
    console.error('❌ No TopoJSON files found to optimize');
    process.exit(1);
  }

  const results = [];

  for (const file of files) {
    const filePath = path.join(TOPOJSON_DIR, file);
    const targetSizeKB = maxSize || OPTIMIZATION_TARGETS[file] || null;

    // Adjust simplification based on file
    let simplification = 0.5;
    if (file.includes('110m')) {
      simplification = 0.6; // More aggressive for low-res
    } else if (file.includes('50m')) {
      simplification = 0.4; // Less aggressive for medium-res
    }

    try {
      const result = await optimizeTopoJSON(filePath, {
        simplification,
        quantization: 1e5,
        filterProperties: true,
        targetSizeKB,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to optimize ${file}`);
    }
  }

  // Summary
  console.log('\n\n📊 Optimization Summary');
  console.log('=======================\n');
  console.log('File                    Original    Optimized   Reduction   Target');
  console.log('─'.repeat(75));

  results.forEach(({ fileName, originalSizeKB, optimizedSizeKB, reduction, targetMet }) => {
    const target = OPTIMIZATION_TARGETS[fileName];
    const targetStr = target ? `${target} KB` : 'N/A';
    const statusIcon = targetMet === null ? '  ' : targetMet ? '✅' : '⚠️';

    console.log(
      `${fileName.padEnd(24)}` +
      `${originalSizeKB.toFixed(2).padStart(8)} KB  ` +
      `${optimizedSizeKB.toFixed(2).padStart(8)} KB  ` +
      `${reduction.toFixed(1).padStart(6)}%  ` +
      `${targetStr.padEnd(10)} ${statusIcon}`
    );
  });

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSizeKB, 0);
  const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSizeKB, 0);
  const totalReduction = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);

  console.log('─'.repeat(75));
  console.log(
    `${'TOTAL'.padEnd(24)}` +
    `${totalOriginal.toFixed(2).padStart(8)} KB  ` +
    `${totalOptimized.toFixed(2).padStart(8)} KB  ` +
    `${totalReduction.padStart(6)}%`
  );

  console.log('\n✅ Optimization complete!');
  console.log(`📁 Output directory: ${TOPOJSON_DIR}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = { optimizeTopoJSON, getFileSizeKB };
