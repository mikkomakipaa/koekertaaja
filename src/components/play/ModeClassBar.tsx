'use client';

import { useRef, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Book, GameController, GraduationCap, MagnifyingGlass, Trophy, X } from '@phosphor-icons/react';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { SearchSuggestions } from '@/components/ui/search-suggestions';
import { cn } from '@/lib/utils';
import { getGradeColors } from '@/lib/utils/grade-colors';
import { colors } from '@/lib/design-tokens';
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

const getActiveModeClass = (mode: StudyMode): string => {
  if (mode === 'pelaa') return `${colors.quiz.primary} ${colors.quiz.ring} ring-2 font-semibold text-white`;
  return `${colors.study.primary} ${colors.study.ring} ring-2 font-semibold text-white`;
};

const getModeFocusRingClass = (mode: StudyMode): string => {
  if (mode === 'pelaa') return 'focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400';
  return 'focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400';
};

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
        'relative border-b border-black/10 bg-white transition-shadow duration-150 dark:border-gray-700 dark:bg-gray-900',
        scrolled && 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2.5 pb-1.5 pt-3 sm:hidden">
          <button
            type="button"
            onClick={onBack}
            aria-label="Takaisin"
            className="inline-grid h-11 w-11 place-items-center rounded-xl bg-transparent text-black/55 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
          >
            <ArrowLeft size={20} weight="regular" aria-hidden="true" />
          </button>

          <h1 className="truncate text-[22px] font-bold leading-[1.1] tracking-tight text-slate-900 max-[480px]:text-[19px] dark:text-slate-100">
            Koekertaaja
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Avaa haku"
              onClick={() => onSearchOpenChange(true)}
              className="inline-grid h-11 w-11 place-items-center rounded-[14px] border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
            >
              <MagnifyingGlass size={18} weight="duotone" />
            </button>
            <Link
              href="/play/achievements"
              aria-label="Saavutukset"
              className="inline-grid h-11 w-11 place-items-center rounded-[14px] border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
            >
              <Trophy size={18} weight="duotone" />
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="relative mt-1 sm:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <MagnifyingGlass size={18} weight="duotone" className="text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                placeholder="Etsi aihealuetta, ainetta tai aihetta..."
                className="min-h-10 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
                aria-label="Haku"
              />
              <button
                type="button"
                onClick={() => {
                  onSearchOpenChange(false);
                  onSearchClose();
                }}
                aria-label="Sulje haku"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <SearchSuggestions
              isOpen={suggestionsOpen}
              query={searchQuery}
              popular={popularSearches}
              recent={recentSearches}
              suggestions={liveSuggestions}
              onSelect={onSuggestionSelect}
              onClearRecent={onClearRecentSearches}
            />
          </div>
        )}

        <div className="mx-auto flex justify-center pb-3 pt-1.5 sm:hidden">
          <div className="w-full max-w-[520px]">
            <div
              role="radiogroup"
              aria-label="Suodattimet"
              className="flex h-11 items-center justify-center gap-1.5 rounded-[18px] bg-slate-100 p-1 dark:bg-slate-800"
            >
            {MODE_OPTIONS.map((mode, index) => {
              const isActive = studyMode === mode.value;
              const Icon = mode.icon;

              return (
                <button
                  key={`mobile-${mode.value}`}
                  ref={(element) => {
                    modeRefs.current[index] = element;
                  }}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={mode.label}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onStudyModeChange(mode.value)}
                    onKeyDown={(event) => handleModeKeyDown(index, event)}
                    className={cn(
                    'inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] px-2.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
                    getModeFocusRingClass(mode.value),
                    isActive
                      ? getActiveModeClass(mode.value)
                      : 'bg-transparent text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                >
                  <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                </button>
              );
            })}

            {availableGrades.map((grade) => {
              const colors = getGradeColors(grade);
              const isActive = selectedGrade === grade;

              return (
                <button
                  key={`mobile-grade-${grade}`}
                  type="button"
                  onClick={() => onSelectedGradeChange(isActive ? null : grade)}
                  className={cn(
                    'inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] px-2.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900',
                    isActive
                      ? `border border-current/60 bg-transparent font-semibold ${colors.text}`
                      : 'bg-transparent text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                  )}
                  aria-pressed={isActive}
                >
                  <span className="max-[360px]:hidden">{grade} lk</span>
                  <span className="hidden max-[360px]:inline">{grade}</span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        <div className="hidden py-4 sm:block">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                aria-label="Takaisin"
                className="inline-grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-[14px] border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
              >
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </button>
              <h1 className="truncate text-[30px] font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
                Koekertaaja
              </h1>
            </div>

            <div className="relative flex flex-shrink-0 items-center gap-2">
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
                    'h-11 w-11 sm:h-12 sm:w-12 rounded-[14px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900',
                    !searchOpen &&
                      'border-black/[0.08] bg-black/[0.02] text-gray-600 hover:bg-black/[0.04] hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
                    searchOpen && 'w-[260px] md:w-[320px]'
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

              <Link
                href="/play/achievements"
                aria-label="Saavutukset"
                className="inline-grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-[14px] border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
              >
                <Trophy size={18} weight="duotone" />
              </Link>
            </div>
          </div>

          <div className="mt-3 border-t border-black/5 pt-3 dark:border-gray-700/80">
            <div className="mx-auto w-full max-w-[760px] overflow-x-auto no-scrollbar">
              <div
                role="radiogroup"
                aria-label="Suodattimet"
                className="inline-flex min-h-12 min-w-full items-center justify-center gap-1.5 rounded-[18px] bg-slate-100 p-1 dark:bg-slate-800"
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
                      aria-label={mode.label}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => onStudyModeChange(mode.value)}
                      onKeyDown={(event) => handleModeKeyDown(index, event)}
                      className={cn(
                        'inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-[14px] px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
                        getModeFocusRingClass(mode.value),
                        isActive
                          ? getActiveModeClass(mode.value)
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                      )}
                    >
                      <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}

                {availableGrades.map((grade) => {
                  const colors = getGradeColors(grade);
                  const isActive = selectedGrade === grade;

                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => onSelectedGradeChange(isActive ? null : grade)}
                      className={cn(
                        'inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-[14px] px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900',
                        isActive
                          ? `border border-current/60 bg-transparent font-semibold ${colors.text}`
                          : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
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
          </div>
        </div>
      </div>
    </div>
  );
}
