/**
 * MapControls - Zoom/pan/reset controls
 * Provides UI controls for map interaction
 */

'use client';

import { MapControlsConfig } from './types';

export interface MapControlsProps {
  /** Callback for zoom in */
  onZoomIn: () => void;
  /** Callback for zoom out */
  onZoomOut: () => void;
  /** Callback for reset view */
  onReset: () => void;
  /** Configuration for which controls to show */
  config?: MapControlsConfig;
  /** Custom className */
  className?: string;
  /** Disable controls */
  disabled?: boolean;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  config = {
    showZoom: true,
    showReset: true,
    showFullscreen: false,
    position: 'top-right',
  },
  className = '',
  disabled = false,
}: MapControlsProps) {
  const { showZoom = true, showReset = true, position = 'top-right' } = config;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const buttonBaseClass = `
    flex items-center justify-center
    w-10 h-10
    bg-white
    border border-gray-300
    rounded-md
    shadow-sm
    hover:bg-gray-50
    active:bg-gray-100
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  `;

  return (
    <div
      className={`absolute ${positionClasses[position]} flex flex-col gap-2 ${className}`}
      role="toolbar"
      aria-label="Map controls"
    >
      {showZoom && (
        <div className="flex flex-col gap-1 bg-white rounded-md shadow-md p-1">
          <button
            onClick={onZoomIn}
            disabled={disabled}
            className={buttonBaseClass}
            aria-label="Zoom in"
            type="button"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <div className="h-px bg-gray-200" />

          <button
            onClick={onZoomOut}
            disabled={disabled}
            className={buttonBaseClass}
            aria-label="Zoom out"
            type="button"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
      )}

      {showReset && (
        <button
          onClick={onReset}
          disabled={disabled}
          className={`${buttonBaseClass} bg-white shadow-md`}
          aria-label="Reset view"
          type="button"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * MapControlsOverlay - Alternative layout with horizontal controls
 */
export function MapControlsOverlay({
  onZoomIn,
  onZoomOut,
  onReset,
  disabled = false,
  className = '',
}: Omit<MapControlsProps, 'config'>) {
  const buttonClass = `
    px-4 py-2
    bg-white
    border border-gray-300
    hover:bg-gray-50
    active:bg-gray-100
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    text-sm font-medium text-gray-700
  `;

  return (
    <div
      className={`flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 ${className}`}
      role="toolbar"
      aria-label="Map controls"
    >
      <button
        onClick={onZoomIn}
        disabled={disabled}
        className={`${buttonClass} rounded-l-md`}
        aria-label="Zoom in"
        type="button"
      >
        Zoom In
      </button>

      <button
        onClick={onZoomOut}
        disabled={disabled}
        className={buttonClass}
        aria-label="Zoom out"
        type="button"
      >
        Zoom Out
      </button>

      <button
        onClick={onReset}
        disabled={disabled}
        className={`${buttonClass} rounded-r-md`}
        aria-label="Reset view"
        type="button"
      >
        Reset
      </button>
    </div>
  );
}
