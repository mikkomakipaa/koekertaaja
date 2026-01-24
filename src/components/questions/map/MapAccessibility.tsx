/**
 * MapAccessibility - Keyboard navigation and screen reader support for map components
 *
 * Features:
 * - Keyboard navigation (Tab, Arrow keys, Enter, Space, Escape)
 * - ARIA labels and roles for screen readers
 * - Focus management and indicators
 * - High-contrast mode support
 *
 * WCAG 2.1 AA Compliance:
 * - All interactive elements keyboard accessible
 * - Screen reader announcements for state changes
 * - Visible focus indicators
 * - Proper ARIA roles and labels
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GeoFeature } from './types';

export interface AccessibleRegion {
  id: string;
  name: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export interface MapAccessibilityProps {
  /** List of selectable regions */
  regions: AccessibleRegion[];
  /** Currently focused region index */
  focusedIndex: number;
  /** Callback when focus changes */
  onFocusChange: (index: number) => void;
  /** Callback when region is selected (Enter/Space) */
  onRegionSelect: (regionId: string) => void;
  /** Whether the map is in explanation/review mode (disabled) */
  disabled?: boolean;
  /** Multi-select mode */
  multiSelect?: boolean;
  /** Custom ARIA label for the map */
  ariaLabel?: string;
}

/**
 * Hook for keyboard navigation of map regions
 */
export function useKeyboardNavigation({
  regions,
  focusedIndex,
  onFocusChange,
  onRegionSelect,
  disabled,
  multiSelect,
}: Omit<MapAccessibilityProps, 'ariaLabel'>) {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      const totalRegions = regions.length;
      if (totalRegions === 0) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          onFocusChange((focusedIndex + 1) % totalRegions);
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          onFocusChange((focusedIndex - 1 + totalRegions) % totalRegions);
          break;

        case 'Home':
          event.preventDefault();
          onFocusChange(0);
          break;

        case 'End':
          event.preventDefault();
          onFocusChange(totalRegions - 1);
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (regions[focusedIndex]) {
            onRegionSelect(regions[focusedIndex].id);
          }
          break;

        case 'Escape':
          event.preventDefault();
          // Clear selection (handled by parent component)
          break;

        default:
          // Allow alphanumeric keys for quick navigation
          if (event.key.length === 1 && /[a-zA-Z0-9]/.test(event.key)) {
            const key = event.key.toLowerCase();
            const matchIndex = regions.findIndex((r) =>
              r.name.toLowerCase().startsWith(key)
            );
            if (matchIndex !== -1) {
              event.preventDefault();
              onFocusChange(matchIndex);
            }
          }
          break;
      }
    },
    [disabled, regions, focusedIndex, onFocusChange, onRegionSelect]
  );

  return { handleKeyDown };
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReaderAnnouncements() {
  const [announcement, setAnnouncement] = useState('');
  const announcementTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);

    // Clear announcement after 1 second to allow re-announcements
    if (announcementTimeoutRef.current) {
      clearTimeout(announcementTimeoutRef.current);
    }
    announcementTimeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  return { announcement, announce };
}

/**
 * Generate ARIA label for a region
 */
export function getRegionAriaLabel(region: AccessibleRegion, multiSelect: boolean): string {
  const parts = [region.name];

  if (region.isSelected) {
    parts.push('selected');
  }

  if (region.isCorrect) {
    parts.push('correct answer');
  } else if (region.isWrong) {
    parts.push('incorrect');
  }

  // Add instruction hint
  if (!region.isCorrect && !region.isWrong) {
    parts.push(multiSelect ? 'press Enter or Space to toggle selection' : 'press Enter or Space to select');
  }

  return parts.join(', ');
}

/**
 * Generate ARIA description for map controls
 */
export function getMapAriaDescription(multiSelect: boolean, selectedCount: number): string {
  if (multiSelect) {
    return `Interactive map with ${selectedCount} region${selectedCount !== 1 ? 's' : ''} selected. Use arrow keys to navigate between regions. Press Enter or Space to toggle selection. Press Escape to clear all selections.`;
  }
  return 'Interactive map. Use arrow keys to navigate between regions. Press Enter or Space to select a region.';
}

/**
 * SVG accessibility wrapper component
 * Adds necessary ARIA attributes to SVG maps
 */
export interface SvgAccessibilityWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  role?: 'img' | 'application';
}

export function SvgAccessibilityWrapper({
  children,
  title,
  description,
  role = 'application',
}: SvgAccessibilityWrapperProps) {
  const titleId = `map-title-${Math.random().toString(36).substring(2, 11)}`;
  const descId = description ? `map-desc-${Math.random().toString(36).substring(2, 11)}` : undefined;

  return (
    <svg
      role={role}
      aria-labelledby={`${titleId}${descId ? ` ${descId}` : ''}`}
      focusable="false"
    >
      <title id={titleId}>{title}</title>
      {description && <desc id={descId}>{description}</desc>}
      {children}
    </svg>
  );
}

/**
 * Focus indicator component for map regions
 */
export interface FocusIndicatorProps {
  /** Whether this region is focused */
  isFocused: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function FocusIndicator({ isFocused, className = '' }: FocusIndicatorProps) {
  if (!isFocused) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        outline: '3px solid var(--focus-color, #2563eb)',
        outlineOffset: '2px',
        borderRadius: '4px',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Live region for screen reader announcements
 */
export interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
}

export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Skip link for keyboard users to bypass map navigation
 */
export interface SkipMapLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Link text */
  children?: React.ReactNode;
}

export function SkipMapLink({ targetId, children = 'Skip map navigation' }: SkipMapLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

/**
 * Utility to add ARIA attributes to SVG Geography elements
 */
export function getGeographyAccessibilityProps(
  region: AccessibleRegion,
  isFocused: boolean,
  multiSelect: boolean,
  onClick?: () => void
): {
  role: string;
  tabIndex: number;
  'aria-label': string;
  'aria-pressed': boolean | undefined;
  'aria-current': boolean | undefined;
  'aria-describedby'?: string;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
} {
  return {
    role: 'button',
    tabIndex: isFocused ? 0 : -1,
    'aria-label': getRegionAriaLabel(region, multiSelect),
    'aria-pressed': multiSelect ? region.isSelected : undefined,
    'aria-current': !multiSelect && region.isSelected ? true : undefined,
    onClick,
    style: {
      outline: isFocused ? '3px solid #2563eb' : 'none',
      outlineOffset: '2px',
    },
  };
}
