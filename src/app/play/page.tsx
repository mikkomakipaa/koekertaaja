'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ModeToggle } from '@/components/play/ModeToggle';
import { CollapsibleSearch } from '@/components/ui/collapsible-search';
import { SearchSuggestions } from '@/components/ui/search-suggestions';
import { cn } from '@/lib/utils';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { getGradeColors } from '@/lib/utils/grade-colors';
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
  Sparkle,
  BookOpenText,
  GameController,
  Book,
  BookOpen,
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowRight,
  ListNumbers,
  GraduationCap,
  MagnifyingGlass,
  X,
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
};

const difficultyColors: Record<string, { bg: string; hover: string; text: string; icon: string; focus: string; shadow: string }> = {
  helppo: {
    bg: 'bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
    hover: 'hover:from-slate-700 hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700',
    text: 'text-white',
    icon: 'text-cyan-400',
    focus: 'focus-visible:ring-cyan-400 dark:focus-visible:ring-cyan-300',
    shadow: 'shadow-slate-600/30 dark:shadow-slate-500/30',
  },
  normaali: {
    bg: 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    hover: 'hover:from-amber-600 hover:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800',
    text: 'text-white',
    icon: 'text-amber-100',
    focus: 'focus-visible:ring-amber-400 dark:focus-visible:ring-amber-300',
    shadow: 'shadow-amber-500/30 dark:shadow-amber-600/30',
  },
};

const difficultyIcons: Record<string, ReactNode> = {
  helppo: <Circle size={20} weight="bold" className="inline" />,
  normaali: <CirclesFour size={20} weight="bold" className="inline" />,
};

const subjectConfigs: Record<string, SubjectConfig> = {
  english: {
    icon: <GlobeHemisphereWest size={24} weight="duotone" />,
    label: 'Englanti',
    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  math: {
    icon: <MathOperations size={24} weight="duotone" />,
    label: 'Matematiikka',
    color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  history: {
    icon: <Scroll size={24} weight="duotone" />,
    label: 'Historia',
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  },
  society: {
    icon: <Bank size={24} weight="duotone" />,
    label: 'Yhteiskuntaoppi',
    color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
  biology: {
    icon: <Leaf size={24} weight="duotone" />,
    label: 'Biologia',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  },
  geography: {
    icon: <MapTrifold size={24} weight="duotone" />,
    label: 'Maantiede',
    color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  },
  finnish: {
    icon: <BookOpenText size={24} weight="duotone" />,
    label: 'Äidinkieli',
    color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  },
};

const getSubjectConfig = (subject: string): SubjectConfig => {
  return (
    subjectConfigs[subject] ?? {
      icon: <BookOpenText size={24} weight="duotone" />,
      label: subject,
      color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    }
  );
};

const getSubjectWithIcon = (subject: string) => {
  const config = getSubjectConfig(subject);

  return (
    <div className="mb-3 flex items-center gap-3">
      <div className={`rounded-lg p-2 ${config.color}`}>{config.icon}</div>
      <div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
      </div>
    </div>
  );
};

const getAvailableDifficulties = (sets: QuestionSet[]) => {
  return ['helppo', 'normaali'].filter((difficulty) =>
    sets.some((set) => set.difficulty === difficulty && set.mode === 'quiz')
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
    <Card variant="interactive" padding="standard" className="relative overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          availableDifficulties.length > 0 && groupHasFlashcards
            ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-teal-500'
            : availableDifficulties.length > 0
              ? 'bg-indigo-500'
              : groupHasFlashcards
                ? 'bg-teal-500'
                : 'bg-gray-300'
        }`}
      />

      <div className="ml-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
            {showNewBadge && (
              <Badge variant="gradient" semantic="new" size="xs">
                <Sparkle size={9} weight="fill" />
                Uusi
              </Badge>
            )}
          </div>
          {group.grade && (
            <Badge
              semantic="grade"
              size="xs"
              className={cn(getGradeColors(group.grade).bg, getGradeColors(group.grade).text)}
            >
              Luokka: {group.grade}
            </Badge>
          )}
        </div>

        {getSubjectWithIcon(group.subject)}

        <div className="mt-4 flex flex-wrap gap-2">
          {studyMode === 'pelaa' ? (
            availableDifficulties.length > 0 ? (
              availableDifficulties.map((difficulty) => {
                const set = group.sets.find((s) => s.difficulty === difficulty && s.mode === 'quiz');
                const colors = difficultyColors[difficulty];
                const icon = difficultyIcons[difficulty];

                return (
                  <Button
                    key={difficulty}
                    onClick={() => set && router.push(`/play/${set.code}?mode=${studyMode}`)}
                    mode={difficulty === 'helppo' ? 'neutral' : 'quiz'}
                    variant="primary"
                    size="default"
                    className={cn(colors.bg, colors.hover, colors.text, colors.focus, colors.shadow)}
                    aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
                  >
                    <span className={colors.icon}>{icon}</span>
                    {difficultyLabels[difficulty]}
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
              className="shadow-rose-500/30 dark:shadow-rose-600/30"
              aria-label="Kertaa virheet"
            >
              <ArrowCounterClockwise size={20} weight="duotone" className="inline" />
              Kertaa virheet ({reviewCandidate.count})
            </Button>
          )}
        </div>

        {lastScore && scoreIcon && (
          <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Viimeisin tulos:</span>
              <div className="flex items-center gap-1.5">
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

export default function PlayBrowsePage() {
  const router = useRouter();

  const [state, setState] = useState<BrowseState>('loading');
  const [groupedSets, setGroupedSets] = useState<GroupedQuestionSets[]>([]);
  const [error, setError] = useState('');
  const [studyMode, setStudyMode] = useState<StudyMode>('pelaa');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsBlurTimeout = useRef<number | null>(null);
  const gradeScrollRef = useRef<HTMLDivElement | null>(null);
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

  const gradeButtonBase =
    'flex min-h-10 flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95 active:shadow-sm dark:shadow-md dark:hover:shadow-lg dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900';

  const handleGradeScrollKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!gradeScrollRef.current) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      gradeScrollRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      gradeScrollRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

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

        <div className="mx-auto max-w-4xl p-6 md:p-12">
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

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <div className="hidden sm:block">
        <ModeToggle
          currentMode={studyMode}
          onModeChange={setStudyMode}
          className={scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : ''}
        />
      </div>

      <div
        className={`sm:hidden sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm transition-shadow duration-150 dark:border-gray-700 dark:bg-gray-900/90 ${
          scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : ''
        }`}
      >
        <div className="mx-auto max-w-4xl px-3 pt-3">
          <div className="flex gap-3">
            <button
              onClick={() => setStudyMode('pelaa')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                studyMode === 'pelaa'
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-current={studyMode === 'pelaa' ? 'page' : undefined}
            >
              <GameController size={18} weight={studyMode === 'pelaa' ? 'fill' : 'regular'} />
              Pelaa
            </button>
            <button
              onClick={() => setStudyMode('opettele')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                studyMode === 'opettele'
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-current={studyMode === 'opettele' ? 'page' : undefined}
            >
              <Book size={18} weight={studyMode === 'opettele' ? 'fill' : 'regular'} />
              Opettele
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-3 pt-2">
          <div className="flex min-h-12 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <BookOpen size={20} weight="duotone" className="text-indigo-600 dark:text-indigo-400" />
              <span className="truncate text-lg font-bold leading-none text-gray-900 dark:text-gray-100">Valitse aihealue</span>
            </div>
            {!searchOpen && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Avaa haku"
              >
                <MagnifyingGlass size={20} weight="duotone" />
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Takaisin valikkoon"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-3 pb-3 pt-2">
          {searchOpen ? (
            <div className="relative">
              <CollapsibleSearch
                placeholder="Etsi aihealuetta, ainetta tai aihetta..."
                value={searchQuery}
                onChange={setSearchQuery}
                isOpen={searchOpen}
                onToggle={setSearchOpen}
                onClose={() => setSuggestionsOpen(false)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              <SearchSuggestions
                isOpen={searchOpen && suggestionsOpen}
                query={searchQuery}
                popular={popularSearches}
                recent={recentSearches}
                suggestions={liveSuggestions}
                onSelect={handleSuggestionSelect}
                onClearRecent={clearRecentSearches}
              />
            </div>
          ) : (
            availableGrades.length > 0 && (
              <div
                ref={gradeScrollRef}
                className="flex gap-2 overflow-x-auto overflow-y-visible px-3 py-1 scroll-px-3 no-scrollbar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
                onKeyDown={handleGradeScrollKeyDown}
                tabIndex={0}
                aria-label="Luokkasuodattimet"
              >
                <button
                  onClick={() => setSelectedGrade(null)}
                  className={`${gradeButtonBase} ${
                    selectedGrade === null
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 dark:bg-indigo-500 dark:ring-indigo-300'
                      : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                  }`}
                >
                  <ListNumbers size={16} weight={selectedGrade === null ? 'fill' : 'regular'} />
                  Kaikki
                </button>
                {availableGrades.map((grade) => {
                  const colors = getGradeColors(grade);
                  const isActive = selectedGrade === grade;
                  return (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`${gradeButtonBase} ${
                        isActive
                          ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-current/40 dark:shadow-lg`
                          : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                      }`}
                    >
                      <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
                      {grade} lk
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6 md:p-12">
        <div className="mb-6 hidden sm:block">
          <div className="mb-2 flex items-center gap-2">
            <BookOpenText size={28} weight="duotone" className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">Valitse aihealue</h1>
          </div>
          <div className="mt-2">
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              ← Takaisin valikkoon
            </Button>
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
            <div className="mb-6 hidden sm:block">
              <div className="relative">
                <MagnifyingGlass
                  size={20}
                  weight="duotone"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Etsi aihealuetta, ainetta tai aihetta..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && searchQuery.trim()) {
                      addRecentSearch(searchQuery);
                      setSuggestionsOpen(false);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm placeholder:text-gray-400 transition-shadow focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:ring-purple-400 md:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label="Tyhjennä haku"
                  >
                    <X size={20} weight="bold" />
                  </button>
                )}
                <SearchSuggestions
                  isOpen={suggestionsOpen}
                  query={searchQuery}
                  popular={popularSearches}
                  recent={recentSearches}
                  suggestions={liveSuggestions}
                  onSelect={handleSuggestionSelect}
                  onClearRecent={clearRecentSearches}
                />
              </div>
            </div>

            {availableGrades.length > 0 && (
              <div className="mb-6 hidden sm:block">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGrade(null)}
                    className={`${gradeButtonBase} ${
                      selectedGrade === null
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 dark:bg-indigo-500 dark:shadow-lg dark:ring-indigo-300'
                        : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ListNumbers size={16} weight={selectedGrade === null ? 'fill' : 'regular'} />
                    Kaikki
                  </button>
                  {availableGrades.map((grade) => {
                    const colors = getGradeColors(grade);
                    const isActive = selectedGrade === grade;
                    return (
                      <button
                        key={grade}
                        onClick={() => setSelectedGrade(grade)}
                        className={`${gradeButtonBase} ${
                          isActive
                            ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-current/40 dark:shadow-lg`
                            : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700'
                        }`}
                      >
                        <GraduationCap size={16} weight={isActive ? 'fill' : 'regular'} />
                        {grade} lk
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
