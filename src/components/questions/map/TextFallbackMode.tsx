/**
 * TextFallbackMode - Text-based alternative for map questions
 *
 * Provides an accessible alternative to visual map interaction:
 * - Searchable dropdown for region selection
 * - Autocomplete with fuzzy matching
 * - Keyboard navigation
 * - Screen reader friendly
 *
 * Use cases:
 * - Users who cannot interact with visual maps
 * - Screen reader users
 * - Users with motor impairments
 * - Users preferring text-based input
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface TextFallbackRegion {
  id: string;
  name: string;
  aliases?: string[];
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export interface TextFallbackModeProps {
  /** Available regions */
  regions: TextFallbackRegion[];
  /** Currently selected region IDs */
  selectedRegionIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (regionIds: string[]) => void;
  /** Multi-select mode */
  multiSelect?: boolean;
  /** Disabled state (e.g., in explanation mode) */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Show results (correct/incorrect indicators) */
  showResults?: boolean;
  /** Custom label */
  label?: string;
}

/**
 * Fuzzy search matching for region names and aliases
 */
function fuzzyMatch(query: string, text: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Exact match
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // Character sequence match (allows typos)
  let queryIndex = 0;
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === normalizedQuery.length;
}

/**
 * Filter regions based on search query
 */
function filterRegions(regions: TextFallbackRegion[], query: string): TextFallbackRegion[] {
  if (!query.trim()) {
    return regions;
  }

  return regions.filter((region) => {
    // Check main name
    if (fuzzyMatch(query, region.name)) {
      return true;
    }

    // Check aliases
    if (region.aliases?.some((alias) => fuzzyMatch(query, alias))) {
      return true;
    }

    return false;
  });
}

export function TextFallbackMode({
  regions,
  selectedRegionIds,
  onSelectionChange,
  multiSelect = false,
  disabled = false,
  placeholder = 'Hae tai valitse alue...',
  showResults = false,
  label,
}: TextFallbackModeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter regions based on search
  const filteredRegions = useMemo(
    () => filterRegions(regions, searchQuery),
    [regions, searchQuery]
  );

  // Get selected regions
  const selectedRegions = useMemo(
    () => regions.filter((r) => selectedRegionIds.includes(r.id)),
    [regions, selectedRegionIds]
  );

  // Handle region selection
  const handleSelectRegion = (regionId: string) => {
    if (disabled) return;

    if (multiSelect) {
      const isSelected = selectedRegionIds.includes(regionId);
      const newSelection = isSelected
        ? selectedRegionIds.filter((id) => id !== regionId)
        : [...selectedRegionIds, regionId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([regionId]);
      setIsDropdownOpen(false);
      setSearchQuery('');
    }
  };

  // Handle removing a selected region (multi-select)
  const handleRemoveRegion = (regionId: string) => {
    if (disabled) return;
    onSelectionChange(selectedRegionIds.filter((id) => id !== regionId));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredRegions.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (isDropdownOpen && filteredRegions[focusedIndex]) {
          handleSelectRegion(filteredRegions[focusedIndex].id);
          if (!multiSelect) {
            inputRef.current?.blur();
          }
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Reset focused index when filtered results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery]);

  // Scroll focused item into view
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const focusedElement = dropdownRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex, isDropdownOpen]);

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="pl-10 text-base"
            aria-label="Hae alueita"
            aria-expanded={isDropdownOpen}
            aria-autocomplete="list"
            aria-controls="region-listbox"
            role="combobox"
          />
        </div>

        {/* Dropdown */}
        {isDropdownOpen && filteredRegions.length > 0 && (
          <div
            ref={dropdownRef}
            id="region-listbox"
            role="listbox"
            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredRegions.map((region, index) => {
              const isSelected = selectedRegionIds.includes(region.id);
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={region.id}
                  type="button"
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectRegion(region.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors',
                    isFocused && 'bg-blue-50 dark:bg-blue-900',
                    isSelected && 'bg-blue-100 dark:bg-blue-800 font-medium'
                  )}
                >
                  <span>{region.name}</span>
                  {isSelected && (
                    <CheckCircle
                      weight="fill"
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected regions (multi-select) */}
      {multiSelect && selectedRegions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Valitut alueet ({selectedRegions.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((region) => {
              const showCorrect = showResults && region.isCorrect;
              const showWrong = showResults && region.isWrong;

              return (
                <div
                  key={region.id}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2 transition-colors',
                    showCorrect && 'border-green-500 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200',
                    showWrong && 'border-red-500 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200',
                    !showCorrect && !showWrong && 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  )}
                >
                  <span>{region.name}</span>

                  {showCorrect && (
                    <CheckCircle weight="fill" className="w-4 h-4 text-green-600" />
                  )}
                  {showWrong && (
                    <XCircle weight="fill" className="w-4 h-4 text-red-600" />
                  )}

                  {!disabled && !showResults && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRegion(region.id)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                      aria-label={`Poista ${region.name}`}
                    >
                      <XCircle weight="fill" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single selection display */}
      {!multiSelect && selectedRegions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Valittu alue:</p>
          {selectedRegions.map((region) => {
            const showCorrect = showResults && region.isCorrect;
            const showWrong = showResults && region.isWrong;

            return (
              <div
                key={region.id}
                className={cn(
                  'flex items-center justify-between px-4 py-2 rounded-lg border-2',
                  showCorrect && 'border-green-500 bg-green-50 dark:bg-green-900',
                  showWrong && 'border-red-500 bg-red-50 dark:bg-red-900',
                  !showCorrect && !showWrong && 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                )}
              >
                <span className="font-medium">{region.name}</span>
                <div className="flex items-center gap-2">
                  {showCorrect && (
                    <CheckCircle weight="duotone" className="w-5 h-5 text-green-600" />
                  )}
                  {showWrong && (
                    <XCircle weight="duotone" className="w-5 h-5 text-red-600" />
                  )}
                  {!disabled && !showResults && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRegion(region.id)}
                      aria-label={`Poista valinta: ${region.name}`}
                    >
                      Poista
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isDropdownOpen && searchQuery && filteredRegions.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Ei tuloksia haulla &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Instructions */}
      {!disabled && !showResults && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {multiSelect
            ? 'Voit valita useita alueita. Käytä hakukenttää löytääksesi alueet nopeasti.'
            : 'Valitse yksi alue hakukentän avulla.'}
        </p>
      )}
    </div>
  );
}
