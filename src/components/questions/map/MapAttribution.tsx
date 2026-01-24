/**
 * Map Attribution Component
 *
 * Displays proper attribution for map data sources based on license requirements.
 * See /public/maps/LICENSES.md for full license details.
 */

import React from 'react';

interface MapAttributionProps {
  /** Map source identifier (e.g., "natural-earth", "osm", "topojson") */
  source?: 'natural-earth' | 'topojson' | 'osm' | string;
  /** Whether to show attribution even if not required (recommended) */
  alwaysShow?: boolean;
  /** Custom attribution text (overrides default) */
  customText?: string;
  /** CSS class name for styling */
  className?: string;
}

/**
 * Attribution text and requirements for different map sources
 */
const ATTRIBUTION_CONFIG = {
  'natural-earth': {
    text: 'Natural Earth',
    url: 'https://naturalearthdata.com',
    required: false,
    fullText: 'Map data © Natural Earth (Public Domain)',
  },
  'topojson': {
    text: 'TopoJSON World Atlas',
    url: 'https://github.com/topojson/world-atlas',
    required: false,
    fullText: 'Map data: TopoJSON World Atlas',
  },
  'osm': {
    text: '© OpenStreetMap contributors',
    url: 'https://www.openstreetmap.org/copyright',
    required: true, // ODbL license REQUIRES attribution
    fullText: '© OpenStreetMap contributors',
  },
} as const;

/**
 * MapAttribution component - displays map data attribution
 *
 * Usage:
 * ```tsx
 * // Natural Earth (optional attribution)
 * <MapAttribution source="natural-earth" />
 *
 * // OpenStreetMap (required attribution)
 * <MapAttribution source="osm" />
 *
 * // Always show attribution
 * <MapAttribution source="topojson" alwaysShow />
 *
 * // Custom attribution
 * <MapAttribution customText="Custom map source" />
 * ```
 */
export function MapAttribution({
  source = 'natural-earth',
  alwaysShow = true,
  customText,
  className = '',
}: MapAttributionProps) {
  const config = ATTRIBUTION_CONFIG[source as keyof typeof ATTRIBUTION_CONFIG];

  // Don't render if:
  // - Attribution not required AND alwaysShow is false
  // - No config found and no customText
  if ((!config && !customText) || (!config?.required && !alwaysShow && !customText)) {
    return null;
  }

  const attributionText = customText || config?.fullText || '';
  const attributionUrl = config?.url;

  return (
    <div
      className={`text-xs text-gray-600 dark:text-gray-400 ${className}`}
      role="contentinfo"
      aria-label="Map data attribution"
    >
      {attributionUrl ? (
        <a
          href={attributionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {attributionText}
        </a>
      ) : (
        <span>{attributionText}</span>
      )}
    </div>
  );
}

/**
 * Inline attribution for use within map components
 * Positioned absolutely in bottom-right corner
 */
export function InlineMapAttribution({
  source = 'natural-earth',
  alwaysShow = true,
  className = '',
}: Omit<MapAttributionProps, 'customText'>) {
  return (
    <div className={`absolute bottom-2 right-2 z-10 ${className}`}>
      <MapAttribution
        source={source}
        alwaysShow={alwaysShow}
        className="bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm"
      />
    </div>
  );
}

/**
 * Footer attribution for use at bottom of page/section
 */
export function FooterMapAttribution({
  source = 'natural-earth',
  alwaysShow = true,
  className = '',
}: Omit<MapAttributionProps, 'customText'>) {
  return (
    <div className={`mt-4 text-center ${className}`}>
      <MapAttribution source={source} alwaysShow={alwaysShow} />
    </div>
  );
}

/**
 * Get attribution config for a given source
 * Useful for programmatic access to attribution requirements
 */
export function getAttributionConfig(source: string) {
  return ATTRIBUTION_CONFIG[source as keyof typeof ATTRIBUTION_CONFIG] || null;
}

/**
 * Check if attribution is required for a given source
 */
export function isAttributionRequired(source: string): boolean {
  const config = ATTRIBUTION_CONFIG[source as keyof typeof ATTRIBUTION_CONFIG];
  return config?.required ?? false;
}
