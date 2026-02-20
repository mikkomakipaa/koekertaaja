'use client';

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeClassBar } from '@/components/play/ModeClassBar';
import { cn } from '@/lib/utils';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { getGradeColors } from '@/lib/utils/grade-colors';
import { buildModeGradeQuery, parseGradeParam, parseStudyModeParam } from '@/lib/play/mode-grade-query';
import {
  buildDifficultyHref,
  getAvailableDifficulties,
  getDifficultyTargetSet,
  type BrowseDifficulty,
} from '@/lib/play/browse-difficulties';
import { QuestionSet, Difficulty, StudyMode } from '@/types';
import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import { createLogger } from '@/lib/logger';
import {
  GlobeHemisphereWest,
  MathOperations,
  Scroll,
  Bank,
  Books,
  Circle,
  CirclesFour,
  Timer,
  Sparkle,
  BookOpenText,
  Book,
  ArrowCounterClockwise,
  ArrowRight,
  MagnifyingGlass,
  Star,
  ThumbsUp,
  Barbell,
  Leaf,
  MapTrifold,
} from '@phosphor-icons/react';

type BrowseState = 'loading' | 'loaded' | 'error';

interface GroupedQuestionSets {
  key: string;
  name: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  grade?: number;
  sets: QuestionSet[];
}

interface SubjectConfig {
  icon: ReactNode;
  label: string;
  color: string;
}

const logger = createLogger({ module: 'play.page' });

const difficultyLabels: Record<string, string> = {
  helppo: 'Helppo',
  normaali: 'Normaali',
  aikahaaste: 'Aikahaaste',
};

const difficultyColors: Record<
  string,
  { bg: string; hover: string; text: string; icon: string; focus: string; border: string; shadow: string }
> = {
  helppo: {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/45',
    text: 'text-teal-900 dark:text-teal-100',
    icon: 'text-teal-600 dark:text-teal-300',
    focus: 'focus-visible:ring-teal-500 dark:focus-visible:ring-teal-300',
    border: 'border-teal-200 dark:border-teal-700/70',
    shadow: 'shadow-sm shadow-teal-900/10 dark:shadow-black/20',
  },
  normaali: {
    bg: 'bg-amber-50 dark:bg-amber-900/25',
    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
    text: 'text-amber-900 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-300',
    focus: 'focus-visible:ring-amber-500 dark:focus-visible:ring-amber-300',
    border: 'border-amber-200 dark:border-amber-700/70',
    shadow: 'shadow-sm shadow-amber-900/10 dark:shadow-black/20',
  },
  aikahaaste: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/45',
    text: 'text-indigo-900 dark:text-indigo-100',
    icon: 'text-indigo-600 dark:text-indigo-300',
    focus: 'focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-700/70',
    shadow: 'shadow-sm shadow-indigo-900/10 dark:shadow-black/20',
  },
};

const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Circle size={20} weight="bold" className="inline" />,
  normaali: <CirclesFour size={20} weight="bold" className="inline" />,
  aikahaaste: <Timer size={20} weight="duotone" className="inline" />,
};

const subjectConfigs: Record<string, SubjectConfig> = {
  english: {
    icon: <GlobeHemisphereWest size={20} weight="duotone" />,
    label: 'Englanti',
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  math: {
    icon: <MathOperations size={20} weight="duotone" />,
    label: 'Matematiikka',
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  history: {
    icon: <Scroll size={20} weight="duotone" />,
    label: 'Historia',
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  society: {
    icon: <Bank size={20} weight="duotone" />,
    label: 'Yhteiskuntaoppi',
    color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
  biology: {
    icon: <Leaf size={20} weight="duotone" />,
    label: 'Biologia',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  },
  geography: {
    icon: <MapTrifold size={20} weight="duotone" />,
    label: 'Maantiede',
    color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  },
  finnish: {
    icon: <BookOpenText size={20} weight="duotone" />,
    label: 'Äidinkieli',
    color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  },
};

const getSubjectConfig = (subject: string): SubjectConfig => {
  return (
    subjectConfigs[subject] ?? {
      icon: <BookOpenText size={20} weight="duotone" />,
      label: subject,
      color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    }
  );
};

const getSubjectWithIcon = (subject: string) => {
  const config = getSubjectConfig(subject);

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${config.color}`}>{config.icon}</div>
      <div className="pt-0.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{config.label}</span>
      </div>
    </div>
  );
};

const hasFlashcards = (sets: QuestionSet[]) => {
  return sets.some((set) => set.mode === 'flashcard');
};

// Grade colors now imported from centralized design tokens

const isNewQuestionSet = (createdAt?: string): boolean => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const now = Date.now();
  const daysDiff = (now - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
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

  const primaryQuizSet = normaaliSet ?? helppoSet ?? group.sets.find((set) => set.mode === 'quiz') ?? group.sets[0];

  const helppoScore = useLastScore(helppoSet?.code).lastScore;
  const normaaliScore = useLastScore(normaaliSet?.code).lastScore;

  const lastScore = useMemo(() => {
    if (helppoScore && normaaliScore) {
      return helppoScore.timestamp >= normaaliScore.timestamp ? helppoScore : normaaliScore;
    }
    return helppoScore ?? normaaliScore ?? null;
  }, [helppoScore, normaaliScore]);

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

  const newestCreatedAt = group.sets
    .map((set) => set.created_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const showNewBadge = isNewQuestionSet(newestCreatedAt);
  const gradeColors = group.grade ? getGradeColors(group.grade) : null;

  const scoreIcon = (() => {
    if (!lastScore) return null;
    if (lastScore.percentage >= 80) {
      return <Star size={16} weight="fill" className="text-yellow-500" />;
    }
    if (lastScore.percentage >= 60) {
      return <ThumbsUp size={16} weight="fill" className="text-blue-500" />;
    }
    return <Barbell size={16} weight="bold" className="text-orange-500" />;
  })();

  return (
    <Card
      variant="interactive"
      padding="compact"
      className="relative overflow-hidden border-gray-200/90 shadow-sm shadow-gray-200/50 dark:border-gray-700/90 dark:shadow-black/20"
    >
      <div
        className={`absolute left-0 top-0 h-full w-0.5 ${
          availableDifficulties.length > 0 && groupHasFlashcards
            ? 'bg-gradient-to-b from-indigo-400 via-violet-400 to-teal-400 dark:from-indigo-500 dark:via-violet-500 dark:to-teal-500'
            : availableDifficulties.length > 0
              ? 'bg-indigo-400 dark:bg-indigo-500'
              : groupHasFlashcards
                ? 'bg-teal-400 dark:bg-teal-500'
                : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />

      <div className="ml-3.5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em] text-gray-900 dark:text-gray-50">
              {group.name}
            </h3>
            {showNewBadge && (
              <Badge
                variant="outline"
                size="xs"
                className="gap-1 border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-700/70 dark:bg-rose-900/25 dark:text-rose-300"
              >
                <Sparkle size={8} weight="fill" />
                Uusi
              </Badge>
            )}
          </div>
          {group.grade && gradeColors && (
            <Badge
              variant="outline"
              semantic="grade"
              size="xs"
              className={cn(
                'bg-white/80 dark:bg-gray-900/60',
                gradeColors.text,
                gradeColors.border
              )}
            >
              Luokka: {group.grade}
            </Badge>
          )}
        </div>

        {getSubjectWithIcon(group.subject)}

        <div className="flex flex-wrap gap-2">
          {studyMode === 'pelaa' ? (
            availableDifficulties.length > 0 ? (
              availableDifficulties.map((difficulty) => {
                const set = getDifficultyTargetSet(group.sets, difficulty);
                const colors = difficultyColors[difficulty];
                const icon = difficultyIcons[difficulty];

                return (
                  <Button
                    key={difficulty}
                    onClick={() =>
                      set && router.push(buildDifficultyHref(set.code, studyMode, difficulty))
                    }
                    variant="secondary"
                    size="chip"
                    className={cn(
                      colors.bg,
                      colors.hover,
                      colors.text,
                      colors.focus,
                      colors.border,
                      colors.shadow,
                      'hover:shadow-md'
                    )}
                    aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
                  >
                    <span className={colors.icon}>{icon}</span>
                    <span>{difficultyLabels[difficulty]}</span>
                  </Button>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Ei pelimuotoa saatavilla</p>
            )
          ) : groupHasFlashcards ? (
            <Button
              onClick={() => {
                const flashcardSet = group.sets.find((s) => s.mode === 'flashcard');
                if (flashcardSet) {
                  router.push(`/play/${flashcardSet.code}?mode=opettele`);
                }
              }}
              mode="study"
              variant="primary"
              size="chip"
              className="group shadow-teal-500/30 dark:shadow-teal-600/30"
              aria-label="Opettele korttien avulla"
            >
              <Book size={20} weight="duotone" />
              Opettele
              <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ei kortteja saatavilla</p>
          )}

          {studyMode === 'pelaa' && reviewCandidate && (
            <Button
              onClick={() => router.push(`/play/${reviewCandidate.set.code}?mode=review`)}
              mode="review"
              variant="primary"
              size="chip"
              className="px-3 shadow-sm shadow-rose-900/10 hover:shadow-md active:shadow-sm dark:shadow-black/20"
              aria-label="Virheet"
            >
              <ArrowCounterClockwise size={20} weight="duotone" className="inline" />
              Virheet ({reviewCandidate.count})
            </Button>
          )}
        </div>

        {lastScore && scoreIcon && (
          <div className="border-t border-gray-200 pt-2.5 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Viimeisin tulos:</span>
              <div className="flex items-center gap-1.5">
                {lastScore.difficulty && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200',
                      difficultyColors[lastScore.difficulty]?.bg,
                      difficultyColors[lastScore.difficulty]?.border
                    )}
                    title={difficultyLabels[lastScore.difficulty] || lastScore.difficulty}
                  >
                    <span className={difficultyColors[lastScore.difficulty]?.icon}>
                      {difficultyIcons[lastScore.difficulty]}
                    </span>
                    <span className="hidden sm:inline">{difficultyLabels[lastScore.difficulty]}</span>
                  </span>
                )}
                {scoreIcon}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {lastScore.score}/{lastScore.total}
                </span>
                <span className="text-gray-500 dark:text-gray-400">({lastScore.percentage}%)</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
}

function PlayBrowsePageSkeleton() {
  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 flex-1 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 md:p-12">
        <div className="mb-10">
          <Skeleton className="mb-2 h-9 w-64" />
          <Skeleton className="h-6 w-80 md:w-96" />
        </div>

        <div className="mb-6">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="mb-6 flex gap-2">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="standard" padding="standard">
              <Skeleton className="mb-3 h-6 w-3/4" />
              <Skeleton className="mb-4 h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-12 w-28 rounded-lg" />
                <Skeleton className="h-12 w-28 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayBrowsePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<BrowseState>('loading');
  const [groupedSets, setGroupedSets] = useState<GroupedQuestionSets[]>([]);
  const [error, setError] = useState('');
  const [studyMode, setStudyMode] = useState<StudyMode>(() => parseStudyModeParam(searchParams.get('mode')));
  const [selectedGrade, setSelectedGrade] = useState<number | null>(() => parseGradeParam(searchParams.get('grade')));
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
        const response = await fetch('/api/question-sets/play?limit=100', {
          method: 'GET',
          credentials: 'same-origin',
        });

        if (response.ok) {
          const payload = await response.json();
          sets = payload.data || [];
        } else if (response.status === 401) {
          sets = await getRecentQuestionSets(100);
        } else {
          const payload = await response.json();
          const message = payload?.error || 'Kysymyssarjojen lataaminen epäonnistui';
          throw new Error(message);
        }

        const stripDifficultySuffix = (name: string): string => {
          const suffixes = [' - Helppo', ' - Normaali', ' - Kortit'];
          for (const suffix of suffixes) {
            if (name.endsWith(suffix)) {
              return name.slice(0, -suffix.length);
            }
          }
          return name;
        };

        const grouped = sets.reduce((acc, set) => {
          const cleanName = stripDifficultySuffix(set.name);
          const key = `${cleanName}|${set.subject}|${set.topic || ''}|${set.subtopic || ''}`;

          if (!acc[key]) {
            acc[key] = {
              key,
              name: cleanName,
              subject: set.subject,
              topic: set.topic,
              subtopic: set.subtopic,
              grade: set.grade,
              sets: [],
            };
          }

          acc[key].sets.push(set);
          return acc;
        }, {} as Record<string, GroupedQuestionSets>);

        const groupedArray = Object.values(grouped);

        if (groupedArray.length === 0) {
          setError('Ei vielä kysymyssarjoja. Luo ensimmäinen!');
        }

        setGroupedSets(groupedArray);
        setState('loaded');
      } catch (err) {
        logger.error({ error: err }, 'Error loading question sets');
        setError('Kysymyssarjojen lataaminen epäonnistui');
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

  if (state === 'loading') {
    return <PlayBrowsePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <ModeClassBar
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
        scrolled={scrolled}
      />

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 md:p-12">
        <div className="mb-5 hidden sm:block">
          <div className="mb-1.5 flex items-center gap-2">
            <BookOpenText size={28} weight="duotone" className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">Valitse aihealue</h1>
          </div>
        </div>
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
                  className="px-8 text-base"
                >
                  <Sparkle size={20} weight="fill" />
                  Luo kysymyssarja
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="rounded-lg px-8 py-3 text-base font-semibold"
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
                    <Button onClick={() => setSearchQuery('')} variant="outline">
                      Tyhjennä haku
                    </Button>
                  )}
                  {selectedGrade && (
                    <Button onClick={() => setSelectedGrade(null)} variant="outline">
                      Näytä kaikki luokat
                    </Button>
                  )}
                </div>
              </div>
            )}

            {filteredSets.length > 0 && (
              <div className="space-y-4">
                {filteredSets.map((group) => (
                  <QuestionSetCard key={group.key} group={group} studyMode={studyMode} router={router} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PlayBrowsePage() {
  return (
    <Suspense fallback={<PlayBrowsePageSkeleton />}>
      <PlayBrowsePageContent />
    </Suspense>
  );
}
