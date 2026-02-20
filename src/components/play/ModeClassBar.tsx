'use client';

import { useRef, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, GameController, GraduationCap, Trophy } from '@phosphor-icons/react';
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
  'inline-flex min-h-11 sm:min-h-12 items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.99] dark:focus-visible:ring-offset-gray-900';

const inactiveControl =
  'border border-gray-300/80 bg-transparent text-gray-700 shadow-none hover:border-gray-400 hover:bg-transparent dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-transparent';

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
        'border-b border-gray-200 bg-white/90 transition-shadow duration-150 dark:border-gray-700 dark:bg-gray-900/90',
        scrolled && 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      <div className="mx-auto max-w-4xl px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Opiskelutila"
            className="inline-flex flex-shrink-0 min-h-11 sm:min-h-12 items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/20"
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
                    'min-w-[52px] min-[430px]:min-w-[96px] sm:min-w-[120px] border-transparent',
                    isActive
                      ? mode.value === 'pelaa'
                        ? 'bg-indigo-600 text-white focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:focus-visible:ring-indigo-400'
                        : 'bg-teal-600 text-white focus-visible:ring-teal-500 dark:bg-teal-500 dark:focus-visible:ring-teal-400'
                      : 'text-gray-600 hover:bg-gray-100 focus-visible:ring-indigo-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400'
                  )}
                >
                  <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                  <span className="hidden min-[430px]:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              'min-w-0 overflow-x-auto overflow-y-visible no-scrollbar sm:overflow-visible',
              searchOpen && 'hidden sm:block'
            )}
            aria-label="Luokkasuodattimet"
          >
            <div className="flex min-h-11 sm:min-h-12 flex-nowrap items-center gap-2">
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
                      'flex-shrink-0',
                      isActive
                        ? `bg-transparent ${colors.text} border border-current/60 shadow-none focus-visible:ring-current/60`
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

          <Link
            href="/play/achievements"
            className={cn(controlBase, inactiveControl, 'flex-shrink-0 min-w-11 sm:min-w-12')}
            aria-label="Saavutukset"
          >
            <Trophy size={18} weight="duotone" />
            <span className="hidden lg:inline">Saavutukset</span>
          </Link>

          <div
            className={cn(
              'relative ml-auto flex min-w-0 items-center justify-end',
              searchOpen ? 'flex-1 sm:flex-none' : 'flex-shrink-0'
            )}
          >
            <div className={cn('relative', searchOpen && 'w-full sm:w-auto')}>
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
                  'h-11 w-11 sm:h-12 sm:w-12 rounded-xl shadow-sm shadow-gray-200/50 dark:shadow-black/20',
                  searchOpen && 'w-full sm:w-[260px]'
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

        <div className="mt-2 sm:mt-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold tracking-tight text-slate-700 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:text-base dark:text-slate-300 dark:hover:text-slate-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
          >
            <ArrowLeft size={18} weight="regular" aria-hidden="true" />
            Palaa alkuun
          </button>
        </div>
      </div>
    </div>
  );
}
