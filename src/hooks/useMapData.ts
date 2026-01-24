/**
 * useMapData - Hook for lazy-loading TopoJSON map data
 * Fetches map data only when needed and caches it in memory
 */

'use client';

import { useState, useEffect } from 'react';
import type { Topology } from 'topojson-specification';

interface UseMapDataResult {
  data: Topology | null;
  isLoading: boolean;
  error: Error | null;
}

// In-memory cache for loaded map data
const mapDataCache = new Map<string, Topology>();

/**
 * Lazy-load TopoJSON map data with caching
 * @param mapUrl - URL to the TopoJSON file (e.g., '/maps/finland.topojson')
 * @returns Object with data, loading state, and error
 */
export function useMapData(mapUrl: string | undefined): UseMapDataResult {
  const [data, setData] = useState<Topology | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!mapUrl) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    if (mapDataCache.has(mapUrl)) {
      setData(mapDataCache.get(mapUrl)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Fetch map data
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(mapUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load map: ${response.status} ${response.statusText}`);
        }
        const json = await response.json();

        if (!cancelled) {
          // Validate basic TopoJSON structure
          if (!json.type || json.type !== 'Topology') {
            throw new Error('Invalid TopoJSON data: missing "type": "Topology"');
          }
          if (!json.objects || typeof json.objects !== 'object') {
            throw new Error('Invalid TopoJSON data: missing "objects" property');
          }

          // Cache and set data
          mapDataCache.set(mapUrl, json);
          setData(json);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err : new Error('Unknown error loading map');
          setError(errorMessage);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mapUrl]);

  return { data, isLoading, error };
}

/**
 * Preload map data into cache (useful for prefetching)
 * @param mapUrl - URL to the TopoJSON file
 */
export async function preloadMapData(mapUrl: string): Promise<void> {
  if (mapDataCache.has(mapUrl)) {
    return; // Already cached
  }

  try {
    const response = await fetch(mapUrl);
    if (!response.ok) {
      throw new Error(`Failed to preload map: ${response.status}`);
    }
    const json = await response.json();

    if (json.type === 'Topology' && json.objects) {
      mapDataCache.set(mapUrl, json);
    }
  } catch (err) {
    console.error('Failed to preload map data:', err);
    // Don't throw - preloading is optional
  }
}

/**
 * Clear map data cache (useful for testing or memory management)
 */
export function clearMapDataCache(): void {
  mapDataCache.clear();
}
