import { useEffect, useRef, useState } from 'react';
import { Answer } from '@/types';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/ui/math-text';
import { useBadges } from '@/hooks/useBadges';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import { useLastScore } from '@/hooks/useLastScore';
import { CheckCircle, XCircle, Medal, ArrowCounterClockwise } from '@phosphor-icons/react';
import {
  DiamondsFour,
  Fire,
  Sparkle,
  Star,
  Confetti,
  ThumbsUp,
  Barbell,
  Target,
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
  questionSetCode?: string;
  difficulty?: string;
  durationSeconds?: number;
  mode?: 'quiz' | 'flashcard';
  onPlayAgain: () => void;
  onReviewMistakes?: () => void;
  onBackToMenu: () => void;
}

export function ResultsScreen({
  score,
  total,
  answers,
  totalPoints,
  bestStreak,
  questionSetCode,
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
  const [showAllBadges, setShowAllBadges] = useState(false);
  const hasRecordedRef = useRef(false);
  const sessionMistakeCount = answers.filter(answer => !answer.isCorrect).length;
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


  // Determine celebration level
  const getCelebration = () => {
    if (percentage === 100) return {
      icon: <Sparkle size={80} weight="fill" className="text-yellow-500" />,
      text: 'Täydelliset pisteet!'
    };
    if (percentage >= 90) return {
      icon: <Star size={80} weight="fill" className="text-yellow-500" />,
      text: 'Erinomaista!'
    };
    if (percentage >= 80) return {
      icon: <Confetti size={80} weight="duotone" className="text-purple-500" />,
      text: 'Hienoa työtä!'
    };
    if (percentage >= 60) return {
      icon: <ThumbsUp size={80} weight="fill" className="text-blue-500" />,
      text: 'Hyvää työtä!'
    };
    return {
      icon: <Barbell size={80} weight="bold" className="text-orange-500" />,
      text: 'Jatka harjoittelua!'
    };
  };

  const celebration = getCelebration();

  const modeColors = mode === 'quiz'
    ? {
        bg: 'from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      }
    : {
        bg: 'from-teal-50 to-white dark:from-gray-900 dark:to-gray-800',
        accent: 'text-teal-600 dark:text-teal-400',
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
        button: 'bg-teal-600 hover:bg-teal-700 text-white',
      };

  // Get badge icon based on ID
  const getBadgeIcon = (badgeId: BadgeId, size: number = 32) => {
    const iconMap = {
      first_session: <Sparkle size={size} weight="fill" className="inline" />,
      '5_sessions': <Fire size={size} weight="duotone" className="inline" />,
      '10_sessions': <Barbell size={size} weight="bold" className="inline" />,
      '25_sessions': <Target size={size} weight="duotone" className="inline" />,
      perfect_score: <Star size={size} weight="fill" className="inline" />,
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
    if (['perfect_score', 'beat_personal_best'].includes(badgeId)) {
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
      dark: 'dark:from-gray-800 dark:to-gray-700 dark:border-gray-600',
      text: 'text-gray-900 dark:text-gray-100'
    };
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${modeColors.bg} p-4 md:p-8 transition-colors`}>
      <div className="max-w-2xl mx-auto">
        {/* Results Header */}
        <div className="text-center mb-10">
          <div className="mb-4 flex justify-center">
            <div className={`${modeColors.iconBg} p-6 rounded-full`}>
              {celebration.icon}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {celebration.text}
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            {score} / {total} oikein ({percentage}%)
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-10">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pisteet</div>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-yellow-600 dark:text-yellow-500">
              <DiamondsFour size={32} weight="duotone" className="text-yellow-500" />
              {totalPoints}
            </div>
            {personalBest > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isNewRecord ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-1">
                    Uusi ennätys! <Confetti size={16} weight="fill" />
                  </span>
                ) : (
                  <span>Ennätys: {personalBest}</span>
                )}
              </div>
            )}
          </div>
          {bestStreak > 0 && (
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paras putki</div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-orange-600 dark:text-orange-500">
                <Fire size={32} weight="duotone" className="text-orange-500" />
                {bestStreak}
              </div>
            </div>
          )}
        </div>

        {/* All Badges Section */}
        {badges.some(b => b.unlocked) && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Medal weight="duotone" className="w-5 h-5" />
                Saavutetut merkit ({badges.filter(b => b.unlocked).length}/{badges.length})
              </h3>
              <button
                onClick={() => setShowAllBadges(!showAllBadges)}
                className={`text-sm ${modeColors.accent} hover:opacity-80 font-medium`}
              >
                {showAllBadges ? 'Piilota merkit' : 'Näytä kaikki merkit'}
              </button>
            </div>
            {showAllBadges ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {badges.map(badge => {
                  const colors = getBadgeColors(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-lg text-center ${
                        badge.unlocked
                          ? `bg-gradient-to-br ${colors.light} ${colors.dark} border-2`
                          : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                      }`}
                      title={badge.unlocked ? badge.name : 'Lukittu'}
                    >
                      <div className="text-3xl mb-1 flex justify-center">
                        {badge.unlocked ? getBadgeIcon(badge.id) : <LockSimple size={32} weight="fill" className="text-gray-400" />}
                      </div>
                      {badge.unlocked && (
                        <div className={`text-xs font-medium leading-tight ${colors.text}`}>
                          {badge.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.filter(b => b.unlocked).map(badge => {
                  const colors = getBadgeColors(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-1 px-3 py-2 bg-gradient-to-br ${colors.light} ${colors.dark} border rounded-lg`}
                      title={badge.name}
                    >
                      <span className="text-xl">{getBadgeIcon(badge.id, 20)}</span>
                      <span className={`text-xs font-medium ${colors.text}`}>{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Answer Summary */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Vastausten yhteenveto</h3>
            <button
              onClick={() => setShowAllAnswers(!showAllAnswers)}
              className={`text-sm ${modeColors.accent} hover:opacity-80 font-medium`}
            >
              {showAllAnswers ? 'Näytä vain virheet' : 'Näytä kaikki'}
            </button>
          </div>
          <div className="space-y-2">
            {answers.filter(answer => showAllAnswers || !answer.isCorrect).map((answer, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  answer.isCorrect
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle weight="duotone" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle weight="duotone" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      <MathText>{answer.questionText}</MathText>
                    </p>
                    {!answer.isCorrect && (
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
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {sessionMistakeCount > 0 && onReviewMistakes && (
            <Button
              onClick={onReviewMistakes}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <ArrowCounterClockwise size={20} weight="bold" />
              Kertaa virheet ({reviewMistakeCount})
            </Button>
          )}
          <Button
            onClick={onPlayAgain}
            className={`flex-1 ${modeColors.button} py-6 rounded-xl font-medium`}
          >
            Pelaa uudelleen
          </Button>
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="flex-1 py-6 rounded-xl font-medium"
          >
            Takaisin valikkoon
          </Button>
        </div>
      </div>
    </div>
  );
}
