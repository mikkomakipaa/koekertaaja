/**
 * PinPlacer - Pin placement component (basic stub for future)
 * Allows placing markers/pins on the map at specific coordinates
 */

'use client';

import { useState } from 'react';
import { Marker, createCoordinates, type Coordinates } from '@vnedyalk0v/react19-simple-maps';
import type { Topology } from 'topojson-specification';
import { InteractiveMap, InteractiveMapProps } from './InteractiveMap';
import { useMapInteraction } from './useMapInteraction';
import { MapPin, MapInteractionMode } from './types';

export interface PinPlacerProps {
  /** TopoJSON data to render */
  topojsonData: Topology;
  /** Object key within the TopoJSON (e.g., 'countries', 'states') */
  topojsonObjectKey: string;
  /** Interaction mode configuration */
  mode?: MapInteractionMode;
  /** Initially placed pins */
  initialPins?: MapPin[];
  /** Callback when pins are added/removed */
  onPinsChange?: (pins: MapPin[]) => void;
  /** Maximum number of pins allowed */
  maxPins?: number;
  /** Pin color */
  pinColor?: string;
  /** Pin size */
  pinSize?: number;
  /** Map width */
  width?: number;
  /** Map height */
  height?: number;
  /** Custom className */
  className?: string;
  /** Other InteractiveMap props */
  mapProps?: Partial<InteractiveMapProps>;
}

export function PinPlacer({
  topojsonData,
  topojsonObjectKey,
  mode = { type: 'place-pin', maxPins: 5 },
  initialPins = [],
  onPinsChange,
  maxPins = mode.maxPins || 5,
  pinColor = '#EF4444',
  pinSize = 8,
  width = 800,
  height = 600,
  className = '',
  mapProps = {},
}: PinPlacerProps) {
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);

  const { pins, addPin, removePin, clearPins, viewport } = useMapInteraction({
    mode: { ...mode, maxPins },
    onPinPlace: onPinsChange,
  });

  // Note: This is a basic stub implementation
  // Full implementation would require converting click coordinates to geo coordinates
  // This would involve projection math and is planned for future enhancement

  const handleMapClick = () => {
    // TODO: Implement coordinate conversion from pixel to geo coordinates
    // For now, this is a placeholder that would need:
    // 1. Get click coordinates relative to map SVG
    // 2. Convert to projection coordinates using d3-geo
    // 3. Call addPin with calculated [longitude, latitude]
    console.warn('Pin placement requires coordinate conversion - not yet implemented');
  };

  return (
    <div className={`relative ${className}`}>
      <InteractiveMap
        topojsonData={topojsonData}
        topojsonObjectKey={topojsonObjectKey}
        viewport={viewport}
        width={width}
        height={height}
        onGeographyClick={handleMapClick}
        {...mapProps}
      >
        {/* Render existing pins */}
        {pins.map((pin) => {
          const pinCoords = createCoordinates(pin.coordinates[0], pin.coordinates[1]);
          return (
            <Marker key={pin.id} coordinates={pinCoords}>
              <g
                onMouseEnter={() => setHoveredPin(pin.id)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  removePin(pin.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={hoveredPin === pin.id ? pinSize * 1.5 : pinSize}
                  fill={pinColor}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ transition: 'r 0.2s' }}
                />
                {pin.label && (
                  <text
                    textAnchor="middle"
                    y={-pinSize - 5}
                    style={{
                      fontSize: '12px',
                      fill: '#000',
                      fontWeight: 'bold',
                      pointerEvents: 'none',
                    }}
                  >
                    {pin.label}
                  </text>
                )}
              </g>
            </Marker>
          );
        })}
      </InteractiveMap>

      {/* Pin counter and controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold">Pins:</span>{' '}
            <span className={pins.length >= maxPins ? 'text-red-600' : 'text-gray-700'}>
              {pins.length} / {maxPins}
            </span>
          </div>
          {pins.length > 0 && (
            <button
              onClick={clearPins}
              className="text-xs text-blue-600 hover:text-blue-800"
              type="button"
            >
              Clear all
            </button>
          )}
        </div>
        {pins.length >= maxPins && (
          <p className="text-xs text-red-600 mt-2">Maximum pins reached. Click a pin to remove it.</p>
        )}
      </div>

      {/* Instruction overlay */}
      {pins.length === 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 rounded-lg shadow-md p-3 max-w-md">
          <p className="text-sm text-blue-800 text-center">
            Click on the map to place pins (max {maxPins})
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Note: This component is a stub implementation
 *
 * TODO for future enhancement:
 * - Implement coordinate conversion from screen pixels to geo coordinates
 * - Use projection.invert() from d3-geo to convert click position
 * - Handle different map projections correctly
 * - Add drag-to-move functionality for pins
 * - Add pin labels with user input
 * - Store pin metadata (timestamp, user info, etc.)
 * - Add undo/redo functionality
 * - Add snap-to-grid or snap-to-feature functionality
 */
