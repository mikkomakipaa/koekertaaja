import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link.js';
import { Answer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { MathText } from '@/components/ui/math-text';
import { PageTitle } from '@/components/ui/page-title';
import { SegmentedControl, SegmentedControlItem } from '@/components/ui/segmented-control';
import { SectionHeading } from '@/components/ui/section-heading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeCard } from '@/components/play/GradeCard';
import { BadgePreviewCard } from '@/components/play/BadgePreviewCard';
import { TopicMasterySection } from '@/components/play/TopicMasterySection';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { useBadges } from '@/hooks/useBadges';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { useRelatedFlashcardSet } from '@/hooks/useRelatedFlashcardSet';
import { useTopicMastery } from '@/hooks/useTopicMastery';
import { difficultyLabels } from '@/lib/play/primary-action';
import { cn } from '@/lib/utils';
import {
  buildTopicMasteryItems,
  buildQuestionDetails,
  formatResultAnswer,
  getCelebrationQueue,
  getNewlyUnlockedBadges,
  getNextCelebration,
  getResultsHeaderCopy,
  getReviewMistakesActionLabel,
  getResultsBreakdown,
  getPrimaryWeakTopicHref,
  shouldShowReviewMistakesAction,
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
import { CheckCircle, XCircle, ArrowCounterClockwise, X, ArrowRight } from '@phosphor-icons/react';

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
  const {
    badges,
    newlyUnlocked,
    recordSession,
    updatePersonalBest,
  } = useBadges(questionSetCode);
  const { mistakeCount } = useReviewMistakes(questionSetCode);
  const { saveLastScore } = useLastScore(questionSetCode);
  const { flashcardCode } = useRelatedFlashcardSet(questionSetCode);
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<CelebrationType | null>(null);
  const [celebrationQueue, setCelebrationQueue] = useState<CelebrationType[]>([]);
  const hasRecordedRef = useRef(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const sessionMistakeCount = answers.filter(answer => !answer.isCorrect).length;
  const { skippedCount, correctCount, wrongCount } = getResultsBreakdown(answers, skippedQuestions);
  const questionDetails = buildQuestionDetails(answers, skippedQuestions);
  const reviewMistakeCount = mistakeCount > 0 ? mistakeCount : sessionMistakeCount;
  const showReviewMistakesAction = shouldShowReviewMistakesAction(reviewMistakeCount, onReviewMistakes);

  // Track if events have already been captured to prevent duplicates

  // Record session and check for new badges/records
  useEffect(() => {
    if (!questionSetCode || hasRecordedRef.current) return;

    updatePersonalBest(questionSetCode, totalPoints);

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

  const modeColors = mode === 'quiz'
    ? {
        accent: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        button: 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
      }
    : {
        accent: 'text-teal-600 dark:text-teal-400',
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
        button: 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg active:shadow-sm',
      };

  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;
  const newlyUnlockedBadges = useMemo(
    () => getNewlyUnlockedBadges(badges, newlyUnlocked),
    [badges, newlyUnlocked]
  );
  const topicMasteryItems = useMemo(
    () => (hasMasteryData() ? buildTopicMasteryItems(getMasteryStats(), flashcardCode) : []),
    [flashcardCode, getMasteryStats, hasMasteryData]
  );
  const primaryWeakTopicHref = getPrimaryWeakTopicHref(topicMasteryItems);
  const primaryWeakTopic = topicMasteryItems.find((item) => item.reviewHref === primaryWeakTopicHref) ?? null;
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
  const resultsHeaderCopy = getResultsHeaderCopy(score, total, mode);

  return (
    <div className="min-h-screen bg-white p-4 pb-24 transition-colors dark:bg-gray-900 md:p-8">
      <div className="max-w-5xl mx-auto">
        <section className="mb-4 border-b border-slate-200/80 pb-4 dark:border-white/10">
          <div className="flex items-start gap-3">
            <IconButton
              onClick={onBackToMenu}
              aria-label="Takaisin"
            >
              <ArrowRight size={20} weight="regular" className="rotate-180" aria-hidden="true" />
            </IconButton>
            <div className="min-w-0">
              <PageTitle>
                {resultsHeaderCopy.title}
              </PageTitle>
              {resultsHeaderCopy.supportingText ? (
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {resultsHeaderCopy.supportingText}
                </p>
              ) : null}
              {resultsPrimaryMeta ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {resultsPrimaryMeta}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <GradeCard
            score={score}
            total={total}
            title={normalizedQuestionSetName}
            difficultyLabel={questionSetAlreadyIncludesDifficulty ? null : difficultyLabel}
            mode={mode}
          />
          {newlyUnlockedBadges.length > 0 ? (
            <BadgePreviewCard badges={newlyUnlockedBadges} />
          ) : null}
        </div>

        <Tabs defaultValue="overview" className="mb-5 mt-6 border-t border-slate-200/80 pt-6 dark:border-white/10">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-none dark:border-slate-800 dark:bg-slate-900">
            <TabsTrigger value="overview" className="rounded-xl text-sm md:text-base">Yhteenveto</TabsTrigger>
            <TabsTrigger value="answers" className="rounded-xl text-sm md:text-base">Vastaukset</TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl text-sm md:text-base">
              Merkit ({unlockedBadgesCount}/{badges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-3">
            <TopicMasterySection items={topicMasteryItems} />
          </TabsContent>

          <TabsContent value="answers" className="mt-5">
            <Card variant="standard" padding="standard" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
              <CardContent>
                <div className="mb-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <SectionHeading>Vastausten yhteenveto</SectionHeading>
                    {!skippedQuestions || skippedQuestions.length === 0 ? (
                      <div className="overflow-x-auto no-scrollbar">
                        <SegmentedControl
                          role="group"
                          aria-label="Vastaussuodatin"
                          className="min-h-10"
                        >
                          <SegmentedControlItem
                            type="button"
                            onClick={() => setShowAllAnswers(false)}
                            active={!showAllAnswers}
                            className="h-10 px-3 text-sm focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                            activeClassName={`${modeColors.button} font-semibold text-white`}
                            inactiveClassName="text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                            aria-pressed={!showAllAnswers}
                          >
                            Vain virheet
                          </SegmentedControlItem>
                          <SegmentedControlItem
                            type="button"
                            onClick={() => setShowAllAnswers(true)}
                            active={showAllAnswers}
                            className="h-10 px-3 text-sm focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400"
                            activeClassName={`${modeColors.button} font-semibold text-white`}
                            inactiveClassName="text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                            aria-pressed={showAllAnswers}
                          >
                            Kaikki
                          </SegmentedControlItem>
                        </SegmentedControl>
                      </div>
                    ) : null}
                  </div>
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
                ) : null}
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
                                <p className="text-sm text-amber-700 mt-1">Tämä kysymys ohitettiin.</p>
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

          <TabsContent value="badges" className="mt-5">
            <BadgeCollectionCard
              badges={badges}
              highlightedBadgeIds={newlyUnlocked}
              title="Ansaitut merkit"
            />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="sticky bottom-4 z-10">
          <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex flex-col gap-3 md:flex-row">
              {showReviewMistakesAction && onReviewMistakes ? (
                <Button
                  onClick={onReviewMistakes}
                  mode="review"
                  variant="primary"
                  className="w-full md:flex-1"
                >
                  {getReviewMistakesActionLabel(reviewMistakeCount)}
                </Button>
              ) : (
                <Button
                  onClick={onPlayAgain}
                  mode={mode === 'flashcard' ? 'study' : 'quiz'}
                  variant="primary"
                  className="w-full md:flex-1"
                >
                  Pelaa uudelleen
                </Button>
              )}
              {primaryWeakTopicHref ? (
                <Button asChild mode="study" variant="secondary" className="w-full md:flex-1">
                  <Link href={primaryWeakTopicHref}>
                    {primaryWeakTopic ? `Opettele: ${primaryWeakTopic.topic}` : 'Opettele heikoin aihe'}
                  </Link>
                </Button>
              ) : null}
              {!showReviewMistakesAction || !onReviewMistakes ? (
                <Button
                  onClick={onPlayAgain}
                  variant="secondary"
                  className="w-full md:flex-1"
                >
                  Pelaa uudelleen
                </Button>
              ) : null}
              <Button
                onClick={onBackToMenu}
                variant="secondary"
                className="w-full md:flex-1"
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
