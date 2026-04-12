'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, MagnifyingGlass, Trophy, X } from '@phosphor-icons/react';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/ui/page-title';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { SearchSuggestions } from '@/components/ui/search-suggestions';
import { cn } from '@/lib/utils';
import { getGradeColors } from '@/lib/utils/grade-colors';

interface ModeClassBarProps {
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
  headerActionBeforeSearch?: ReactNode;
  className?: string;
}

export function ModeClassBar({
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
  headerActionBeforeSearch,
  className,
}: ModeClassBarProps) {
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
          <IconButton
            onClick={onBack}
            aria-label="Takaisin"
            className="rounded-xl border-transparent bg-transparent text-black/55 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ArrowLeft size={20} weight="regular" aria-hidden="true" />
          </IconButton>

          <div />

          <div className="flex items-center gap-2">
            {headerActionBeforeSearch}
            <IconButton
              aria-label="Avaa haku"
              onClick={() => onSearchOpenChange(true)}
              className="border-black/[0.08] bg-black/[0.02]"
            >
              <MagnifyingGlass size={18} weight="duotone" />
            </IconButton>
            <IconButton asChild aria-label="Saavutukset">
              <Link href="/play/achievements">
                <Trophy size={18} weight="duotone" />
              </Link>
            </IconButton>
          </div>
        </div>

        {searchOpen && (
          <div className="relative mt-1 sm:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <MagnifyingGlass size={18} weight="duotone" className="text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                placeholder="Etsi aihealuetta, ainetta tai aihetta..."
                className="min-h-10 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-500"
                aria-label="Haku"
              />
              <IconButton
                onClick={() => {
                  onSearchOpenChange(false);
                  onSearchClose();
                }}
                aria-label="Sulje haku"
                className="h-10 w-10 rounded-lg border-transparent bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              >
                <X size={18} weight="bold" />
              </IconButton>
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
            <SegmentedControl
              role="radiogroup"
              aria-label="Suodattimet"
              className="flex h-11 w-full"
            >
            {availableGrades.map((grade) => {
              const colors = getGradeColors(grade);
              const isActive = selectedGrade === grade;

              return (
                <SegmentedControlItem
                  key={`mobile-grade-${grade}`}
                  type="button"
                  onClick={() => onSelectedGradeChange(isActive ? null : grade)}
                  active={isActive}
                  className="h-12 px-2.5 text-[14px] focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                  activeClassName={`border border-current/60 bg-transparent font-semibold ${colors.text}`}
                  inactiveClassName="bg-transparent text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                  aria-pressed={isActive}
                >
                  <span className="max-[360px]:hidden">{grade} lk</span>
                  <span className="hidden max-[360px]:inline">{grade}</span>
                </SegmentedControlItem>
              );
            })}
            </SegmentedControl>
          </div>
        </div>

        <div className="hidden py-4 sm:block">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <IconButton
                size="lg"
                onClick={onBack}
                aria-label="Takaisin"
                className="border-black/[0.08] bg-black/[0.02]"
              >
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </IconButton>
              <PageTitle className="truncate text-[30px] leading-[1.05] text-slate-900 dark:text-slate-100">
                Koekertaaja
              </PageTitle>
            </div>

            <div className="relative flex flex-shrink-0 items-center gap-2">
              {headerActionBeforeSearch}
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

              <IconButton asChild size="lg" aria-label="Saavutukset">
                <Link href="/play/achievements">
                  <Trophy size={18} weight="duotone" />
                </Link>
              </IconButton>
            </div>
          </div>

          <div className="mt-3 border-t border-black/5 pt-3 dark:border-gray-700/80">
            <div className="mx-auto w-full max-w-[760px] overflow-x-auto no-scrollbar">
              <SegmentedControl
                role="radiogroup"
                aria-label="Suodattimet"
                className="min-h-12 min-w-full"
              >
                {availableGrades.map((grade) => {
                  const colors = getGradeColors(grade);
                  const isActive = selectedGrade === grade;

                  return (
                    <SegmentedControlItem
                      key={grade}
                      type="button"
                      onClick={() => onSelectedGradeChange(isActive ? null : grade)}
                      active={isActive}
                      className="h-12 gap-2 px-3 text-sm focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                      activeClassName={`border border-current/60 bg-transparent font-semibold ${colors.text}`}
                      inactiveClassName="text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                      aria-pressed={isActive}
                    >
                      <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
                      {grade} lk
                    </SegmentedControlItem>
                  );
                })}
              </SegmentedControl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
