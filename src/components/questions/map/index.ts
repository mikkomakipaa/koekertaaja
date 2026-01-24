/**
 * Map components barrel export
 */

export { InteractiveMap } from './InteractiveMap';
export type { InteractiveMapProps } from './InteractiveMap';

export { RegionSelector } from './RegionSelector';
export type { RegionSelectorProps } from './RegionSelector';

export { MapControls, MapControlsOverlay } from './MapControls';
export type { MapControlsProps } from './MapControls';

export { PinPlacer } from './PinPlacer';
export type { PinPlacerProps } from './PinPlacer';

export { useMapInteraction } from './useMapInteraction';

export { TextFallbackMode } from './TextFallbackMode';
export type { TextFallbackModeProps, TextFallbackRegion } from './TextFallbackMode';

export {
  useKeyboardNavigation,
  useScreenReaderAnnouncements,
  getRegionAriaLabel,
  getMapAriaDescription,
  getGeographyAccessibilityProps,
  SvgAccessibilityWrapper,
  FocusIndicator,
  LiveRegion,
  SkipMapLink,
} from './MapAccessibility';
export type {
  AccessibleRegion,
  MapAccessibilityProps,
  SvgAccessibilityWrapperProps,
  FocusIndicatorProps,
  LiveRegionProps,
  SkipMapLinkProps,
} from './MapAccessibility';

export type {
  MapProjection,
  MapViewport,
  MapRegion,
  SelectedRegion,
  MapPin,
  MapInteractionMode,
  MapControlsConfig,
  GeoFeature,
} from './types';

// Re-export commonly used types from dependencies
export type { Topology } from 'topojson-specification';
export type { Coordinates } from '@vnedyalk0v/react19-simple-maps';
