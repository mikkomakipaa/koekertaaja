'use client';

import { useRef, type KeyboardEvent } from 'react';
import { ArrowLeft, Book, GameController, GraduationCap } from '@phosphor-icons/react';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { SearchSuggestions } from '@/components/ui/search-suggestions';
import { cn } from '@/lib/utils';
import { getGradeColors } from '@/lib/utils/grade-colors';
import { type StudyMode } from '@/types';

interface ModeClassBarProps {
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  selectedGrade: number | null;
  onSelectedGradeChange: (grade: number | null) => void;
  availableGrades: number[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (isOpen: boolean) => void;
  suggestionsOpen: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSuggestionSelect: (value: string) => void;
  popularSearches: string[];
  recentSearches: string[];
  liveSuggestions: string[];
  onClearRecentSearches: () => void;
  onBack: () => void;
  onSearchClose: () => void;
  scrolled: boolean;
  className?: string;
}

const MODE_OPTIONS: Array<{ value: StudyMode; label: string; icon: typeof GameController }> = [
  { value: 'pelaa', label: 'Pelaa', icon: GameController },
  { value: 'opettele', label: 'Opettele', icon: Book },
];

const controlBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.99] dark:focus-visible:ring-offset-gray-900';

const inactiveControl =
  'border border-gray-200 bg-white text-gray-700 shadow-sm shadow-gray-200/50 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:shadow-black/20 dark:hover:border-gray-600 dark:hover:bg-gray-800';

export function ModeClassBar({
  studyMode,
  onStudyModeChange,
  selectedGrade,
  onSelectedGradeChange,
  availableGrades,
  searchQuery,
  onSearchQueryChange,
  searchOpen,
  onSearchOpenChange,
  suggestionsOpen,
  onSearchFocus,
  onSearchBlur,
  onSuggestionSelect,
  popularSearches,
  recentSearches,
  liveSuggestions,
  onClearRecentSearches,
  onBack,
  onSearchClose,
  scrolled,
  className,
}: ModeClassBarProps) {
  const modeRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleModeKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;

    event.preventDefault();
    let nextIndex = index;

    if (key === 'ArrowRight') {
      nextIndex = (index + 1) % MODE_OPTIONS.length;
    } else if (key === 'ArrowLeft') {
      nextIndex = (index - 1 + MODE_OPTIONS.length) % MODE_OPTIONS.length;
    } else if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = MODE_OPTIONS.length - 1;
    }

    const nextMode = MODE_OPTIONS[nextIndex];
    if (!nextMode) return;

    onStudyModeChange(nextMode.value);
    modeRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={cn(
        'sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm transition-shadow duration-150 dark:border-gray-700 dark:bg-gray-900/90',
        scrolled && 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      <div className="mx-auto max-w-4xl px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
            <div
              role="radiogroup"
              aria-label="Opiskelutila"
              className="inline-flex min-h-12 items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/20"
            >
              {MODE_OPTIONS.map((mode, index) => {
                const isActive = studyMode === mode.value;
                const Icon = mode.icon;

                return (
                  <button
                    key={mode.value}
                    ref={(element) => {
                      modeRefs.current[index] = element;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onStudyModeChange(mode.value)}
                    onKeyDown={(event) => handleModeKeyDown(index, event)}
                    className={cn(
                      controlBase,
                      'min-w-[120px] border-transparent',
                      isActive
                        ? mode.value === 'pelaa'
                          ? 'bg-indigo-600 text-white focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:focus-visible:ring-indigo-400'
                          : 'bg-teal-600 text-white focus-visible:ring-teal-500 dark:bg-teal-500 dark:focus-visible:ring-teal-400'
                        : 'text-gray-600 hover:bg-gray-100 focus-visible:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400'
                    )}
                  >
                    <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-12 flex-wrap items-center gap-2" aria-label="Luokkasuodattimet">
              {availableGrades.map((grade) => {
                const colors = getGradeColors(grade);
                const isActive = selectedGrade === grade;

                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => onSelectedGradeChange(isActive ? null : grade)}
                    className={cn(
                      controlBase,
                      isActive
                        ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-current/40 focus-visible:ring-current/60 dark:shadow-lg`
                        : inactiveControl
                    )}
                    aria-pressed={isActive}
                  >
                    <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
                    {grade} lk
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative ml-auto flex items-center justify-end gap-2 self-center">
            <div className="relative">
              <CollapsibleSearch
                placeholder="Etsi aihealuetta, ainetta tai aihetta..."
                value={searchQuery}
                onChange={onSearchQueryChange}
                isOpen={searchOpen}
                onToggle={onSearchOpenChange}
                onClose={onSearchClose}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                className={cn(
                  'rounded-xl shadow-sm shadow-gray-200/50 dark:shadow-black/20',
                  searchOpen && 'w-[220px] sm:w-[260px]'
                )}
              />
              <SearchSuggestions
                isOpen={searchOpen && suggestionsOpen}
                query={searchQuery}
                popular={popularSearches}
                recent={recentSearches}
                suggestions={liveSuggestions}
                onSelect={onSuggestionSelect}
                onClearRecent={onClearRecentSearches}
              />
            </div>
          </div>
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-3 rounded-md px-1 py-1 text-lg font-semibold tracking-tight text-slate-700 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:text-slate-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
          >
            <ArrowLeft size={22} weight="regular" aria-hidden="true" />
            Palaa alkuun
          </button>
        </div>
      </div>
    </div>
  );
}
