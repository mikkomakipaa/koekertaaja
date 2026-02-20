import { useEffect, useRef, useState } from 'react';
import { Answer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathText } from '@/components/ui/math-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { useBadges } from '@/hooks/useBadges';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { cn } from '@/lib/utils';
import {
  buildQuestionDetails,
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
  DiamondsFour,
  Fire,
  Sparkle,
  Star,
  Confetti,
  ThumbsUp,
  Barbell,
  Target,
  Trophy,
  Rocket,
  Lightning,
  Palette,
  LockSimple
} from '@phosphor-icons/react';
import { BadgeId } from '@/types';

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

function QuestionDetailCard({
  question,
  status,
  userAnswer,
  isExpanded,
  onToggle,
}: {
  question: {
    id: string;
    question: string;
    correctAnswer: string;
  };
  status: QuestionDetailStatus;
  userAnswer?: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
              <MathText>{question.question}</MathText>
            </p>

            {status === 'skipped' && (
              <div className="rounded bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Oikea vastaus:
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <MathText>{question.correctAnswer}</MathText>
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
                    <MathText>{userAnswer || 'Ei vastausta'}</MathText>
                  </p>
                </div>
                <div className="rounded bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    Oikea vastaus:
                  </p>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <MathText>{question.correctAnswer}</MathText>
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
      icon: <Star size={48} weight="fill" className="text-yellow-500" />,
      text: 'Täydelliset pisteet!'
    };
    if (percentage >= 90) return {
      icon: <Rocket size={48} weight="duotone" className="text-purple-500" />,
      text: 'Erinomaista!'
    };
    if (percentage >= 80) return {
      icon: <Fire size={48} weight="fill" className="text-orange-500" />,
      text: 'Hienoa työtä!'
    };
    if (percentage >= 60) return {
      icon: <Target size={48} weight="duotone" className="text-blue-500" />,
      text: 'Hyvää työtä!'
    };
    return {
      icon: <Barbell size={48} weight="bold" className="text-orange-500" />,
      text: 'Jatka harjoittelua!'
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

  // Get badge icon based on ID
  const getBadgeIcon = (badgeId: BadgeId, size: number = 32) => {
    const iconMap = {
      first_session: <Sparkle size={size} weight="fill" className="inline" />,
      '5_sessions': <Fire size={size} weight="duotone" className="inline" />,
      '10_sessions': <Barbell size={size} weight="bold" className="inline" />,
      '25_sessions': <Trophy size={size} weight="duotone" className="inline" />,
      perfect_score: <Star size={size} weight="fill" className="inline" />,
      nopea_tarkka: <Target size={size} weight="duotone" className="inline" />,
      beat_personal_best: <Rocket size={size} weight="duotone" className="inline" />,
      speed_demon: <Lightning size={size} weight="fill" className="inline" />,
      tried_both_levels: <Palette size={size} weight="duotone" className="inline" />,
      streak_3: <Fire size={size} weight="duotone" className="inline" />,
      streak_5: <Fire size={size} weight="fill" className="inline" />,
      streak_10: <Fire size={size} weight="fill" className="inline text-orange-600" />,
    };
    return iconMap[badgeId] || <Star size={size} weight="regular" className="inline" />;
  };

  // Get badge colors based on category
  const getBadgeColors = (badgeId: string) => {
    // Practice/Milestone badges (Indigo - matches Quiz)
    if (['first_session', '5_sessions', '10_sessions', '25_sessions'].includes(badgeId)) {
      return {
        light: 'from-indigo-50 to-indigo-100 border-indigo-500',
        dark: 'dark:from-indigo-900/30 dark:to-indigo-800/20 dark:border-indigo-600',
        text: 'text-indigo-900 dark:text-indigo-100'
      };
    }
    // Performance badges (Amber - challenge)
    if (['perfect_score', 'nopea_tarkka', 'beat_personal_best'].includes(badgeId)) {
      return {
        light: 'from-amber-50 to-amber-100 border-amber-500',
        dark: 'dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-600',
        text: 'text-amber-900 dark:text-amber-100'
      };
    }
    // Speed badge (Cyan - matches Easy)
    if (badgeId === 'speed_demon') {
      return {
        light: 'from-cyan-50 to-cyan-100 border-cyan-500',
        dark: 'dark:from-cyan-900/30 dark:to-cyan-800/20 dark:border-cyan-600',
        text: 'text-cyan-900 dark:text-cyan-100'
      };
    }
    // Exploration badge (Teal - matches Study)
    if (badgeId === 'tried_both_levels') {
      return {
        light: 'from-teal-50 to-teal-100 border-teal-500',
        dark: 'dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-600',
        text: 'text-teal-900 dark:text-teal-100'
      };
    }
    // Streak badges (orange/red - fire, consistency)
    if (['streak_3', 'streak_5', 'streak_10'].includes(badgeId)) {
      return {
        light: 'from-orange-50 to-red-100 border-orange-400',
        dark: 'dark:from-orange-900 dark:to-red-900 dark:border-orange-600',
        text: 'text-orange-900 dark:text-orange-100'
      };
    }
    // Default (shouldn't happen)
    return {
      light: 'from-gray-50 to-gray-100 border-gray-400',
      dark: 'dark:from-gray-800 dark:to-gray-700 dark:border-gray-700',
      text: 'text-gray-900 dark:text-gray-100'
    };
  };

  const displayPersonalBest = personalBest > 0 ? (isNewRecord ? totalPoints : personalBest) : null;
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;
  const newlyUnlockedBadges = badges.filter(badge => newlyUnlocked.includes(badge.id));

  return (
    <div className={`min-h-screen bg-gradient-to-b ${modeColors.bg} p-4 md:p-8 pb-24 transition-colors`}>
      <div className="max-w-5xl mx-auto">
        {/* Frosted glass pattern uses darker border (gray-800) for visual depth */}
        {/* Hero */}
        <Card variant="frosted" padding="standard" className="mb-6">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`${modeColors.iconBg} flex items-center justify-center rounded-xl p-3 flex-shrink-0`}>
                {celebration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {celebration.text}
                </h1>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                  {score} / {total} oikein ({percentage}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card variant="frosted" padding="compact">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <DiamondsFour size={18} weight="duotone" className="text-yellow-500" />
                Pisteprosentti
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {percentage}%
              </div>
            </CardContent>
          </Card>
          <Card variant="frosted" padding="compact">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Fire size={18} weight="duotone" className="text-orange-500" />
                Paras putki
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {bestStreak > 0 ? bestStreak : '—'}
              </div>
            </CardContent>
          </Card>
          <Card variant="frosted" padding="compact">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <ArrowCounterClockwise size={18} weight="duotone" className="text-amber-500" />
                Ohitetut
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {skippedAnswerCount}
              </div>
            </CardContent>
          </Card>
          <Card variant="frosted" padding="compact">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Medal size={18} weight="duotone" className="text-purple-500" />
                Uusia merkkejä
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {newlyUnlockedBadges.length}
              </div>
            </CardContent>
          </Card>
          <Card variant="frosted" padding="compact">
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Sparkle size={18} weight="duotone" className="text-emerald-500" />
                Henkilökohtainen ennätys
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
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
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-white/80 dark:bg-gray-900/70 p-1 shadow-sm border border-white/60 dark:border-gray-800">
            <TabsTrigger value="overview" className="rounded-xl text-sm md:text-base">Yhteenveto</TabsTrigger>
            <TabsTrigger value="answers" className="rounded-xl text-sm md:text-base">Vastaukset</TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl text-sm md:text-base">Merkit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            <Card variant="frosted" padding="standard">
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <Target size={18} weight="duotone" className="text-indigo-500" />
                  Aiheiden hallinta
                </div>
                <TopicMasteryDisplay questionSetCode={questionSetCode ?? ''} className="mt-2 border-t-0 pt-0" />
              </CardContent>
            </Card>

            <Card
              variant="frosted"
              padding="standard"
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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

          <TabsContent value="answers" className="mt-6">
            <Card variant="frosted" padding="standard">
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
                    {answers.filter(answer => showAllAnswers || !answer.isCorrect).map((answer, index) => {
                      const isSkipped = answer.userAnswer === null && !answer.isCorrect;
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            answer.isCorrect
                              ? 'bg-green-50 border-green-500'
                              : isSkipped
                                ? 'bg-amber-50 border-amber-500'
                                : 'bg-red-50 border-red-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {answer.isCorrect ? (
                              <CheckCircle weight="duotone" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : isSkipped ? (
                              <ArrowCounterClockwise weight="duotone" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle weight="duotone" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                <MathText>{answer.questionText}</MathText>
                              </p>
                              {isSkipped && (
                                <p className="text-sm text-amber-700 mt-1">Tämä kysymys ohitettiin aikarajan vuoksi.</p>
                              )}
                              {!answer.isCorrect && !isSkipped && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Oikea vastaus:{' '}
                                  <span className="font-semibold">
                                    {typeof answer.correctAnswer === 'object' ? (
                                      JSON.stringify(answer.correctAnswer)
                                    ) : (
                                      <MathText>{String(answer.correctAnswer)}</MathText>
                                    )}
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

          <TabsContent value="badges" className="mt-6 space-y-5">
            <Card variant="frosted" padding="standard">
              <CardHeader className="mb-3 space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <Sparkle size={18} weight="duotone" className="text-emerald-500" />
                  Uudet merkit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {newlyUnlockedBadges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newlyUnlockedBadges.map(badge => {
                      const colors = getBadgeColors(badge.id);
                      return (
                        <BadgeDisplay
                          badge={badge}
                          key={badge.id}
                          className={`p-3 rounded-lg text-center bg-gradient-to-br ${colors.light} ${colors.dark} border-2`}
                        >
                          <div className="text-3xl mb-1 flex justify-center">
                            {getBadgeIcon(badge.id)}
                          </div>
                          <div className={`text-xs font-medium leading-tight ${colors.text}`}>
                            {badge.name}
                          </div>
                        </BadgeDisplay>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ei uusia merkkejä tällä kertaa.</p>
                )}
              </CardContent>
            </Card>

            <Card variant="frosted" padding="standard">
              <CardHeader className="mb-3 space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <Medal weight="duotone" className="w-5 h-5" />
                  Kaikki merkit ({unlockedBadgesCount}/{badges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {badges.map(badge => {
                    const colors = getBadgeColors(badge.id);
                    return (
                      <BadgeDisplay
                        badge={badge}
                        key={badge.id}
                        className={`p-3 rounded-lg text-center ${
                          badge.unlocked
                            ? `bg-gradient-to-br ${colors.light} ${colors.dark} border-2`
                            : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                        }`}
                      >
                        <div className="text-3xl mb-1 flex justify-center">
                          {badge.unlocked ? (
                            getBadgeIcon(badge.id)
                          ) : (
                            <LockSimple size={32} weight="fill" className="text-gray-400" />
                          )}
                        </div>
                        {badge.unlocked && (
                          <div className={`text-xs font-medium leading-tight ${colors.text}`}>
                            {badge.name}
                          </div>
                        )}
                      </BadgeDisplay>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="sticky bottom-4 z-10">
          <div className="rounded-xl bg-white/90 dark:bg-gray-900/85 border border-white/60 dark:border-gray-800 p-4 shadow-lg backdrop-blur-sm">
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
