import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Answer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MathText } from '@/components/ui/math-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { useBadges } from '@/hooks/useBadges';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { difficultyLabels } from '@/lib/play/primary-action';
import { cn } from '@/lib/utils';
import {
  buildQuestionDetails,
  formatResultAnswer,
  getCelebrationQueue,
  getNextCelebration,
  getResultsBreakdown,
  type CelebrationType,
  type QuestionDetailStatus,
  toggleQuestionExpanded
} from '@/lib/play/results-screen';
import { CelebrationModal } from '@/components/celebrations/CelebrationModal';
import {
  hasCelebratedAllBadges,
  hasCelebratedPerfectScore,
  markAllBadgesCelebrated,
  markPerfectScoreCelebrated,
} from '@/lib/utils/celebrations';
import { CheckCircle, XCircle, Medal, ArrowCounterClockwise, X, ArrowRight } from '@phosphor-icons/react';
import {
  Fire,
  Sparkle,
  Star,
  Confetti,
  Barbell,
  Target,
  Rocket,
} from '@phosphor-icons/react';

interface ResultsScreenProps {
  score: number;
  total: number;
  answers: Answer[];
  totalPoints: number;
  bestStreak: number;
  skippedQuestions?: string[];
  questionSetCode?: string;
  questionSetName?: string;
  difficulty?: string;
  durationSeconds?: number;
  mode?: 'quiz' | 'flashcard';
  onPlayAgain: () => void;
  onReviewMistakes?: () => void;
  onBackToMenu: () => void;
}

interface MathRendererProps {
  children: string;
  className?: string;
}

interface QuestionDetailCardProps {
  question: {
    id: string;
    question: string;
    correctAnswer: string;
    questionType?: Answer['questionType'];
    questionOptions?: string[];
    rawCorrectAnswer?: unknown;
    rawUserAnswer?: unknown;
  };
  status: QuestionDetailStatus;
  userAnswer?: string;
  isExpanded: boolean;
  onToggle: () => void;
  MathRenderer?: ComponentType<MathRendererProps>;
}

export function QuestionDetailCard({
  question,
  status,
  userAnswer,
  isExpanded,
  onToggle,
  MathRenderer = MathText,
}: QuestionDetailCardProps) {
  const statusIcon = {
    correct: <CheckCircle size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400" />,
    wrong: <X size={20} weight="bold" className="text-red-600 dark:text-red-400" />,
    skipped: <ArrowRight size={20} weight="bold" className="text-slate-500 dark:text-slate-400" />,
  };

  const statusText = {
    correct: 'Oikein',
    wrong: 'Väärin',
    skipped: 'Ohitettu',
  };

  const preview = question.question.length > 100
    ? `${question.question.substring(0, 100)}...`
    : question.question;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isExpanded}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {statusIcon[status]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{preview}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{statusText[status]}</p>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              <MathRenderer>{question.question}</MathRenderer>
            </p>

            {question.questionType === 'multiple_select'
              && Array.isArray(question.questionOptions)
              && Array.isArray(question.rawCorrectAnswer) && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Vastausvaihtoehdot:
                  </p>
                  {question.questionOptions.map((option, index) => {
                    const correctAnswers = question.rawCorrectAnswer as string[];
                    const userSelections = Array.isArray(question.rawUserAnswer)
                      ? question.rawUserAnswer.filter((value): value is string => typeof value === 'string')
                      : [];
                    const shouldSelect = correctAnswers.includes(option);
                    const userSelected = userSelections.includes(option);

                    const variant =
                      userSelected && shouldSelect ? 'correct-selection' :
                      userSelected && !shouldSelect ? 'wrong-selection' :
                      !userSelected && shouldSelect ? 'missed-correct' :
                      'correct-non-selection';

                    const icon =
                      userSelected && shouldSelect ? '✓' :
                      userSelected && !shouldSelect ? '✗' :
                      !userSelected && shouldSelect ? '○' :
                      '';

                    return (
                      <div
                        key={`${option}-${index}`}
                        className={cn(
                          'rounded-lg p-2 text-sm',
                          variant === 'correct-selection' && 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100',
                          variant === 'wrong-selection' && 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100',
                          variant === 'missed-correct' && 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100',
                          variant === 'correct-non-selection' && 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {icon && <span className="mr-2 font-bold">{icon}</span>}
                        <MathRenderer>{option}</MathRenderer>
                      </div>
                    );
                  })}
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <p>✓ = Oikein valittu</p>
                    <p>✗ = Väärin valittu</p>
                    <p>○ = Jäi valitsematta (pitäisi valita)</p>
                  </div>
                </div>
              )}

            {status === 'skipped' && (
              <div className="rounded bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Oikea vastaus:
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <MathRenderer>{question.correctAnswer}</MathRenderer>
                </p>
              </div>
            )}

            {status === 'wrong' && (
              <>
                <div className="rounded bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    Valitsit:
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <MathRenderer>{userAnswer || 'Ei vastausta'}</MathRenderer>
                  </p>
                </div>
                <div className="rounded bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Oikea vastaus:
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <MathRenderer>{question.correctAnswer}</MathRenderer>
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsScreen({
  score,
  total,
  answers,
  totalPoints,
  bestStreak,
  skippedQuestions,
  questionSetCode,
  questionSetName,
  difficulty,
  durationSeconds,
  mode = 'quiz',
  onPlayAgain,
  onReviewMistakes,
  onBackToMenu,
}: ResultsScreenProps) {
  const percentage = Math.round((score / total) * 100);
  const {
    badges,
    newlyUnlocked,
    recordSession,
    getPersonalBest,
    updatePersonalBest,
  } = useBadges(questionSetCode);
  const { mistakeCount } = useReviewMistakes(questionSetCode);
  const { saveLastScore } = useLastScore(questionSetCode);

  const [personalBest, setPersonalBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<CelebrationType | null>(null);
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationType[]>([]);
  const hasRecordedRef = useRef(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const sessionMistakeCount = answers.filter(answer => !answer.isCorrect).length;
  const { skippedCount, correctCount, wrongCount } = getResultsBreakdown(answers, skippedQuestions);
  const questionDetails = buildQuestionDetails(answers, skippedQuestions);
  const skippedAnswerCount = skippedCount > 0
    ? skippedCount
    : answers.filter(answer => answer.userAnswer === null && !answer.isCorrect).length;
  const reviewMistakeCount = mistakeCount > 0 ? mistakeCount : sessionMistakeCount;

  // Track if events have already been captured to prevent duplicates

  // Record session and check for new badges/records
  useEffect(() => {
    if (!questionSetCode || hasRecordedRef.current) return;

    const currentBest = getPersonalBest(questionSetCode);
    setPersonalBest(currentBest);

    const newRecord = updatePersonalBest(questionSetCode, totalPoints);
    setIsNewRecord(newRecord);

    recordSession({
      score,
      totalQuestions: total,
      bestStreak,
      totalPoints,
      durationSeconds,
      difficulty,
    });

    saveLastScore(score, total, difficulty);
    hasRecordedRef.current = true;
  }, [
    bestStreak,
    difficulty,
    durationSeconds,
    getPersonalBest,
    questionSetCode,
    recordSession,
    saveLastScore,
    score,
    total,
    totalPoints,
    updatePersonalBest,
  ]);

  useEffect(() => {
    if (badges.length === 0) {
      return;
    }

    const allBadgesUnlocked = badges.every((badge) => badge.unlocked);
    const shouldCelebratePerfectScore = questionSetCode ? hasCelebratedPerfectScore(questionSetCode) : true;
    const celebrations = getCelebrationQueue({
      score,
      total,
      skippedQuestions,
      questionSetCode,
      allBadgesUnlocked,
      hasCelebratedPerfect: shouldCelebratePerfectScore,
      hasCelebratedAllBadges: hasCelebratedAllBadges(),
    });

    if (celebrations.length === 0) {
      return;
    }

    if (celebrations.includes('perfect-score') && questionSetCode) {
      try {
        markPerfectScoreCelebrated(questionSetCode);
      } catch (error) {
        console.warn('Could not save celebration state:', error);
      }
    }

    if (celebrations.includes('all-badges')) {
      try {
        markAllBadgesCelebrated();
      } catch (error) {
        console.warn('Could not save celebration state:', error);
      }
    }

    setCelebrationQueue(celebrations);
    setShowCelebration(celebrations[0] ?? null);
  }, [badges, questionSetCode, score, skippedQuestions, total]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

  const handleCelebrationClose = () => {
    const nextCelebration = getNextCelebration(celebrationQueue, showCelebration);
    if (!nextCelebration) {
      setShowCelebration(null);
      setCelebrationQueue([]);
      return;
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setShowCelebration(nextCelebration);
    }, 300);
  };


  // Determine celebration level
  const getCelebration = () => {
    if (percentage === 100) return {
      icon: <Star size={34} weight="fill" className="text-yellow-500" />,
      text: 'W Pisteet.'
    };
    if (percentage >= 90) return {
      icon: <Rocket size={34} weight="duotone" className="text-purple-500" />,
      text: 'Sigma Suoritus.'
    };
    if (percentage >= 80) return {
      icon: <Fire size={34} weight="fill" className="text-orange-500" />,
      text: 'Slay Kierros.'
    };
    if (percentage >= 60) return {
      icon: <Target size={34} weight="duotone" className="text-blue-500" />,
      text: 'Vibe Tulos.'
    };
    return {
      icon: <Barbell size={34} weight="bold" className="text-orange-500" />,
      text: 'Mid Grindi.'
    };
  };

  const celebration = getCelebration();

  const modeColors = mode === 'quiz'
    ? {
        bg: 'from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        button: 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
      }
    : {
        bg: 'from-teal-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-teal-600 dark:text-teal-400',
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
        button: 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
      };

  const displayPersonalBest = personalBest > 0 ? (isNewRecord ? totalPoints : personalBest) : null;
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;
  const newlyUnlockedBadges = badges.filter(badge => newlyUnlocked.includes(badge.id));
  const difficultyLabel =
    difficulty && difficulty in difficultyLabels
      ? difficultyLabels[difficulty as keyof typeof difficultyLabels]
      : difficulty;
  const normalizedQuestionSetName = questionSetName?.trim();
  const questionSetAlreadyIncludesDifficulty = Boolean(
    normalizedQuestionSetName
      && difficultyLabel
      && normalizedQuestionSetName.toLocaleLowerCase('fi-FI').endsWith(`- ${difficultyLabel.toLocaleLowerCase('fi-FI')}`)
  );
  const resultsPrimaryMeta = [
    normalizedQuestionSetName,
    questionSetAlreadyIncludesDifficulty ? null : difficultyLabel,
  ].filter(Boolean).join(' • ');
  const resultsSecondaryMeta = `${score} / ${total} oikein (${percentage}%)`;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${modeColors.bg} p-4 md:p-8 pb-24 transition-colors`}>
      <div className="max-w-5xl mx-auto">
        <section className="mb-4 border-b border-slate-200/80 pb-4 dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
              {celebration.icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold leading-[1.1] tracking-tight text-slate-950 dark:text-slate-50 max-[480px]:text-[19px]">
                {celebration.text}
              </h1>
              {resultsPrimaryMeta ? (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {resultsPrimaryMeta}
                </p>
              ) : null}
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                {resultsSecondaryMeta}
              </p>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
            <CardContent>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600/70 dark:text-gray-400/70">
                <Fire size={18} weight="duotone" className="text-orange-500" />
                Paras putki
              </div>
              <div className="text-[28px] font-bold text-gray-900 dark:text-gray-100 md:text-[28px]">
                {bestStreak > 0 ? bestStreak : '—'}
              </div>
            </CardContent>
          </Card>
          <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
            <CardContent>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600/70 dark:text-gray-400/70">
                <ArrowCounterClockwise size={18} weight="duotone" className="text-amber-500" />
                Ohitetut
              </div>
              <div className="text-[28px] font-bold text-gray-900 dark:text-gray-100 md:text-[28px]">
                {skippedAnswerCount}
              </div>
            </CardContent>
          </Card>
          <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
            <CardContent>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600/70 dark:text-gray-400/70">
                <Medal size={18} weight="duotone" className="text-purple-500" />
                Uusia merkkejä
              </div>
              <div className="text-[28px] font-bold text-gray-900 dark:text-gray-100 md:text-[28px]">
                {newlyUnlockedBadges.length}
              </div>
            </CardContent>
          </Card>
          <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
            <CardContent>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-600/70 dark:text-gray-400/70">
                <Sparkle size={18} weight="duotone" className="text-emerald-500" />
                Henkilökohtainen ennätys
              </div>
              <div className="text-[28px] font-bold text-gray-900 dark:text-gray-100 md:text-[28px]">
                {displayPersonalBest ?? '—'}
              </div>
              {displayPersonalBest && isNewRecord && (
                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  Uusi ennätys! <Confetti size={14} weight="fill" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-5">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-none dark:border-slate-800 dark:bg-slate-900">
            <TabsTrigger value="overview" className="rounded-xl text-sm md:text-base">Yhteenveto</TabsTrigger>
            <TabsTrigger value="answers" className="rounded-xl text-sm md:text-base">Vastaukset</TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl text-sm md:text-base">
              Merkit ({unlockedBadgesCount}/{badges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-3">
            <Card variant="standard" padding="standard" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <Target size={18} weight="duotone" className="text-indigo-500" />
                  Aiheiden hallinta
                </div>
                <TopicMasteryDisplay questionSetCode={questionSetCode ?? ''} className="mt-2 border-t-0 pt-0" />
              </CardContent>
            </Card>

            <Card
              variant="standard"
              padding="standard"
              className="flex flex-col gap-4 rounded-xl border-slate-200 shadow-none dark:border-slate-800 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ArrowCounterClockwise size={18} weight="duotone" className="text-rose-500" />
                  Kertaa virheet
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Löytyi {reviewMistakeCount} virhettä, joita voit harjoitella uudelleen.
                </p>
              </div>
              {sessionMistakeCount > 0 && onReviewMistakes && (
                <Button onClick={onReviewMistakes} mode="review" variant="primary">
                  Kertaa virheet
                </Button>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="answers" className="mt-5">
            <Card variant="standard" padding="standard" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Vastausten yhteenveto
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-gray-600 dark:text-gray-400">Oikein: {correctCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X size={18} weight="bold" className="text-red-600 dark:text-red-400" />
                      <span className="text-gray-600 dark:text-gray-400">Väärin: {wrongCount}</span>
                    </div>
                    {skippedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <ArrowRight size={18} weight="bold" className="text-slate-500 dark:text-slate-400" />
                        <span className="text-gray-600 dark:text-gray-400">Ohitettu: {skippedCount}</span>
                      </div>
                    )}
                  </div>
                </div>
                {skippedQuestions && skippedQuestions.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Kysymykset</h3>
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {questionDetails.map((detail) => {
                        return (
                          <QuestionDetailCard
                            key={detail.id}
                            question={{
                              id: detail.id,
                              question: detail.question,
                              correctAnswer: detail.correctAnswer,
                              questionType: detail.questionType,
                              questionOptions: detail.questionOptions,
                              rawCorrectAnswer: detail.rawCorrectAnswer,
                              rawUserAnswer: detail.rawUserAnswer,
                            }}
                            status={detail.status}
                            userAnswer={detail.userAnswer}
                            isExpanded={expandedQuestionId === detail.id}
                            onToggle={() => {
                              setExpandedQuestionId((current) => toggleQuestionExpanded(current, detail.id));
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAllAnswers(false)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                        showAllAnswers
                          ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80'
                          : `border-transparent text-white ${modeColors.button}`
                      )}
                    >
                      Vain virheet
                    </button>
                    <button
                      onClick={() => setShowAllAnswers(true)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                        showAllAnswers
                          ? `border-transparent text-white ${modeColors.button}`
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80'
                      )}
                    >
                      Kaikki
                    </button>
                  </div>
                )}
                {!skippedQuestions || skippedQuestions.length === 0 ? (
                  <div className="space-y-2 max-h-[420px] md:max-h-[520px] overflow-y-auto pr-1">
                    {questionDetails.filter(detail => showAllAnswers || detail.status !== 'correct').map((detail) => {
                      const isSkipped = detail.status === 'skipped' || (detail.rawUserAnswer === null && detail.status === 'wrong');
                      return (
                        <div
                          key={detail.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            detail.status === 'correct'
                              ? 'bg-green-50 border-green-500'
                              : isSkipped
                                ? 'bg-amber-50 border-amber-500'
                                : 'bg-red-50 border-red-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {detail.status === 'correct' ? (
                              <CheckCircle weight="duotone" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : isSkipped ? (
                              <ArrowCounterClockwise weight="duotone" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle weight="duotone" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                <MathText>{detail.question}</MathText>
                              </p>
                              {isSkipped && (
                                <p className="text-sm text-amber-700 mt-1">Tämä kysymys ohitettiin aikarajan vuoksi.</p>
                              )}
                              {detail.status !== 'correct' && !isSkipped && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Oikea vastaus:{' '}
                                  <span className="font-semibold">
                                    <MathText>{detail.correctAnswer || formatResultAnswer(detail.rawCorrectAnswer, detail.questionType)}</MathText>
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="mt-5 space-y-4">
            <BadgeCollectionCard
              badges={badges}
              highlightedBadgeIds={newlyUnlocked}
              description="Tästä näet uudet avaukset ja kaikki vielä lukitut tavoitteet."
            />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="sticky bottom-4 z-10">
          <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onPlayAgain}
                mode={mode === 'flashcard' ? 'study' : 'quiz'}
                variant="primary"
                className="flex-1"
              >
                Pelaa uudelleen
              </Button>
              <Button
                onClick={onBackToMenu}
                variant="secondary"
                className="flex-1"
              >
                Takaisin valikkoon
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showCelebration && (
        <CelebrationModal
          type={showCelebration}
          onClose={handleCelebrationClose}
          questionSetName={showCelebration === 'perfect-score' ? questionSetName : undefined}
          badges={showCelebration === 'all-badges' ? badges.filter((badge) => badge.unlocked) : undefined}
        />
      )}
    </div>
  );
}
