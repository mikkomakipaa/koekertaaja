#!/bin/bash
# Download Natural Earth data for map generation
# Source: https://www.naturalearthdata.com/
# License: Public Domain

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../../data/maps/natural-earth"

echo "📥 Downloading Natural Earth data..."
echo "Data directory: $DATA_DIR"

# Create data directory
mkdir -p "$DATA_DIR"

# Download URLs
WORLD_110M_URL="https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip"
WORLD_50M_URL="https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip"
EUROPE_50M_URL="https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip"

# Download world 110m (low resolution, ~1:110 million scale)
echo "⬇️  Downloading world-110m (low resolution)..."
if [ ! -f "$DATA_DIR/ne_110m_admin_0_countries.zip" ]; then
  curl -L -o "$DATA_DIR/ne_110m_admin_0_countries.zip" "$WORLD_110M_URL"
  echo "✅ Downloaded world-110m"
else
  echo "⏭️  world-110m already exists"
fi

# Download world 50m (medium resolution, ~1:50 million scale)
echo "⬇️  Downloading world-50m (medium resolution)..."
if [ ! -f "$DATA_DIR/ne_50m_admin_0_countries.zip" ]; then
  curl -L -o "$DATA_DIR/ne_50m_admin_0_countries.zip" "$WORLD_50M_URL"
  echo "✅ Downloaded world-50m"
else
  echo "⏭️  world-50m already exists"
fi

# Extract files
echo "📦 Extracting files..."
cd "$DATA_DIR"

if [ ! -d "ne_110m_admin_0_countries" ]; then
  unzip -q ne_110m_admin_0_countries.zip -d ne_110m_admin_0_countries
  echo "✅ Extracted world-110m"
fi

if [ ! -d "ne_50m_admin_0_countries" ]; then
  unzip -q ne_50m_admin_0_countries.zip -d ne_50m_admin_0_countries
  echo "✅ Extracted world-50m"
fi

echo ""
echo "✅ All Natural Earth data downloaded and extracted!"
echo ""
echo "Next steps:"
echo "1. Run: npm run maps:convert"
echo "2. Run: npm run maps:optimize"
echo ""
echo "Data location: $DATA_DIR"
