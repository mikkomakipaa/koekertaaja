'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModeToggle } from '@/components/play/ModeToggle';
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { QuestionSet, Difficulty, StudyMode } from '@/types';
import { readMistakesFromStorage } from '@/hooks/useReviewMistakes';
import {
  CircleNotch,
  GlobeHemisphereWest,
  MathOperations,
  Scroll,
  Bank,
  Books,
  Smiley,
  Target,
  Sparkle,
  BookOpenText,
  Book,
  ArrowCounterClockwise
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

export default function PlayBrowsePage() {
  const router = useRouter();

  const [state, setState] = useState<BrowseState>('loading');
  const [groupedSets, setGroupedSets] = useState<GroupedQuestionSets[]>([]);
  const [error, setError] = useState('');
  const [studyMode, setStudyMode] = useState<StudyMode>('pelaa');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  const difficultyLabels: Record<string, string> = {
    helppo: 'Helppo',
    normaali: 'Normaali',
  };

  const difficultyColors: Record<string, { bg: string; hover: string; text: string }> = {
    helppo: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-700' },
    normaali: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-700' },
  };

  const difficultyIcons: Record<string, React.ReactNode> = {
    helppo: <Smiley size={20} weight="fill" className="inline" />,
    normaali: <Target size={20} weight="duotone" className="inline" />,
  };

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

        // Helper function to remove difficulty suffix from name
        const stripDifficultySuffix = (name: string): string => {
          const suffixes = [' - Helppo', ' - Normaali', ' - Kortit'];
          for (const suffix of suffixes) {
            if (name.endsWith(suffix)) {
              return name.slice(0, -suffix.length);
            }
          }
          return name;
        };

        // Group question sets by name (without difficulty), subject, topic, subtopic
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
        console.error('Error loading question sets:', err);
        setError('Kysymyssarjojen lataaminen epäonnistui');
        setState('error');
      }
    };

    loadQuestionSets();
  }, []);

  const getSubjectLabel = (subject: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      english: (
        <span className="flex items-center gap-1.5">
          <GlobeHemisphereWest size={18} weight="duotone" className="text-blue-500" />
          Englanti
        </span>
      ),
      math: (
        <span className="flex items-center gap-1.5">
          <MathOperations size={18} weight="duotone" className="text-purple-500" />
          Matematiikka
        </span>
      ),
      history: (
        <span className="flex items-center gap-1.5">
          <Scroll size={18} weight="duotone" className="text-amber-600" />
          Historia
        </span>
      ),
      society: (
        <span className="flex items-center gap-1.5">
          <Bank size={18} weight="duotone" className="text-gray-600 dark:text-gray-400" />
          Yhteiskuntaoppi
        </span>
      ),
    };
    return iconMap[subject] || <span>{subject}</span>;
  };

  const getAvailableDifficulties = (sets: QuestionSet[]) => {
    return ['helppo', 'normaali'].filter(difficulty =>
      sets.some(set => set.difficulty === difficulty && set.mode === 'quiz')
    );
  };

  const hasFlashcards = (sets: QuestionSet[]) => {
    return sets.some(set => set.mode === 'flashcard');
  };

  // Get unique grades from all question sets, sorted
  const availableGrades = Array.from(
    new Set(groupedSets.map(g => g.grade).filter((g): g is number => g !== undefined))
  ).sort((a, b) => a - b);

  // Filter question sets by selected grade
  const filteredSets = selectedGrade
    ? groupedSets.filter(g => g.grade === selectedGrade)
    : groupedSets;

  const getGradeColors = (grade: number) => {
    // Each grade has its own unique color (grades 1-9)
    const gradeColorMap: Record<number, { bg: string; text: string }> = {
      1: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200' },
      2: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' },
      3: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200' },
      4: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200' },
      5: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200' },
      6: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200' },
      7: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200' },
      8: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200' },
      9: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200' },
    };

    return gradeColorMap[grade] || { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200' };
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <CircleNotch weight="bold" className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Ladataan aihealueita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {/* Mode Toggle */}
      <ModeToggle currentMode={studyMode} onModeChange={setStudyMode} />

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpenText size={28} weight="duotone" className="text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Valitse aihealue</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {studyMode === 'pelaa' ? 'Pelaa kysymyspeliä pisteiden kanssa' : 'Opettele korttien avulla'}
          </p>
        </div>

        {/* Grade Filter Buttons */}
        {availableGrades.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGrade(null)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedGrade === null
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Kaikki
              </button>
              {availableGrades.map((grade) => {
                const colors = getGradeColors(grade);
                return (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedGrade === grade
                        ? `${colors.bg} ${colors.text} shadow-md ring-2 ring-offset-2 ${colors.text.replace('text-', 'ring-')}`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Luokka: {grade}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {groupedSets.length === 0 && state === 'loaded' && (
          <div className="text-center py-16 px-6">
            <div className="max-w-md mx-auto">
              <div className="mb-6 flex justify-center">
                <Books size={80} weight="duotone" className="text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Ei vielä harjoituksia
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Luo ensimmäinen kysymyssarja aloittaaksesi harjoittelun
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push('/create')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-xl text-lg font-semibold flex items-center gap-2"
                >
                  <Sparkle size={20} weight="fill" />
                  Luo kysymyssarja
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="px-8 py-6 rounded-xl text-lg font-semibold"
                >
                  Takaisin valikkoon
                </Button>
              </div>
            </div>
          </div>
        )}

        {groupedSets.length > 0 && (
          <div className="space-y-4">
            {filteredSets.map((group) => {
              const availableDifficulties = getAvailableDifficulties(group.sets);
              const groupHasFlashcards = hasFlashcards(group.sets);
              const masterySet = group.sets.find(set => set.mode === 'quiz') ?? group.sets[0];
              const difficultyOrder: Difficulty[] = ['helppo', 'normaali'];
              const reviewCandidates = difficultyOrder
                .map(difficulty => group.sets.find(
                  set => set.difficulty === difficulty && set.mode === 'quiz'
                ))
                .filter((set): set is QuestionSet => Boolean(set))
                .map(set => ({
                  set,
                  count: readMistakesFromStorage(set.code).length,
                }));
              const reviewCandidate = reviewCandidates.find(candidate => candidate.count > 0);

              return (
                <div
                  key={group.key}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all"
                >
                  {/* Title and Grade */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {group.name}
                    </h3>
                    {group.grade && (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${getGradeColors(group.grade).bg} ${getGradeColors(group.grade).text}`}>
                        Luokka: {group.grade}
                      </span>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {getSubjectLabel(group.subject)}
                    </span>
                  </div>

                  {/* Area Badge */}
                  {(group.topic || group.subtopic) && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Aihealue: {[group.topic, group.subtopic].filter(Boolean).join(' → ')}
                      </span>
                    </div>
                  )}

                  {/* Difficulty Buttons (Play mode) or Single Study Button (Study mode) */}
                  <div className="flex flex-wrap gap-2">
                    {studyMode === 'pelaa' ? (
                      // Play mode: Show difficulty buttons for quiz sets only
                      availableDifficulties.length > 0 ? (
                        availableDifficulties.map((difficulty) => {
                          const set = group.sets.find(s => s.difficulty === difficulty && s.mode === 'quiz');
                          const colors = difficultyColors[difficulty];
                          const icon = difficultyIcons[difficulty];

                          return (
                            <button
                              key={difficulty}
                              onClick={() => set && router.push(`/play/${set.code}?mode=${studyMode}`)}
                              className={`${colors.bg} ${colors.hover} text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5`}
                              aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
                            >
                              {icon}
                              {difficultyLabels[difficulty]}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ei pelimuotoa saatavilla</p>
                      )
                    ) : (
                      // Study mode: Single button for flashcards only
                      groupHasFlashcards ? (
                        <button
                          onClick={() => {
                            const flashcardSet = group.sets.find(s => s.mode === 'flashcard');
                            if (flashcardSet) {
                              router.push(`/play/${flashcardSet.code}?mode=opettele`);
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                          aria-label="Opettele korttien avulla"
                        >
                          <Book size={20} weight="duotone" />
                          Opettele
                        </button>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ei kortteja saatavilla</p>
                      )
                    )}

                    {studyMode === 'pelaa' && reviewCandidate && (
                      <button
                        onClick={() => router.push(`/play/${reviewCandidate.set.code}?mode=review`)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                        aria-label="Kertaa virheet"
                      >
                        <ArrowCounterClockwise size={20} weight="bold" className="inline" />
                        Kertaa virheet ({reviewCandidate.count})
                      </button>
                    )}
                  </div>

                  {masterySet?.code && (
                    <TopicMasteryDisplay questionSetCode={masterySet.code} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Takaisin valikkoon
          </Button>
        </div>
      </div>
    </div>
  );
}
