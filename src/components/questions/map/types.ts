/**
 * Map component types
 */

import type { Feature, Geometry } from 'geojson';

export interface MapProjection {
  scale: number;
  center: [number, number];
  rotation?: [number, number, number];
}

export interface MapViewport {
  zoom: number;
  center: [number, number];
  position: { x: number; y: number };
}

export interface MapRegion {
  id: string;
  name: string;
  properties?: Record<string, unknown>;
}

export interface SelectedRegion extends MapRegion {
  selectedAt: number;
}

export interface MapPin {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface MapInteractionMode {
  type: 'select-region' | 'place-pin' | 'view-only';
  multiSelect?: boolean; // For region selection
  maxPins?: number; // For pin placement
}

export interface MapControlsConfig {
  showZoom?: boolean;
  showReset?: boolean;
  showFullscreen?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface GeoFeature extends Feature<Geometry> {
  id?: string | number;
  properties: {
    name?: string;
    [key: string]: unknown;
  };
}
