'use client';

import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react';

// Force dynamic rendering (no static optimization)
// Prevents "document is not defined" error during build
export const dynamic = 'force-dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MathText } from '@/components/ui/math-text';
import { Textarea } from '@/components/ui/textarea';
import { LoadingScreen } from '@/components/ui/loading';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { VisualQuestionPreview } from '@/components/questions/VisualQuestionPreview';
import { ProgressBar } from '@/components/play/ProgressBar';
import { ResultsScreen } from '@/components/play/ResultsScreen';
import { FlashcardSession } from '@/components/play/FlashcardSession';
import { useGameSession } from '@/hooks/useGameSession';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useSessionProgress } from '@/hooks/useSessionProgress';
import { getQuestionSetByCode } from '@/lib/supabase/queries';
import { convertQuestionsToFlashcards } from '@/lib/utils/flashcardConverter';
import { shuffleArray } from '@/lib/utils';
import { QuestionSetWithQuestions, StudyMode, Flashcard, type QuestionType, type QuestionFlagReason } from '@/types';
import { createLogger } from '@/lib/logger';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ListBullets,
  DiamondsFour,
  Fire,
  Book,
  ArrowCounterClockwise,
  GameController,
  ArrowRight,
  TextT,
  ListChecks,
  CheckCircle,
  Shuffle,
  ChatText,
  ListNumbers,
  Article,
  Smiley,
  Target,
  X,
  Flag,
} from '@phosphor-icons/react';

type PlayState = 'loading' | 'error' | 'playing' | 'results';

const logger = createLogger({ module: 'play.by-code' });

const getQuestionTypeInfo = (type: QuestionType): { label: string; icon: ReactNode } => {
  const typeMap: Record<QuestionType, { label: string; icon: ReactNode }> = {
    fill_blank: {
      label: 'Täydennä lause',
      icon: <TextT size={14} weight="duotone" />,
    },
    multiple_choice: {
      label: 'Monivalinta',
      icon: <ListChecks size={14} weight="duotone" />,
    },
    true_false: {
      label: 'Totta vai tarua',
      icon: <CheckCircle size={14} weight="duotone" />,
    },
    matching: {
      label: 'Yhdistä parit',
      icon: <Shuffle size={14} weight="duotone" />,
    },
    short_answer: {
      label: 'Lyhyt vastaus',
      icon: <ChatText size={14} weight="duotone" />,
    },
    sequential: {
      label: 'Järjestä oikein',
      icon: <ListNumbers size={14} weight="duotone" />,
    },
    flashcard: {
      label: 'Flashcard',
      icon: <Book size={14} weight="duotone" />,
    },
  };

  return typeMap[type] ?? {
    label: 'Kysymys',
    icon: <Article size={14} weight="duotone" />,
  };
};

const getPlaceholderHint = (questionType: QuestionType, questionText: string): string => {
  const baseHints: Record<QuestionType, string> = {
    fill_blank: 'Esim: sana, termi tai lyhyt vastaus',
    short_answer: 'Kirjoita omin sanoin (1-3 lausetta)',
    multiple_choice: 'Valitse yksi vaihtoehto',
    true_false: 'Valitse totta tai tarua',
    matching: 'Yhdistä oikeat parit',
    sequential: 'Järjestä kohteet oikeaan järjestykseen',
    flashcard: 'Näytä vastaus ja arvioi muistaminen',
  };

  const lowerText = questionText.toLowerCase();
  if (questionType === 'fill_blank' && lowerText.includes('miksi')) {
    return 'Vinkki: aloita sanalla koska...';
  }

  return baseHints[questionType];
};

const flagReasons: Array<{ value: QuestionFlagReason; label: string; description: string }> = [
  { value: 'wrong_answer', label: 'Vastaus on väärin', description: 'Oikea vastaus ei pidä paikkaansa' },
  { value: 'ambiguous', label: 'Kysymys on epäselvä', description: 'Useampi tulkinta mahdollinen' },
  { value: 'typo', label: 'Kirjoitusvirhe', description: 'Selkeä virhe tekstissä' },
  { value: 'other', label: 'Muu syy', description: 'Jokin muu ongelma' },
];

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const modeParam = searchParams.get('mode');
  const draftParam = searchParams.get('draft') === '1';
  const isReviewMode = modeParam === 'review';
  const studyMode: StudyMode = modeParam === 'opettele' ? 'opettele' : 'pelaa';
  const isFlashcardMode = studyMode === 'opettele';
  const allCodes = searchParams.get('all'); // Comma-separated codes for study mode
  const topRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<PlayState>('loading');
  const [questionSet, setQuestionSet] = useState<QuestionSetWithQuestions | null>(null);
  const [error, setError] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState<QuestionFlagReason | ''>('');
  const [flagNote, setFlagNote] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagFeedback, setFlagFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastModeRef = useRef<string | null>(null);
  const { getMistakes, removeMistake, mistakeCount, error: mistakesError } = useReviewMistakes(code);
  const { updateProgress, clearProgress } = useSessionProgress(questionSet?.code ?? code);

  const mistakeQuestions = useMemo(() => {
    if (!isReviewMode || !questionSet?.questions) return [];
    const mistakes = getMistakes();
    const mistakeIds = new Set(mistakes.map(m => m.questionId));
    return questionSet.questions.filter(question => mistakeIds.has(question.id));
  }, [isReviewMode, questionSet?.questions, getMistakes, mistakeCount]);

  const {
    currentQuestion,
    currentQuestionIndex,
    selectedQuestions,
    userAnswer,
    showExplanation,
    score,
    answers,
    isLastQuestion,
    totalPoints,
    currentStreak,
    bestStreak,
    mistakesError: sessionMistakesError,
    setUserAnswer,
    submitAnswer,
    skipQuestion,
    nextQuestion,
    startNewSession,
  } = useGameSession(
    questionSet?.questions || [],
    questionSet?.exam_length ?? 15,
    questionSet?.grade, // pass grade for age-appropriate answer checking
    questionSet?.subject,
    isReviewMode,
    mistakeQuestions,
    questionSet?.code
  );

  useEffect(() => {
    try {
      const storedId = localStorage.getItem('koekertaaja_client_id');
      if (storedId) {
        setClientId(storedId);
        return;
      }

      const newId = crypto.randomUUID();
      localStorage.setItem('koekertaaja_client_id', newId);
      setClientId(newId);
    } catch (error) {
      logger.warn({ error }, 'Failed to access localStorage for clientId');
      setClientId(null);
    }
  }, []);

  useEffect(() => {
    setFlagFeedback(null);
    setFlagReason('');
    setFlagNote('');
    setFlagDialogOpen(false);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldBlockBack = state === 'playing' && !isReviewMode;
    if (!shouldBlockBack) return;

    const pushGuardState = () => {
      window.history.pushState({ koekertaajaGuard: true }, '', window.location.href);
    };

    pushGuardState();

    const handlePopState = () => {
      setShowExitConfirm(true);
      pushGuardState();
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state, isReviewMode]);

  // Load question set(s)
  useEffect(() => {
    const loadQuestionSet = async () => {
      try {
        setState('loading');

        let adminCheckPromise: Promise<boolean> | null = null;
        const checkAdminStatus = async (): Promise<boolean> => {
          if (!adminCheckPromise) {
            adminCheckPromise = (async () => {
              try {
                const response = await fetch('/api/question-sets/publish', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'same-origin',
                  body: JSON.stringify({
                    questionSetId: '00000000-0000-0000-0000-000000000000',
                    status: 'created',
                  }),
                });
                return response.status === 400 || response.status === 404;
              } catch {
                return false;
              }
            })();
          }
          return adminCheckPromise;
        };

        const fetchByCode = async (codeValue: string, includeDrafts: boolean) => {
          const byCodeUrl = new URL('/api/question-sets/by-code', window.location.origin);
          byCodeUrl.searchParams.set('code', codeValue.trim());
          if (includeDrafts) {
            byCodeUrl.searchParams.set('includeDrafts', '1');
          }

          const response = await fetch(byCodeUrl.toString(), {
            method: 'GET',
            credentials: 'same-origin',
          });

          if (response.ok) {
            const payload = await response.json();
            return payload.data as QuestionSetWithQuestions;
          }

          if (response.status === 401) {
            return null;
          }

          if (response.status === 404) {
            // If the set isn't published, allow admins to retry with drafts included.
            if (!includeDrafts) {
              const isAdminUser = await checkAdminStatus();
              if (isAdminUser) {
                return fetchByCode(codeValue, true);
              }
            }
            return null;
          }

          const payload = await response.json();
          const message = payload?.error || 'Kysymyssarjan lataaminen epäonnistui';
          throw new Error(message);
        };

        // If allCodes parameter exists, load all question sets for study mode
        if (allCodes && studyMode === 'opettele') {
          const codes = allCodes.split(',');
          const allSets = await Promise.all(
            codes.map(async (c) => {
              const trimmed = c.trim();
              const adminSet = await fetchByCode(trimmed, draftParam);
              if (adminSet) {
                return adminSet;
              }
              return getQuestionSetByCode(trimmed);
            })
          );

          // Filter out any null results and combine questions
          const validSets = allSets.filter(s => s !== null) as QuestionSetWithQuestions[];

          if (validSets.length === 0) {
            setError('Kysymyssarjoja ei löytynyt. Tarkista koodit tai varmista että kysymyssarjat on julkaistu.');
            setState('error');
            return;
          }

          // Use first set as the base, but combine all questions
          const combinedSet = {
            ...validSets[0],
            questions: validSets.flatMap(s => s.questions),
            question_count: validSets.reduce((sum, s) => sum + s.question_count, 0),
            exam_length: validSets[0]?.exam_length ?? 15,
          };

          setQuestionSet(combinedSet);
          // Convert all questions to flashcards (excludes sequential questions)
          const cards = convertQuestionsToFlashcards(combinedSet.questions);
          // Shuffle flashcards for varied practice
          setFlashcards(shuffleArray(cards));
          // Extract unique topics from questions
          const topics = [...new Set(
            combinedSet.questions
              .map(q => q.topic)
              .filter((t): t is string => t !== null && t !== undefined && t.trim().length > 0)
          )];
          setAvailableTopics(topics);
          // Auto-select if only one topic or no topics
          if (topics.length <= 1) {
            setSelectedTopic('ALL');
          }
          setState('playing');
        } else {
          // Normal single question set loading
          const adminSet = await fetchByCode(code, draftParam);
          const data = adminSet || await getQuestionSetByCode(code);

          if (!data) {
            setError(`Kysymyssarjaa ei löytynyt koodilla: ${code}. Tarkista koodi tai varmista että kysymyssarja on julkaistu.`);
            setState('error');
            return;
          }

          setQuestionSet(data);
          // Convert questions to flashcards (excludes sequential questions)
          const cards = convertQuestionsToFlashcards(data.questions);
          // Shuffle flashcards for varied practice
          setFlashcards(shuffleArray(cards));
          // Extract unique topics from questions
          const topics = [...new Set(
            data.questions
              .map(q => q.topic)
              .filter((t): t is string => t !== null && t !== undefined && t.trim().length > 0)
          )];
          setAvailableTopics(topics);
          // Auto-select if only one topic or no topics
          if (topics.length <= 1) {
            setSelectedTopic('ALL');
          }

          setState('playing');
        }
      } catch (err) {
        logger.error({ error: err }, 'Error loading question set');
        setError('Kysymyssarjan lataaminen epäonnistui');
        setState('error');
      }
    };

    if (code) {
      loadQuestionSet();
    }
  }, [code, allCodes, studyMode, draftParam]);

  // Start new session when question set loads
  useEffect(() => {
    if (
      questionSet &&
      state === 'playing' &&
      selectedQuestions.length === 0 &&
      (!isReviewMode || mistakeQuestions.length > 0)
    ) {
      startNewSession();
      setSessionStartTime(Date.now());
    }
  }, [questionSet, state, selectedQuestions.length, startNewSession, isReviewMode, mistakeQuestions.length]);

  useEffect(() => {
    if (!questionSet) return;
    if (modeParam === lastModeRef.current) return;
    lastModeRef.current = modeParam;

    if (isReviewMode) {
      setState('playing');
      startNewSession();
      setSessionStartTime(Date.now());
    }
  }, [modeParam, isReviewMode, questionSet, startNewSession]);

  useEffect(() => {
    if (!isReviewMode || !questionSet) return;
    const mistakes = getMistakes();
    if (mistakes.length === 0) return;
    const validIds = new Set(questionSet.questions.map(question => question.id));
    const invalidMistakes = mistakes.filter(mistake => !validIds.has(mistake.questionId));
    invalidMistakes.forEach(mistake => removeMistake(mistake.questionId));
  }, [isReviewMode, questionSet, getMistakes, removeMistake]);

  const isAnswerEmpty = useCallback((answer: unknown) => {
    if (answer === null || answer === '') return true;
    if (typeof answer === 'object') {
      return Object.keys(answer as Record<string, unknown>).length === 0;
    }
    return false;
  }, []);

  const clearAnswer = useCallback(() => {
    if (showExplanation) return;
    if (typeof userAnswer === 'string') {
      setUserAnswer('');
      return;
    }
    if (Array.isArray(userAnswer)) {
      setUserAnswer([]);
      return;
    }
    if (userAnswer && typeof userAnswer === 'object') {
      setUserAnswer({});
      return;
    }
    setUserAnswer(null);
  }, [showExplanation, userAnswer, setUserAnswer]);

  const handleSubmitAnswer = useCallback(() => {
    submitAnswer();
  }, [submitAnswer]);

  const handleSkipQuestion = useCallback(() => {
    skipQuestion();
  }, [skipQuestion]);

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setState('results');
    } else {
      nextQuestion();
      // Scroll to top for next question (instant scroll for Safari compatibility)
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }, 0);
    }
  };

  const handleSubmitFlag = async () => {
    if (!currentQuestion) return;

    if (!clientId) {
      setFlagFeedback({ type: 'error', message: 'Laitteen tunnistetta ei löytynyt.' });
      return;
    }

    if (!flagReason) {
      setFlagFeedback({ type: 'error', message: 'Valitse syy ennen lähetystä.' });
      return;
    }

    setFlagSubmitting(true);
    setFlagFeedback(null);

    try {
      const response = await fetch('/api/question-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionSetId: currentQuestion.question_set_id,
          reason: flagReason,
          note: flagNote.trim() ? flagNote.trim() : undefined,
          clientId,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = payload?.error || 'Ilmoituksen lähetys epäonnistui';
        if (response.status === 429) {
          setFlagFeedback({ type: 'error', message: 'Voit tehdä enintään 3 ilmoitusta 24 tunnin aikana.' });
        } else {
          setFlagFeedback({ type: 'error', message: errorMessage });
        }
        return;
      }

      setFlaggedQuestionIds((prev) =>
        prev.includes(currentQuestion.id) ? prev : [...prev, currentQuestion.id]
      );
      setFlagFeedback({ type: 'success', message: 'Kiitos ilmoituksesta! Tutkimme asian.' });
      setFlagDialogOpen(false);
    } catch (error) {
      logger.error({ error }, 'Failed to submit flag');
      setFlagFeedback({ type: 'error', message: 'Ilmoituksen lähetys epäonnistui. Yritä uudelleen.' });
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Scroll to top when a new question loads
  useEffect(() => {
    if (currentQuestion && !showExplanation) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
        // Fallback for older browsers
        window.scrollTo(0, 0);
      }, 0);
    }
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (isFlashcardMode || state !== 'playing') return;
    if (selectedQuestions.length === 0) return;
    updateProgress(answers.length, selectedQuestions.length);
  }, [answers.length, isFlashcardMode, selectedQuestions.length, state, updateProgress]);

  useEffect(() => {
    if (isFlashcardMode) return;
    if (state === 'results') {
      clearProgress();
    }
  }, [clearProgress, isFlashcardMode, state]);

  useEffect(() => {
    if (isFlashcardMode || state !== 'playing') return;
    if (!currentQuestion) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearAnswer();
        return;
      }

      const isFillBlank = currentQuestion.question_type === 'fill_blank';
      if (
        event.key === 'Enter'
        && isFillBlank
        && !showExplanation
        && !isAnswerEmpty(userAnswer)
      ) {
        event.preventDefault();
        handleSubmitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    isFlashcardMode,
    state,
    currentQuestion,
    showExplanation,
    userAnswer,
    clearAnswer,
    isAnswerEmpty,
    handleSubmitAnswer,
  ]);

  const handlePlayAgain = () => {
    startNewSession();
    setSessionStartTime(Date.now());
    setState('playing');
  };

  const handleBrowseQuestionSets = () => {
    router.push('/play');
  };

  const handleBackToMenu = () => {
    router.push('/play');
  };

  const handleReviewMistakes = () => {
    router.push(`/play/${code}?mode=review`);
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <LoadingScreen
        message="Ladataan kysymyssarjaa..."
        accent={isFlashcardMode ? 'teal' : 'indigo'}
      />
    );
  }

  // Error screen
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleBackToMenu} variant="outline">
            Takaisin valikkoon
          </Button>
        </div>
      </div>
    );
  }

  // Results screen
  if (state === 'results') {
    const durationSeconds = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime) / 1000)
      : undefined;

    return (
      <ResultsScreen
        score={score}
        total={selectedQuestions.length}
        answers={answers}
        totalPoints={totalPoints}
        bestStreak={bestStreak}
        questionSetCode={code}
        difficulty={questionSet?.difficulty}
        durationSeconds={durationSeconds}
        mode={isFlashcardMode ? 'flashcard' : 'quiz'}
        onPlayAgain={handlePlayAgain}
        onReviewMistakes={isReviewMode ? undefined : handleReviewMistakes}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Strip difficulty suffix from name for display
  const stripDifficultySuffix = (name: string): string => {
    const suffixes = [' - Helppo', ' - Normaali', ' - Vaikea'];
    for (const suffix of suffixes) {
      if (name.endsWith(suffix)) {
        return name.slice(0, -suffix.length);
      }
    }
    return name;
  };

  const displayName = questionSet?.name ? stripDifficultySuffix(questionSet.name) : 'Kysymyssarja';

  // Flashcard mode
  if (studyMode === 'opettele') {
    if (flashcards.length === 0) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors">
          <div className="text-center max-w-md p-6">
            <Book size={64} weight="duotone" className="text-teal-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Ei kortteja opeteltavaksi
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tämä kysymyssarja ei sisällä kysymyksiä, joita voi opetella korttitilassa.
            </p>
            <Button
              onClick={() => router.push('/play')}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Takaisin valintaan
            </Button>
          </div>
        </div>
      );
    }

    // Show topic selection if topics are available and none is selected
    if (availableTopics.length > 1 && !selectedTopic) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
          <div className="max-w-2xl mx-auto p-6 md:p-12">
            <div className="mb-8">
              <Book size={32} weight="duotone" className="text-teal-600 dark:text-teal-400 mb-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Valitse harjoiteltava aihe
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tämä korttisarja sisältää {availableTopics.length} aihetta. Valitse mitä haluat harjoitella.
              </p>
            </div>

            <div className="grid gap-3">
              {/* All Topics Option */}
              <button
                onClick={() => setSelectedTopic('ALL')}
                className="bg-white dark:bg-gray-800 border-2 border-teal-500 dark:border-teal-400 rounded-xl p-6 text-left hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Kaikki aiheet
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Harjoittele kaikkia aiheita ({flashcards.length} korttia)
                    </p>
                  </div>
                  <div className="text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </button>

              {/* Individual Topic Options */}
              {availableTopics.map((topic) => {
                const topicCardCount = flashcards.filter(f =>
                  questionSet?.questions.find(q => q.id === f.questionId)?.topic === topic
                ).length;

                return (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 text-left hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {topic}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {topicCardCount} korttia
                        </p>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <Button
                onClick={() => router.push('/play')}
                variant="ghost"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                ← Takaisin
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Filter flashcards by selected topic
    const filteredFlashcards = selectedTopic && selectedTopic !== 'ALL'
      ? flashcards.filter(f => {
          const question = questionSet?.questions.find(q => q.id === f.questionId);
          return question?.topic === selectedTopic;
        })
      : flashcards;

    return (
      <FlashcardSession
        flashcards={filteredFlashcards}
        questionSetName={selectedTopic && selectedTopic !== 'ALL' ? `${displayName} - ${selectedTopic}` : displayName}
        onExit={handleBackToMenu}
      />
    );
  }

  // Playing screen - show loading while session initializes
  if (!currentQuestion || selectedQuestions.length === 0) {
    if (isReviewMode && questionSet && mistakeQuestions.length === 0) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6 transition-colors">
          <div className="max-w-md text-center">
            <div className="mb-4 flex justify-center">
              <ArrowCounterClockwise size={56} weight="bold" className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Hienoa! Olet korjannut kaikki virheet. 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Voit palata valikkoon ja valita uuden harjoituksen.
            </p>
            <Button
              onClick={handleBackToMenu}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Takaisin valikkoon
            </Button>
          </div>
        </div>
      );
    }

    return (
      <LoadingScreen
        message="Valmistellaan kysymyksiä..."
        accent={isFlashcardMode ? 'teal' : 'indigo'}
      />
    );
  }

  const lastAnswer = answers[answers.length - 1];
  const lastWasCorrect = Boolean(lastAnswer?.isCorrect);
  const lastWasSkipped = Boolean(lastAnswer && lastAnswer.userAnswer === null && !lastAnswer.isCorrect);
  const lastPointsEarned = lastAnswer?.pointsEarned ?? 0;
  const lastStreakAtAnswer = lastAnswer?.streakAtAnswer ?? 0;
  const questionTypeInfo = getQuestionTypeInfo(currentQuestion.question_type);
  const placeholderHint = getPlaceholderHint(currentQuestion.question_type, currentQuestion.question_text);
  const difficulty = questionSet?.difficulty;
  const difficultyLabel = difficulty === 'helppo' ? 'Helppo' : difficulty === 'normaali' ? 'Normaali' : difficulty;
  const difficultyBadgeClass =
    difficulty === 'helppo'
      ? 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
      : difficulty === 'normaali'
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        : 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
  const difficultyIcon = difficulty === 'helppo'
    ? <Smiley size={14} weight="fill" />
    : <Target size={14} weight="duotone" />;
  const canSubmit = !isAnswerEmpty(userAnswer);
  const showKeyboardHint = currentQuestion.question_type === 'fill_blank' && !showExplanation;
  const hasFlaggedCurrent = flaggedQuestionIds.includes(currentQuestion.id);
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div ref={topRef} />
      {/* Header with progress */}
      {!isFlashcardMode && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 text-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Top section: Question set name + Exit button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GameController size={20} weight="fill" className="text-indigo-100" />
                <div>
                  <h2 className="text-base font-semibold md:text-lg">{displayName}</h2>
                  <p className="text-sm text-indigo-100">
                    Kysymys {currentQuestionIndex + 1} / {selectedQuestions.length}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowExitConfirm(true)}
                variant="ghost"
                size="sm"
                aria-label="Lopeta harjoitus"
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5 mr-1" />
                Lopeta
              </Button>
            </div>

            {/* Progress bar + Percentage (same row) */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestionIndex / selectedQuestions.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-indigo-100 font-medium whitespace-nowrap">
                {Math.round((currentQuestionIndex / selectedQuestions.length) * 100)}% valmis
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {(mistakesError || sessionMistakesError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{mistakesError || sessionMistakesError}</AlertDescription>
          </Alert>
        )}

        {isReviewMode && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 mb-5">
            <div className="flex items-center gap-2">
              <ArrowCounterClockwise size={24} weight="bold" className="text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-900 dark:text-red-100">
                Kertaat virheitä ({mistakeQuestions.length} kysymystä)
              </span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Vastaa oikein poistaaksesi kysymyksen virhelistalta
            </p>
          </div>
        )}

        {/* Question Card */}
        <Card variant="elevated" padding="responsive" className="mb-6 transition-colors shadow-sm">
          <CardContent>
            {(currentQuestion.requires_visual || currentQuestion.image_reference) && (
              <VisualQuestionPreview
                imageUrl={currentQuestion.image_url}
                altText={`Visuaali kysymykseen ${currentQuestionIndex + 1}`}
              />
            )}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-6">
              <MathText>{currentQuestion.question_text}</MathText>
            </h2>

            <QuestionRenderer
              question={currentQuestion}
              userAnswer={userAnswer}
              showExplanation={showExplanation}
              onAnswerChange={setUserAnswer}
              placeholderHint={placeholderHint}
            />

            {showKeyboardHint && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs">
                    Enter
                  </kbd>
                  <span>lähettää vastauksen</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 font-mono text-xs">
                    Esc
                  </kbd>
                  <span>tyhjentää</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback */}
        {showExplanation && (
          <div className="space-y-3 mb-6">
            {lastWasCorrect ? (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-900 dark:text-green-100 font-semibold">
                    ✓ Oikein! +{lastPointsEarned} pistettä
                    {lastStreakAtAnswer >= 3 && (
                      <span className="ml-2 text-sm text-green-700 dark:text-green-300">
                        (Putkibonus +5 pistettä!)
                      </span>
                    )}
                  </p>
                  {lastStreakAtAnswer >= 3 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <Fire size={20} weight="fill" className="text-orange-500" />
                      <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                        {lastStreakAtAnswer} putki
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-green-800 dark:text-green-200">
                  <DiamondsFour size={18} weight="duotone" className="text-amber-600 dark:text-amber-400" />
                  <span>{totalPoints} pistettä yhteensä</span>
                </div>
              </div>
            ) : lastWasSkipped ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-4">
                <p className="text-amber-900 dark:text-amber-100 font-semibold">Ohitit kysymyksen</p>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-red-900 dark:text-red-100 font-semibold">✗ Ei aivan oikein</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">Selitys:</p>
              <p className="text-blue-800 dark:text-blue-200">
                <MathText>{currentQuestion.explanation}</MathText>
              </p>
            </div>

          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!showExplanation ? (
            <div className="flex gap-3">
              <Button
                onClick={handleSkipQuestion}
                type="button"
                variant="secondary"
                aria-label="Ohita kysymys"
                className="flex-[0.3]"
              >
                Ohita
              </Button>
              <Button
                onClick={handleSubmitAnswer}
                disabled={!canSubmit}
                mode="quiz"
                variant="primary"
                className="flex-[0.7]"
              >
                Tarkista vastaus
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleNextQuestion}
              mode="quiz"
              variant="primary"
              className="w-full"
            >
              {isLastQuestion ? 'Näytä tulokset →' : 'Seuraava kysymys →'}
            </Button>
          )}
          <Dialog.Root open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
            {showExplanation ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 p-3 transition-shadow duration-150 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Valitse eri aihealue</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Selaa muita kysymyssarjoja.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowExitConfirm(true)}
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
                    >
                      <ListBullets weight="duotone" className="w-4 h-4" />
                      Valitse
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30 p-3 transition-shadow duration-150 hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Huomasitko virheen?</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Kysymykset ovat tekoälyn laatimia, niissä saattaa esiintyä virheitä.
                      </p>
                    </div>
                    <Dialog.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={hasFlaggedCurrent || !clientId}
                        onClick={() => {
                          setFlagFeedback(null);
                          setFlagReason('');
                          setFlagNote('');
                        }}
                        className="gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
                      >
                        <Flag size={16} weight="duotone" className="text-gray-700 dark:text-emerald-300" />
                        {hasFlaggedCurrent ? 'Ilmoitettu' : 'Ilmoita virhe'}
                      </Button>
                    </Dialog.Trigger>
                  </div>

                  {flagFeedback?.type === 'success' && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                      {flagFeedback.message}
                    </p>
                  )}
                  {hasFlaggedCurrent && !flagFeedback && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                      Kiitos ilmoituksesta! Tutkimme asian.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <Button
                onClick={handleBrowseQuestionSets}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
              >
                <ListBullets weight="duotone" className="w-4 h-4 mr-2 text-gray-600 dark:text-emerald-300" />
                Valitse eri aihealue
              </Button>
            )}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Ilmoita virhe kysymyksessä
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Sulje"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Syy</p>
                    <div className="grid gap-2">
                      {flagReasons.map((reason) => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => setFlagReason(reason.value)}
                          className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                            flagReason === reason.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reason.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{reason.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
                      Lisätieto (valinnainen)
                    </label>
                    <Textarea
                      value={flagNote}
                      onChange={(event) => setFlagNote(event.target.value)}
                      placeholder="Kerro lyhyesti, mikä on pielessä..."
                      className="min-h-[90px]"
                    />
                  </div>

                  {flagFeedback?.type === 'error' && (
                    <p className="text-sm text-red-600 dark:text-red-300">{flagFeedback.message}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Dialog.Close asChild>
                      <Button variant="secondary" type="button">
                        Peruuta
                      </Button>
                    </Dialog.Close>
                    <Button
                      type="button"
                      onClick={handleSubmitFlag}
                      disabled={flagSubmitting || !flagReason}
                      mode="quiz"
                      variant="primary"
                    >
                      {flagSubmitting ? 'Lähetetään...' : 'Lähetä ilmoitus'}
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 md:text-2xl">
              Haluatko varmasti lopettaa?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 md:text-base">
              Olet käynyt läpi {currentQuestionIndex + 1}/{selectedQuestions.length} kysymystä.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="secondary"
                className="w-full"
              >
                Jatka harjoittelua
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  handleBrowseQuestionSets();
                }}
                type="button"
                variant="destructive"
                className="w-full"
              >
                Lopeta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
