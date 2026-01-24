/**
 * LazyInteractiveMap - Lazy-loaded wrapper for InteractiveMap
 * Reduces initial bundle size by code-splitting map dependencies
 */

'use client';

import { lazy, Suspense } from 'react';
import type { InteractiveMapProps } from './InteractiveMap';

// Lazy load the InteractiveMap component
const InteractiveMapComponent = lazy(() =>
  import('./InteractiveMap').then((mod) => ({ default: mod.InteractiveMap }))
);

/**
 * Loading skeleton for map
 */
function MapLoadingSkeleton({ width = 800, height = 600 }: { width?: number; height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
      style={{ width, height }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Ladataan karttakomponenttia...</p>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded InteractiveMap wrapper
 * Use this instead of importing InteractiveMap directly to enable code-splitting
 */
export function LazyInteractiveMap(props: InteractiveMapProps) {
  return (
    <Suspense fallback={<MapLoadingSkeleton width={props.width} height={props.height} />}>
      <InteractiveMapComponent {...props} />
    </Suspense>
  );
}
