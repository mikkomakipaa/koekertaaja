import { MapQuestion as MapQuestionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ListBullets, MapTrifold } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TextFallbackMode, type TextFallbackRegion } from './map/TextFallbackMode';
import {
  useKeyboardNavigation,
  useScreenReaderAnnouncements,
  getMapAriaDescription,
  LiveRegion,
  type AccessibleRegion,
} from './map/MapAccessibility';
import { MapErrorBoundary } from './map/MapErrorBoundary';
import { useMapData } from '@/hooks/useMapData';
import { FooterMapAttribution } from './map/MapAttribution';

interface MapQuestionProps {
  question: MapQuestionType;
  userAnswer: string | string[] | null;
  showExplanation: boolean;
  onAnswerChange: (answer: string | string[]) => void;
}

function getRegionLabel(question: MapQuestionType, regionId: string) {
  return question.options.regions.find((region) => region.id === regionId)?.label ?? regionId;
}

function normalizeIdList(value: string | string[] | null) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function MapQuestion({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: MapQuestionProps) {
  const { mapAsset, regions, inputMode } = question.options;
  const selectedRegions = normalizeIdList(userAnswer);
  const correctRegions = normalizeIdList(question.correct_answer as string | string[]);

  // Text fallback mode toggle
  const [useTextMode, setUseTextMode] = useState(false);

  // Keyboard navigation state
  const [focusedRegionIndex, setFocusedRegionIndex] = useState(0);

  // Screen reader announcements
  const { announcement, announce } = useScreenReaderAnnouncements();

  // Lazy-load map data if mapAsset is a TopoJSON URL
  const isTopoJsonMap = mapAsset?.endsWith('.topojson') || mapAsset?.endsWith('.json');
  const { data: mapData, isLoading: mapLoading, error: mapError } = useMapData(isTopoJsonMap ? mapAsset : undefined);

  if (!mapAsset || !regions || regions.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Virhe: Karttakysymyksestä puuttuu kartta tai alueet.</p>
      </div>
    );
  }

  const isMultiSelect = inputMode === 'multi_region';

  // Convert regions to accessible format
  const accessibleRegions: AccessibleRegion[] = regions.map((region) => ({
    id: region.id,
    name: region.label,
    isSelected: selectedRegions.includes(region.id),
    isCorrect: showExplanation ? correctRegions.includes(region.id) : undefined,
    isWrong: showExplanation && selectedRegions.includes(region.id) && !correctRegions.includes(region.id) ? true : undefined,
  }));

  const handleToggleRegion = (regionId: string) => {
    if (showExplanation) {
      return;
    }

    const region = regions.find((r) => r.id === regionId);
    if (!region) return;

    if (inputMode === 'single_region') {
      onAnswerChange(regionId);
      announce(`Valittu alue: ${region.label}`);
      return;
    }

    if (inputMode === 'multi_region') {
      const isSelected = selectedRegions.includes(regionId);
      const nextSelection = isSelected
        ? selectedRegions.filter((id) => id !== regionId)
        : [...selectedRegions, regionId];
      onAnswerChange(nextSelection);

      const action = isSelected ? 'poistettu valinnasta' : 'valittu';
      announce(`${region.label} ${action}. ${nextSelection.length} aluetta valittuna.`);
    }
  };

  // Keyboard navigation
  const { handleKeyDown } = useKeyboardNavigation({
    regions: accessibleRegions,
    focusedIndex: focusedRegionIndex,
    onFocusChange: setFocusedRegionIndex,
    onRegionSelect: handleToggleRegion,
    disabled: showExplanation,
    multiSelect: isMultiSelect,
  });

  const renderRegionButton = (regionId: string, label: string, index: number) => {
    const isSelected = selectedRegions.includes(regionId);
    const isCorrect = correctRegions.includes(regionId);
    const showCorrect = showExplanation && isCorrect;
    const showWrong = showExplanation && isSelected && !isCorrect;
    const isFocused = focusedRegionIndex === index;

    return (
      <Button
        key={regionId}
        type="button"
        variant="outline"
        onClick={() => handleToggleRegion(regionId)}
        disabled={showExplanation}
        aria-pressed={isMultiSelect ? isSelected : undefined}
        aria-current={!isMultiSelect && isSelected ? 'true' : undefined}
        aria-label={`${label}${isSelected ? ', valittu' : ''}${showCorrect ? ', oikea vastaus' : ''}${showWrong ? ', väärin' : ''}`}
        onFocus={() => setFocusedRegionIndex(index)}
        className={cn(
          "h-auto min-h-[48px] whitespace-normal px-4 py-3 text-left text-sm md:text-base rounded-xl border-2 transition-all",
          showCorrect && "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400",
          showWrong && "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400",
          !showCorrect && !showWrong && isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400",
          !showCorrect && !showWrong && !isSelected && "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900",
          isFocused && "ring-2 ring-blue-500 ring-offset-2"
        )}
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span>{label}</span>
          {showCorrect && <CheckCircle weight="duotone" className="w-5 h-5 text-green-600 flex-shrink-0" />}
          {showWrong && <XCircle weight="duotone" className="w-5 h-5 text-red-600 flex-shrink-0" />}
        </span>
      </Button>
    );
  };

  // Text fallback regions
  const textFallbackRegions: TextFallbackRegion[] = regions.map((region) => ({
    id: region.id,
    name: region.label,
    aliases: region.aliases,
    isSelected: selectedRegions.includes(region.id),
    isCorrect: showExplanation ? correctRegions.includes(region.id) : undefined,
    isWrong: showExplanation && selectedRegions.includes(region.id) && !correctRegions.includes(region.id) ? true : undefined,
  }));

  return (
    <MapErrorBoundary>
      <div className="space-y-4" onKeyDown={!useTextMode ? handleKeyDown : undefined}>
        {/* Live region for screen reader announcements */}
        <LiveRegion message={announcement} />

        {/* Accessibility mode toggle */}
        {inputMode !== 'text' && (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUseTextMode(!useTextMode)}
              className="text-xs"
              aria-label={useTextMode ? 'Vaihda karttanäkymään' : 'Vaihda tekstinäkymään'}
            >
              {useTextMode ? (
                <>
                  <MapTrifold className="w-4 h-4 mr-1" />
                  Näytä kartta
                </>
              ) : (
                <>
                  <ListBullets className="w-4 h-4 mr-1" />
                  Tekstivalinta
                </>
              )}
            </Button>
          </div>
        )}

        {/* Map view or text fallback */}
        {!useTextMode && inputMode !== 'text' ? (
          <>
            {mapLoading ? (
              <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Ladataan karttadataa...</p>
                </div>
              </div>
            ) : mapError ? (
              <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
                <p className="text-red-900 dark:text-red-200 font-medium mb-2">Karttadatan lataaminen epäonnistui</p>
                <p className="text-sm text-red-700 dark:text-red-300">{mapError.message}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
                <img
                  src={mapAsset}
                  alt={isMultiSelect ? 'Kartta, valitse kaikki sopivat alueet' : 'Kartta, valitse oikea alue'}
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                  role="img"
                  aria-describedby={`map-description-${question.id}`}
                />
                <div id={`map-description-${question.id}`} className="sr-only">
                  {getMapAriaDescription(isMultiSelect, selectedRegions.length)}
                </div>
                {/* Map attribution - always show for good practice */}
                <FooterMapAttribution source="natural-earth" alwaysShow className="mt-2" />
              </div>
            )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {isMultiSelect ? 'Valitse kaikki sopivat alueet.' : 'Valitse oikea alue.'}
              <span className="sr-only">
                {' '}Käytä nuolinäppäimiä liikkumiseen ja Enter-näppäintä valintaan.
              </span>
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="group"
              aria-label="Alueiden valinnat"
            >
              {regions.map((region, index) => renderRegionButton(region.id, region.label, index))}
            </div>
          </div>
        </>
      ) : useTextMode && inputMode !== 'text' ? (
        <TextFallbackMode
          regions={textFallbackRegions}
          selectedRegionIds={selectedRegions}
          onSelectionChange={(ids) => {
            if (isMultiSelect) {
              onAnswerChange(ids);
            } else {
              onAnswerChange(ids.length > 0 ? ids[0] : '');
            }
          }}
          multiSelect={isMultiSelect}
          disabled={showExplanation}
          showResults={showExplanation}
          label={isMultiSelect ? 'Valitse kaikki sopivat alueet' : 'Valitse oikea alue'}
        />
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={`map-answer-${question.id}`}>
            Kirjoita alueen nimi
          </label>
          <Input
            id={`map-answer-${question.id}`}
            value={typeof userAnswer === 'string' ? userAnswer : ''}
            onChange={(event) => !showExplanation && onAnswerChange(event.target.value)}
            disabled={showExplanation}
            placeholder="Esim. Uusimaa"
            className={cn(
              "text-base",
              showExplanation && "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400"
            )}
          />
        </div>
      )}

      {showExplanation && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 p-3 text-sm text-blue-900 dark:text-blue-200">
          <span className="font-semibold">
            {isMultiSelect ? 'Oikeat alueet:' : 'Oikea alue:'}
          </span>{' '}
          {inputMode === 'text'
            ? getRegionLabel(question, String(question.correct_answer))
            : correctRegions.map((regionId) => getRegionLabel(question, regionId)).join(', ')}
        </div>
      )}
      </div>
    </MapErrorBoundary>
  );
}
