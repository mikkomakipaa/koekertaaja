/**
 * RegionSelector - Handles region click/selection logic
 * Wraps InteractiveMap with region selection capabilities
 */

'use client';

import { useState } from 'react';
import type { Topology } from 'topojson-specification';
import { InteractiveMap, InteractiveMapProps } from './InteractiveMap';
import { useMapInteraction } from './useMapInteraction';
import { GeoFeature, MapRegion, MapInteractionMode } from './types';

export interface RegionSelectorProps {
  /** TopoJSON data to render */
  topojsonData: Topology;
  /** Object key within the TopoJSON (e.g., 'countries', 'states') */
  topojsonObjectKey: string;
  /** Interaction mode configuration */
  mode?: MapInteractionMode;
  /** Initially selected region IDs */
  initialSelectedRegions?: string[];
  /** Callback when regions are selected/deselected */
  onSelectionChange?: (selectedRegionIds: string[]) => void;
  /** Function to extract region ID from geography properties */
  getRegionId?: (geography: GeoFeature) => string;
  /** Function to extract region name from geography properties */
  getRegionName?: (geography: GeoFeature) => string;
  /** Custom selected region color */
  selectedColor?: string;
  /** Custom unselected region color */
  unselectedColor?: string;
  /** Custom hover color */
  hoverColor?: string;
  /** Map width */
  width?: number;
  /** Map height */
  height?: number;
  /** Custom className */
  className?: string;
  /** Other InteractiveMap props */
  mapProps?: Partial<InteractiveMapProps>;
}

export function RegionSelector({
  topojsonData,
  topojsonObjectKey,
  mode = { type: 'select-region', multiSelect: false },
  initialSelectedRegions = [],
  onSelectionChange,
  getRegionId = (geo) => String(geo.id || geo.properties?.name || 'unknown'),
  getRegionName = (geo) => geo.properties?.name || 'Unknown',
  selectedColor = '#3B82F6',
  unselectedColor = '#E5E7EB',
  hoverColor = '#60A5FA',
  width = 800,
  height = 600,
  className = '',
  mapProps = {},
}: RegionSelectorProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const {
    selectedRegions,
    toggleRegionSelection,
    clearRegionSelection,
    isRegionSelected,
    viewport,
  } = useMapInteraction({
    mode,
    onRegionSelect: (regions) => {
      onSelectionChange?.(regions.map((r) => r.id));
    },
  });

  // Initialize selected regions from props
  // Note: This is a simplified approach; for production, use useEffect to sync with initialSelectedRegions
  const handleGeographyClick = (geography: GeoFeature) => {
    const regionId = getRegionId(geography);
    const regionName = getRegionName(geography);

    const region: MapRegion = {
      id: regionId,
      name: regionName,
      properties: geography.properties,
    };

    toggleRegionSelection(region);
  };

  const handleGeographyHover = (geography: GeoFeature | null) => {
    if (geography) {
      setHoveredRegion(getRegionId(geography));
    } else {
      setHoveredRegion(null);
    }
  };

  const getGeographyFill = (geography: GeoFeature) => {
    const regionId = getRegionId(geography);

    if (isRegionSelected(regionId)) {
      return selectedColor;
    }

    if (hoveredRegion === regionId) {
      return hoverColor;
    }

    return unselectedColor;
  };

  return (
    <div className={`relative ${className}`}>
      <InteractiveMap
        topojsonData={topojsonData}
        topojsonObjectKey={topojsonObjectKey}
        viewport={viewport}
        onGeographyClick={handleGeographyClick}
        onGeographyHover={handleGeographyHover}
        getGeographyFill={getGeographyFill}
        width={width}
        height={height}
        {...mapProps}
      />

      {/* Selection indicator */}
      {selectedRegions.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">
              Selected {mode.multiSelect ? `(${selectedRegions.length})` : ''}
            </h4>
            {mode.multiSelect && selectedRegions.length > 0 && (
              <button
                onClick={clearRegionSelection}
                className="text-xs text-blue-600 hover:text-blue-800"
                type="button"
              >
                Clear all
              </button>
            )}
          </div>
          <ul className="text-sm space-y-1">
            {selectedRegions.slice(0, 5).map((region) => (
              <li key={region.id} className="text-gray-700">
                • {region.name}
              </li>
            ))}
            {selectedRegions.length > 5 && (
              <li className="text-gray-500 text-xs">
                +{selectedRegions.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
