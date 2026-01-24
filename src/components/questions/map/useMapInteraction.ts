/**
 * Shared hook for map interaction state management
 * Handles zoom, pan, region selection, and pin placement
 */

import { useState, useCallback, useRef } from 'react';
import {
  MapViewport,
  MapInteractionMode,
  SelectedRegion,
  MapPin,
  MapRegion,
} from './types';

interface UseMapInteractionOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  mode?: MapInteractionMode;
  onRegionSelect?: (regions: SelectedRegion[]) => void;
  onPinPlace?: (pins: MapPin[]) => void;
}

export function useMapInteraction({
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 8,
  mode = { type: 'view-only' },
  onRegionSelect,
  onPinPlace,
}: UseMapInteractionOptions = {}) {
  // Viewport state
  const [viewport, setViewport] = useState<MapViewport>({
    zoom: initialZoom,
    center: [0, 0],
    position: { x: 0, y: 0 },
  });

  // Selection state
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, maxZoom),
    }));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, minZoom),
    }));
  }, [minZoom]);

  const resetViewport = useCallback(() => {
    setViewport({
      zoom: initialZoom,
      center: [0, 0],
      position: { x: 0, y: 0 },
    });
  }, [initialZoom]);

  // Pan controls
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (mode.type === 'view-only') {
      setIsDragging(true);
      dragStartRef.current = { x: event.clientX, y: event.clientY };
    }
  }, [mode.type]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging && dragStartRef.current) {
      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;

      setViewport((prev) => ({
        ...prev,
        position: {
          x: prev.position.x + dx,
          y: prev.position.y + dy,
        },
      }));

      dragStartRef.current = { x: event.clientX, y: event.clientY };
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        distance: 0,
      };
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      };
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    if (event.touches.length === 1 && mode.type === 'view-only') {
      const touch = event.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;

      setViewport((prev) => ({
        ...prev,
        position: {
          x: prev.position.x + dx,
          y: prev.position.y + dy,
        },
      }));

      touchStartRef.current = {
        ...touchStartRef.current,
        x: touch.clientX,
        y: touch.clientY,
      };
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / touchStartRef.current.distance;

      setViewport((prev) => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom * scale, minZoom), maxZoom),
      }));

      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      };
    }
  }, [mode.type, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  // Region selection
  const toggleRegionSelection = useCallback(
    (region: MapRegion) => {
      if (mode.type !== 'select-region') return;

      setSelectedRegions((prev) => {
        const isSelected = prev.some((r) => r.id === region.id);

        let newSelection: SelectedRegion[];
        if (isSelected) {
          // Deselect
          newSelection = prev.filter((r) => r.id !== region.id);
        } else {
          // Select
          const newRegion: SelectedRegion = {
            ...region,
            selectedAt: Date.now(),
          };

          if (mode.multiSelect) {
            newSelection = [...prev, newRegion];
          } else {
            newSelection = [newRegion];
          }
        }

        onRegionSelect?.(newSelection);
        return newSelection;
      });
    },
    [mode, onRegionSelect]
  );

  const clearRegionSelection = useCallback(() => {
    setSelectedRegions([]);
    onRegionSelect?.([]);
  }, [onRegionSelect]);

  // Pin placement
  const addPin = useCallback(
    (coordinates: [number, number], label?: string) => {
      if (mode.type !== 'place-pin') return;

      setPins((prev) => {
        const maxPins = mode.maxPins ?? Infinity;
        const newPin: MapPin = {
          id: `pin-${Date.now()}`,
          coordinates,
          label,
        };

        const newPins = [...prev, newPin].slice(-maxPins);
        onPinPlace?.(newPins);
        return newPins;
      });
    },
    [mode, onPinPlace]
  );

  const removePin = useCallback(
    (pinId: string) => {
      setPins((prev) => {
        const newPins = prev.filter((p) => p.id !== pinId);
        onPinPlace?.(newPins);
        return newPins;
      });
    },
    [onPinPlace]
  );

  const clearPins = useCallback(() => {
    setPins([]);
    onPinPlace?.([]);
  }, [onPinPlace]);

  return {
    // Viewport
    viewport,
    setViewport,
    zoomIn,
    zoomOut,
    resetViewport,

    // Mouse/touch handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Region selection
    selectedRegions,
    toggleRegionSelection,
    clearRegionSelection,
    isRegionSelected: (regionId: string) =>
      selectedRegions.some((r) => r.id === regionId),

    // Pin placement
    pins,
    addPin,
    removePin,
    clearPins,

    // State
    isDragging,
  };
}
