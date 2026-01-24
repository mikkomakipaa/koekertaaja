/**
 * InteractiveMap - Base map renderer with projection support
 * Renders TopoJSON maps using react-simple-maps with configurable projections
 */

'use client';

import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  createCoordinates,
  type Coordinates,
} from '@vnedyalk0v/react19-simple-maps';
import type { GeoProjection } from 'd3-geo';
import { geoMercator, geoOrthographic, geoEqualEarth } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection } from 'geojson';
import { GeoFeature, MapViewport } from './types';

export interface InteractiveMapProps {
  /** TopoJSON data to render */
  topojsonData: Topology;
  /** Object key within the TopoJSON (e.g., 'countries', 'states') */
  topojsonObjectKey: string;
  /** Projection type */
  projection?: 'mercator' | 'orthographic' | 'equalEarth';
  /** Viewport state */
  viewport?: MapViewport;
  /** Callback when geography is clicked */
  onGeographyClick?: (geography: GeoFeature) => void;
  /** Callback when geography is hovered */
  onGeographyHover?: (geography: GeoFeature | null) => void;
  /** Custom geography fill color function */
  getGeographyFill?: (geography: GeoFeature) => string;
  /** Custom geography stroke color */
  getGeographyStroke?: (geography: GeoFeature) => string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Custom className for styling */
  className?: string;
  /** Show graticule grid lines */
  showGraticule?: boolean;
  /** Children components (e.g., Markers, Annotations) */
  children?: React.ReactNode;
  /** Currently focused geography index (for keyboard navigation) */
  focusedGeographyIndex?: number;
  /** Function to get region ID from geography */
  getRegionId?: (geography: GeoFeature) => string;
  /** Function to get region name for ARIA labels */
  getRegionName?: (geography: GeoFeature) => string;
  /** Whether regions are selectable */
  isInteractive?: boolean;
  /** Accessible title for the map */
  ariaLabel?: string;
  /** Accessible description for the map */
  ariaDescription?: string;
}

const projectionMap: Record<string, () => GeoProjection> = {
  mercator: geoMercator,
  orthographic: geoOrthographic,
  equalEarth: geoEqualEarth,
};

export function InteractiveMap({
  topojsonData,
  topojsonObjectKey,
  projection = 'mercator',
  viewport = { zoom: 1, center: [0, 0], position: { x: 0, y: 0 } },
  onGeographyClick,
  onGeographyHover,
  getGeographyFill = () => '#D6D6DA',
  getGeographyStroke = () => '#FFFFFF',
  width = 800,
  height = 600,
  className = '',
  showGraticule = false,
  children,
  focusedGeographyIndex = -1,
  getRegionId = (geo) => String(geo.id || geo.properties?.name || 'unknown'),
  getRegionName = (geo) => geo.properties?.name || 'Unknown region',
  isInteractive = true,
  ariaLabel = 'Interactive map',
  ariaDescription,
}: InteractiveMapProps) {
  // Check if topojson object exists
  if (!topojsonData.objects[topojsonObjectKey]) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width, height }}>
        <p className="text-gray-500">Map data not available for key: {topojsonObjectKey}</p>
      </div>
    );
  }

  const projectionFn = projectionMap[projection]();

  const centerCoords = createCoordinates(viewport.center[0], viewport.center[1]);

  const titleId = `map-title-${Math.random().toString(36).substr(2, 9)}`;
  const descId = ariaDescription ? `map-desc-${Math.random().toString(36).substr(2, 9)}` : undefined;

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative', touchAction: 'none' }}
      role="group"
      aria-label={ariaLabel}
    >
      <ComposableMap
        projection={projectionFn}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-labelledby={`${titleId}${descId ? ` ${descId}` : ''}`}
      >
        <title id={titleId}>{ariaLabel}</title>
        {ariaDescription && <desc id={descId}>{ariaDescription}</desc>}

        <ZoomableGroup
          zoom={viewport.zoom}
          center={centerCoords}
          maxZoom={8}
          minZoom={1}
        >
          <Geographies geography={topojsonData}>
            {({ geographies }) =>
              geographies.map((geo, index) => {
                const geoFeature = geo as GeoFeature;
                const isFocused = focusedGeographyIndex === index;
                const regionName = getRegionName(geoFeature);

                return (
                  <Geography
                    key={geoFeature.id || `geo-${Math.random()}`}
                    geography={geoFeature}
                    onClick={() => isInteractive && onGeographyClick?.(geoFeature)}
                    onMouseEnter={() => onGeographyHover?.(geoFeature)}
                    onMouseLeave={() => onGeographyHover?.(null)}
                    tabIndex={isInteractive && isFocused ? 0 : -1}
                    role={isInteractive ? 'button' : undefined}
                    aria-label={isInteractive ? regionName : undefined}
                    style={{
                      default: {
                        fill: getGeographyFill(geoFeature),
                        stroke: getGeographyStroke(geoFeature),
                        strokeWidth: 0.5,
                        outline: isFocused ? '3px solid #2563eb' : 'none',
                        outlineOffset: '2px',
                      },
                      hover: {
                        fill: '#F53',
                        stroke: getGeographyStroke(geoFeature),
                        strokeWidth: 0.5,
                        outline: isFocused ? '3px solid #2563eb' : 'none',
                        outlineOffset: '2px',
                        cursor: onGeographyClick && isInteractive ? 'pointer' : 'default',
                      },
                      pressed: {
                        fill: '#E42',
                        stroke: getGeographyStroke(geoFeature),
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {children}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
