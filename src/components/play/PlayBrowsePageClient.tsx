'use client';

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeClassBar } from '@/components/play/ModeClassBar';
import { PrimaryActionButton } from '@/components/play/PrimaryActionButton';
import { cn } from '@/lib/utils';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { getGradeColors } from '@/lib/utils/grade-colors';
import { getSubjectConfig } from '@/lib/utils/subject-config';
import { buildModeGradeQuery, parseGradeParam, parseStudyModeParam } from '@/lib/play/mode-grade-query';
import {
  difficultyLabels,
  getQuizGradeMeta,
  getQuizLatestResultSummary,
  getQuizPrimaryActionLabel,
} from '@/lib/play/primary-action';
import {
  buildDifficultyHref,
  buildQuizTopicSelectorHref,
  getAvailableDifficulties,
  getDifficultyTargetSet,
  type BrowseDifficulty,
} from '@/lib/play/browse-difficulties';
import { getLatestDifficultyScore, getPrimaryDifficulty, type DifficultyScoreMap } from '@/lib/play/primary-mode';
import { QuestionSet, Difficulty, StudyMode } from '@/types';
import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { useSessionProgress } from '@/hooks/useSessionProgress';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import { createLogger } from '@/lib/logger';
import { buildGroupedQuestionSets, type GroupedQuestionSets } from '@/lib/play/group-question-sets';
import {
  Books,
  Circle,
  CircleNotch,
  CirclesFour,
  Timer,
  Sparkle,
  Rows,
  Book,
  ArrowCounterClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react';

interface PlayBrowsePageClientProps {
  initialModeParam?: string | null;
  initialGradeParam?: string | null;
}

type BrowseState = 'loading' | 'loaded' | 'error';

const logger = createLogger({ module: 'play.page' });

const difficultyColors: Record<
  string,
  { bg: string; hover: string; text: string; icon: string; focus: string; border: string }
> = {
  helppo: {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/45',
    text: 'text-teal-900 dark:text-teal-100',
    icon: 'text-teal-600 dark:text-teal-300',
    focus: 'focus-visible:ring-teal-500 dark:focus-visible:ring-teal-300',
    border: 'border-teal-200 dark:border-teal-700/70',
  },
  normaali: {
    bg: 'bg-amber-50 dark:bg-amber-900/25',
    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
    text: 'text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-300',
    focus: 'focus-visible:ring-amber-500 dark:focus-visible:ring-amber-300',
    border: 'border-amber-200 dark:border-amber-700/70',
  },
  aikahaaste: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/45',
    text: 'text-indigo-900 dark:text-indigo-100',
    icon: 'text-indigo-600 dark:text-indigo-300',
    focus: 'focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-700/70',
  },
};

const playPageButtonShadow = 'shadow-[0_2px_6px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)]';

const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Circle size={20} weight="bold" className="inline" />,
  normaali: <CirclesFour size={20} weight="bold" className="inline" />,
  aikahaaste: <Timer size={20} weight="duotone" className="inline" />,
};

const getSubjectHeaderMeta = (subject: string, formattedDate: string | null) => {
  const config = getSubjectConfig(subject);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${config.color}`}>{config.icon}</div>
      {formattedDate && (
        <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {formattedDate}
        </span>
      )}
    </div>
  );
};

const hasFlashcards = (sets: QuestionSet[]) => {
  return sets.some((set) => set.mode === 'flashcard');
};

// Grade colors now imported from centralized design tokens

const formatQuestionSetDate = (examDate?: string | null): string | null => {
  if (!examDate) return null;

  // exam_date is stored as DATE (YYYY-MM-DD); parse locally to avoid timezone day shifts.
  const dateOnlyMatch = examDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(examDate);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

interface QuestionSetCardProps {
  group: GroupedQuestionSets;
  studyMode: StudyMode;
  router: ReturnType<typeof useRouter>;
}

function QuestionSetCard({ group, studyMode, router }: QuestionSetCardProps) {
  const availableDifficulties = getAvailableDifficulties(group.sets);
  const groupHasFlashcards = hasFlashcards(group.sets);

  const helppoSet = group.sets.find((set) => set.mode === 'quiz' && set.difficulty === 'helppo');
  const normaaliSet = group.sets.find((set) => set.mode === 'quiz' && set.difficulty === 'normaali');
  const aikahaasteSet = group.sets.find(
    (set) => set.mode === 'quiz' && (set.difficulty as string) === 'aikahaaste'
  );

  const helppoScore = useLastScore(helppoSet?.code).lastScore;
  const normaaliScore = useLastScore(normaaliSet?.code).lastScore;
  const aikahaasteScore = useLastScore(aikahaasteSet?.code).lastScore;
  const difficultyScores: DifficultyScoreMap = {
    helppo: helppoScore,
    normaali: normaaliScore,
    aikahaaste: aikahaasteScore,
  };
  const primaryDifficulty =
    normaaliSet
      ? 'normaali'
      : getPrimaryDifficulty(availableDifficulties, difficultyScores);
  const primarySet = getDifficultyTargetSet(group.sets, primaryDifficulty);
  const primaryScore = difficultyScores[primaryDifficulty];
  const { progress: primaryProgress } = useSessionProgress(primarySet?.code);
  const hasInProgressPrimary = Boolean(
    primaryProgress && primaryProgress.answered > 0 && primaryProgress.answered < primaryProgress.total
  );
  const primaryActionText = getQuizPrimaryActionLabel({
    difficulty: primaryDifficulty,
    hasInProgress: hasInProgressPrimary,
    hasScore: Boolean(primaryScore),
  });
  const latestDifficultyScore = getLatestDifficultyScore(availableDifficulties, difficultyScores);
  const topicTargetSet = normaaliSet ?? helppoSet ?? primarySet;

  const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
  const reviewCandidates = difficultyOrder
    .map((difficulty) =>
      group.sets.find((set) => set.difficulty === difficulty && set.mode === 'quiz')
    )
    .filter((set): set is QuestionSet => Boolean(set))
    .map((set) => ({
      set,
      count: readMistakesFromStorage(set.code).length,
    }));
  const reviewCandidate = reviewCandidates.find((candidate) => candidate.count > 0);

  const newestExamDate = group.sets
    .map((set) => set.exam_date)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const formattedDate = formatQuestionSetDate(newestExamDate);
  const gradeColors = group.grade ? getGradeColors(group.grade) : null;
  const titleLabel = getSubjectConfig(group.subject).label;
  const primaryActionLabel =
    studyMode === 'pelaa'
      ? hasInProgressPrimary
        ? 'Jatka peliä'
        : primaryScore
          ? 'Pelaa uudelleen'
          : 'Pelaa nyt'
      : '';
  const primaryActionMeta =
    studyMode === 'pelaa'
      ? hasInProgressPrimary && primaryProgress
        ? `${difficultyLabels[primaryDifficulty]} · ${primaryProgress.answered}/${primaryProgress.total}`
        : primaryScore
          ? `${difficultyLabels[primaryDifficulty]} · ${getQuizGradeMeta(primaryScore)}`
          : difficultyLabels[primaryDifficulty]
      : null;
  const canChooseTopic = studyMode === 'pelaa' && Boolean(topicTargetSet);
  const hasAikahaaste = studyMode === 'pelaa' && availableDifficulties.includes('aikahaaste') && Boolean(normaaliSet);

  return (
    <Card
      variant="standard"
      padding="none"
      className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-none transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] active:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-[0_12px_28px_rgba(2,6,23,0.34)]"
    >
      <CardHeader className="space-y-2.5 p-4 pb-3">
        <div className="grid grid-cols-[1fr_auto] items-start gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="min-w-0">
              {getSubjectHeaderMeta(group.subject, formattedDate)}
            </div>
            <CardTitle className="line-clamp-2 text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {titleLabel}
            </CardTitle>
          </div>
          {group.grade && gradeColors && (
            <Badge
              variant="outline"
              semantic="grade"
              size="xs"
              className={cn(
                'h-6 self-start border-current/25 bg-white/75 px-2 text-xs font-medium tracking-[0.01em] dark:bg-slate-950/50 dark:border-current/20',
                gradeColors.text,
                gradeColors.border
              )}
            >
              {group.grade}. lk
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 border-t border-slate-100 p-4 pt-3 dark:border-white/[0.08]">
        <div className="space-y-3">
          {studyMode === 'pelaa' ? (
            availableDifficulties.length > 0 ? (
              <div className="space-y-2.5">
                <PrimaryActionButton
                  onClick={() =>
                    primarySet && router.push(buildDifficultyHref(primarySet.code, studyMode, primaryDifficulty))
                  }
                  mode="quiz"
                  icon={difficultyIcons[primaryDifficulty]}
                  label={primaryActionLabel}
                  ariaLabel={`${primaryActionText} vaikeustaso`}
                  rightMeta={
                    primaryActionMeta ? (
                      <span className="text-xs font-medium tabular-nums text-white/85 max-[480px]:text-xs">
                        {primaryActionMeta}
                      </span>
                    ) : null
                  }
                />

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {helppoSet ? (
                    <Button
                      onClick={() => router.push(buildDifficultyHref(helppoSet.code, studyMode, 'helppo'))}
                      variant="secondary"
                      size="default"
                      className={cn(
                        'min-h-11 justify-center rounded-lg border px-3 text-sm font-semibold shadow-none',
                        difficultyColors.helppo.bg,
                        difficultyColors.helppo.hover,
                        difficultyColors.helppo.text,
                        difficultyColors.helppo.border
                      )}
                      aria-label="Helppo"
                    >
                      <span className={cn('mr-2 shrink-0', difficultyColors.helppo.icon)}>{difficultyIcons.helppo}</span>
                      Helppo
                    </Button>
                  ) : null}

                  {canChooseTopic ? (
                    <Button
                      onClick={() => topicTargetSet && router.push(buildQuizTopicSelectorHref(topicTargetSet.code))}
                      variant="secondary"
                      size="default"
                      className="min-h-11 justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-800 shadow-none hover:bg-sky-100 dark:border-sky-700/60 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-sky-950/35"
                      aria-label="Aihe"
                    >
                      <Rows size={18} weight="duotone" className="mr-2 shrink-0 text-sky-600 dark:text-sky-300" />
                      Aihe
                    </Button>
                  ) : null}

                  {hasAikahaaste ? (
                    <Button
                      onClick={() => normaaliSet && router.push(buildDifficultyHref(normaaliSet.code, studyMode, 'aikahaaste'))}
                      variant="secondary"
                      size="default"
                      className={cn(
                        'min-h-11 justify-center rounded-lg border px-3 text-sm font-semibold shadow-none',
                        difficultyColors.aikahaaste.bg,
                        difficultyColors.aikahaaste.hover,
                        difficultyColors.aikahaaste.text,
                        difficultyColors.aikahaaste.border
                      )}
                      aria-label="Aikahaaste"
                    >
                      <span className={cn('mr-2 shrink-0', difficultyColors.aikahaaste.icon)}>
                        {difficultyIcons.aikahaaste}
                      </span>
                      Aikahaaste
                    </Button>
                  ) : null}
                </div>

                <div className="mt-3 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-slate-100 pt-3 dark:border-white/[0.08]">
                  {reviewCandidate ? (
                    <Button
                      onClick={() => router.push(`/play/${reviewCandidate.set.code}?mode=review`)}
                      mode="review"
                      variant="ghost"
                      size="sm"
                      className="h-7 min-h-0 gap-1 rounded-full border border-rose-200/80 bg-rose-50/70 px-2.5 py-0 text-xs font-medium leading-none text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-900/30"
                      aria-label="Virheet"
                    >
                      <ArrowCounterClockwise size={14} weight="duotone" className="inline" />
                      Kertaa virheet ({reviewCandidate.count})
                    </Button>
                  ) : (
                    <span
                      className="pointer-events-none inline-flex h-7 items-center rounded-full border border-transparent bg-slate-100/70 px-2.5 text-xs font-medium leading-none text-slate-500 opacity-70 dark:bg-slate-800/70 dark:text-slate-400"
                      aria-disabled="true"
                    >
                      Ei virheitä tallessa
                    </span>
                  )}

                  <span className="inline-flex items-center truncate text-right text-xs leading-none text-slate-500 dark:text-slate-400">
                    {latestDifficultyScore
                      ? getQuizLatestResultSummary(latestDifficultyScore)
                      : 'Ei tuloksia'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei pelimuotoa saatavilla</p>
            )
          ) : (
            groupHasFlashcards ? (
              <PrimaryActionButton
                onClick={() => {
                  const flashcardSet = group.sets.find((s) => s.mode === 'flashcard');
                  if (flashcardSet) {
                    router.push(`/play/${flashcardSet.code}?mode=opettele`);
                  }
                }}
                mode="study"
                icon={<Book size={20} weight="duotone" />}
                label="Opettele"
                ariaLabel="Opettele korttien avulla"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei kortteja saatavilla</p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayBrowsePageSkeleton({ initialModeParam, initialGradeParam }: PlayBrowsePageClientProps) {
  const router = useRouter();
  const scrolled = useScrollDetection();
  const initialStudyMode = parseStudyModeParam(initialModeParam ?? null);
  const initialGrade = parseGradeParam(initialGradeParam ?? null);

  return (
    <PlayBrowsePageShell
      scrolled={scrolled}
      studyMode={initialStudyMode}
      selectedGrade={initialGrade}
      availableGrades={[]}
      searchQuery=""
      onSearchQueryChange={() => {}}
      searchOpen={false}
      onSearchOpenChange={() => {}}
      suggestionsOpen={false}
      onSearchFocus={() => {}}
      onSearchBlur={() => {}}
      onSuggestionSelect={() => {}}
      popularSearches={[]}
      recentSearches={[]}
      liveSuggestions={[]}
      onClearRecentSearches={() => {}}
      onBack={() => router.push('/')}
      onSearchClose={() => {}}
      onStudyModeChange={() => {}}
      onSelectedGradeChange={() => {}}
    >
      <PlayBrowseContentLoading />
    </PlayBrowsePageShell>
  );
}

interface PlayBrowsePageShellProps {
  children: ReactNode;
  scrolled: boolean;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  selectedGrade: number | null;
  onSelectedGradeChange: (grade: number | null) => void;
  availableGrades: number[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
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
}

function PlayBrowsePageShell({
  children,
  scrolled,
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
}: PlayBrowsePageShellProps) {
  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <ModeClassBar
        studyMode={studyMode}
        onStudyModeChange={onStudyModeChange}
        selectedGrade={selectedGrade}
        onSelectedGradeChange={onSelectedGradeChange}
        availableGrades={availableGrades}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        searchOpen={searchOpen}
        onSearchOpenChange={onSearchOpenChange}
        suggestionsOpen={suggestionsOpen}
        onSearchFocus={onSearchFocus}
        onSearchBlur={onSearchBlur}
        onSuggestionSelect={onSuggestionSelect}
        popularSearches={popularSearches}
        recentSearches={recentSearches}
        liveSuggestions={liveSuggestions}
        onClearRecentSearches={onClearRecentSearches}
        onBack={onBack}
        onSearchClose={onSearchClose}
        scrolled={scrolled}
      />

      <div className="mx-auto max-w-4xl px-4 pb-8 pt-3 md:px-8 md:pb-10 md:pt-8">
        {children}
      </div>
    </div>
  );
}

function PlayBrowseContentLoading() {
  return (
    <Card
      variant="standard"
      padding="none"
      className="overflow-hidden rounded-2xl border-slate-200 bg-white/95 shadow-none dark:border-slate-800 dark:bg-slate-900/95"
    >
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center md:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          <CircleNotch size={26} weight="bold" className="animate-spin" aria-hidden="true" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Harjoitukset latautuvat
          </h2>
        </div>

        <div className="w-full max-w-2xl space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <Skeleton className="mb-3 h-5 w-40 rounded-lg" />
              <Skeleton className="mb-4 h-4 w-24 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlayBrowsePageContent({ initialModeParam, initialGradeParam }: PlayBrowsePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<BrowseState>('loading');
  const [groupedSets, setGroupedSets] = useState<GroupedQuestionSets[]>([]);
  const [error, setError] = useState('');
  const [studyMode, setStudyMode] = useState<StudyMode>(() => parseStudyModeParam(initialModeParam ?? null));
  const [selectedGrade, setSelectedGrade] = useState<number | null>(() => parseGradeParam(initialGradeParam ?? null));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsBlurTimeout = useRef<number | null>(null);
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();
  const scrolled = useScrollDetection();

  useEffect(() => {
    const loadQuestionSets = async () => {
      try {
        setState('loading');
        let sets: QuestionSet[] = [];
        const [quizResponse, flashcardResponse] = await Promise.all([
          fetch('/api/question-sets?scope=play&limit=100&mode=quiz', { method: 'GET', credentials: 'same-origin' }),
          fetch('/api/question-sets?scope=play&limit=100&mode=flashcard', { method: 'GET', credentials: 'same-origin' }),
        ]);

        if (quizResponse.status === 401) {
          sets = await getRecentQuestionSets(100);
        } else if (quizResponse.ok) {
          const quizPayload = await quizResponse.json();
          const flashcardPayload = flashcardResponse.ok ? await flashcardResponse.json() : { data: [] };
          sets = [...(quizPayload.data || []), ...(flashcardPayload.data || [])];
        } else {
          const payload = await quizResponse.json();
          const message = payload?.error || 'Kysymyssarjojen lataaminen epäonnistui';
          throw new Error(message);
        }

        const latestGroupExamDate = (group: GroupedQuestionSets): number | null => {
          const timestamps = group.sets
            .map((set) => set.exam_date)
            .filter((value): value is string => Boolean(value))
            .map((value) => new Date(value).getTime())
            .filter((value) => Number.isFinite(value));

          if (timestamps.length === 0) return null;
          return Math.max(...timestamps);
        };

        const latestGroupCreatedAt = (group: GroupedQuestionSets): number => {
          const timestamps = group.sets
            .map((set) => set.created_at)
            .filter((value): value is string => Boolean(value))
            .map((value) => new Date(value).getTime())
            .filter((value) => Number.isFinite(value));

          if (timestamps.length === 0) return 0;
          return Math.max(...timestamps);
        };

        const groupedArray = buildGroupedQuestionSets(sets).sort((a, b) => {
          const examA = latestGroupExamDate(a);
          const examB = latestGroupExamDate(b);

          if (examA !== null && examB !== null && examA !== examB) {
            return examB - examA;
          }

          if (examA !== null && examB === null) return -1;
          if (examA === null && examB !== null) return 1;

          return latestGroupCreatedAt(b) - latestGroupCreatedAt(a);
        });

        if (groupedArray.length === 0) {
          setError('Ei vielä kysymyssarjoja. Luo ensimmäinen!');
        }

        setGroupedSets(groupedArray);
        setState('loaded');
      } catch (err) {
        logger.error({ error: err }, 'Error loading question sets');
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Kysymyssarjojen lataaminen epäonnistui';
        setError(message);
        setState('error');
      }
    };

    loadQuestionSets();
  }, []);

  const availableGrades = useMemo(() => {
    return Array.from(new Set(groupedSets.map((g) => g.grade).filter((g): g is number => g !== undefined))).sort(
      (a, b) => a - b
    );
  }, [groupedSets]);

  useEffect(() => {
    const nextMode = parseStudyModeParam(searchParams.get('mode'));
    const nextGrade = parseGradeParam(searchParams.get('grade'));

    setStudyMode((previous) => (previous === nextMode ? previous : nextMode));
    setSelectedGrade((previous) => (previous === nextGrade ? previous : nextGrade));
  }, [searchParams]);

  useEffect(() => {
    const nextQuery = buildModeGradeQuery(searchParams, studyMode, selectedGrade);
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      const href = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(href, { scroll: false });
    }
  }, [pathname, router, searchParams, selectedGrade, studyMode]);

  useEffect(() => {
    if (selectedGrade === null) return;
    if (availableGrades.length === 0) return;
    if (!availableGrades.includes(selectedGrade)) {
      setSelectedGrade(null);
    }
  }, [availableGrades, selectedGrade]);

  const popularSearches = useMemo(() => ['Matematiikka', 'Englanti', 'Suomi', 'Historia', 'Biologia'], []);

  const suggestionPool = useMemo(() => {
    const pool = new Set<string>();
    groupedSets.forEach((group) => {
      const subjectLabel = getSubjectConfig(group.subject).label;
      [group.name, group.topic, group.subtopic, subjectLabel].forEach((item) => {
        if (item && item.trim().length > 0) {
          pool.add(item.trim());
        }
      });
    });
    return Array.from(pool);
  }, [groupedSets]);

  const liveSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return suggestionPool
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 5);
  }, [searchQuery, suggestionPool]);

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    addRecentSearch(value);
    setSuggestionsOpen(false);
  };

  const handleSearchFocus = () => {
    if (suggestionsBlurTimeout.current) {
      window.clearTimeout(suggestionsBlurTimeout.current);
      suggestionsBlurTimeout.current = null;
    }
    setSuggestionsOpen(true);
  };

  const handleSearchBlur = () => {
    if (suggestionsBlurTimeout.current) {
      window.clearTimeout(suggestionsBlurTimeout.current);
    }
    suggestionsBlurTimeout.current = window.setTimeout(() => {
      setSuggestionsOpen(false);
    }, 140);
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery);
    }
  };

  useEffect(() => {
    return () => {
      if (suggestionsBlurTimeout.current) {
        window.clearTimeout(suggestionsBlurTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSuggestionsOpen(false);
    }
  }, [searchOpen]);

  const filteredSets = useMemo(() => {
    return groupedSets.filter((group) => {
      if (selectedGrade && group.grade !== selectedGrade) return false;
      if (studyMode === 'opettele' && !hasFlashcards(group.sets)) return false;
      if (studyMode === 'pelaa' && getAvailableDifficulties(group.sets).length === 0) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const subjectLabel = getSubjectConfig(group.subject).label;
        const searchableText = [
          group.name,
          group.subject,
          subjectLabel,
          group.topic || '',
          group.subtopic || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) return false;
      }

      return true;
    });
  }, [groupedSets, searchQuery, selectedGrade, studyMode]);

  return (
    <PlayBrowsePageShell
      scrolled={scrolled}
      studyMode={studyMode}
      onStudyModeChange={setStudyMode}
      selectedGrade={selectedGrade}
      onSelectedGradeChange={setSelectedGrade}
      availableGrades={availableGrades}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      searchOpen={searchOpen}
      onSearchOpenChange={setSearchOpen}
      suggestionsOpen={suggestionsOpen}
      onSearchFocus={handleSearchFocus}
      onSearchBlur={handleSearchBlur}
      onSuggestionSelect={handleSuggestionSelect}
      popularSearches={popularSearches}
      recentSearches={recentSearches}
      liveSuggestions={liveSuggestions}
      onClearRecentSearches={clearRecentSearches}
      onBack={() => router.push('/')}
      onSearchClose={() => setSuggestionsOpen(false)}
    >
      {state === 'loading' ? (
        <PlayBrowseContentLoading />
      ) : (
        <>
          {state === 'error' && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {groupedSets.length === 0 && state === 'loaded' && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <div className="mb-6 flex justify-center">
                  <Books size={80} weight="duotone" className="text-purple-500 dark:text-purple-400" />
                </div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">Ei vielä harjoituksia</h2>
                <p className="mb-8 text-base text-gray-600 dark:text-gray-400 md:text-lg">
                  Luo ensimmäinen kysymyssarja aloittaaksesi harjoittelun
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    onClick={() => router.push('/create')}
                    mode="quiz"
                    variant="primary"
                    size="lg"
                    className={cn(playPageButtonShadow, 'px-8 text-base')}
                  >
                    <Sparkle size={20} weight="fill" />
                    Luo kysymyssarja
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className={cn(playPageButtonShadow, 'rounded-lg px-8 py-3 text-base font-semibold')}
                  >
                    Takaisin valikkoon
                  </Button>
                </div>
              </div>
            </div>
          )}

          {groupedSets.length > 0 && (
            <>
              {filteredSets.length === 0 && groupedSets.length > 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="mb-6 flex justify-center">
                    <MagnifyingGlass size={64} weight="duotone" className="text-gray-400 dark:text-gray-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100 md:text-2xl">Ei tuloksia</h3>
                  <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 md:text-base">
                    {searchQuery
                      ? `Hakusanalla "${searchQuery}" ei löytynyt kysymyssarjoja`
                      : selectedGrade
                        ? `Luokalla ${selectedGrade} ei ole kysymyssarjoja`
                        : 'Ei kysymyssarjoja valituilla suodattimilla'}
                  </p>
                  <div className="flex justify-center gap-3">
                    {searchQuery && (
                      <Button
                        onClick={() => setSearchQuery('')}
                        variant="outline"
                        className={playPageButtonShadow}
                      >
                        Tyhjennä haku
                      </Button>
                    )}
                    {selectedGrade && (
                      <Button
                        onClick={() => setSelectedGrade(null)}
                        variant="outline"
                        className={playPageButtonShadow}
                      >
                        Näytä kaikki luokat
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {filteredSets.length > 0 && (
                <div className="space-y-3.5">
                  {filteredSets.map((group) => (
                    <QuestionSetCard key={group.key} group={group} studyMode={studyMode} router={router} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </PlayBrowsePageShell>
  );
}

export default function PlayBrowsePageClient({ initialModeParam, initialGradeParam }: PlayBrowsePageClientProps) {
  return (
    <Suspense
      fallback={
        <PlayBrowsePageSkeleton
          initialModeParam={initialModeParam}
          initialGradeParam={initialGradeParam}
        />
      }
    >
      <PlayBrowsePageContent
        initialModeParam={initialModeParam}
        initialGradeParam={initialGradeParam}
      />
    </Suspense>
  );
}
