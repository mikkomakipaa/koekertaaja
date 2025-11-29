import { useEffect, useState } from 'react';
import { Answer, Badge } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/ui/math-text';
import { useBadges } from '@/hooks/useBadges';
import { Trophy, CheckCircle2, XCircle, Zap, Flame, Award } from 'lucide-react';

interface ResultsScreenProps {
  score: number;
  total: number;
  answers: Answer[];
  totalPoints: number;
  bestStreak: number;
  questionSetCode?: string;
  difficulty?: string;
  durationSeconds?: number;
  onPlayAgain: () => void;
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
  onPlayAgain,
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

  const [personalBest, setPersonalBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Record session and check for new badges/records
  useEffect(() => {
    if (questionSetCode) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine celebration level
  const getCelebration = () => {
    if (percentage === 100) return { emoji: '🌟', text: 'Täydelliset pisteet!' };
    if (percentage >= 90) return { emoji: '⭐', text: 'Erinomaista!' };
    if (percentage >= 80) return { emoji: '🎉', text: 'Hienoa työtä!' };
    if (percentage >= 60) return { emoji: '👍', text: 'Hyvää työtä!' };
    return { emoji: '💪', text: 'Jatka harjoittelua!' };
  };

  const celebration = getCelebration();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* Results Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">{celebration.emoji}</div>
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
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">💎 {totalPoints}</div>
            {personalBest > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isNewRecord ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">Uusi ennätys! 🎉</span>
                ) : (
                  <span>Ennätys: {personalBest}</span>
                )}
              </div>
            )}
          </div>
          {bestStreak > 0 && (
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paras putki</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">🔥 {bestStreak}</div>
            </div>
          )}
        </div>

        {/* Newly Unlocked Badges */}
        {newlyUnlocked.length > 0 && (
          <div className="space-y-3 mb-10">
            <h3 className="font-semibold text-gray-900 text-center mb-3">
              🎉 Uudet merkit avattu!
            </h3>
            {newlyUnlocked.map(badgeId => {
              const badge = badges.find(b => b.id === badgeId);
              if (!badge) return null;
              return (
                <div
                  key={badgeId}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 text-center animate-pulse"
                >
                  <span className="text-3xl mr-2">{badge.emoji}</span>
                  <span className="font-semibold text-yellow-900">{badge.name}</span>
                  <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* All Badges Section */}
        {badges.some(b => b.unlocked) && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Saavutetut merkit ({badges.filter(b => b.unlocked).length}/{badges.length})
              </h3>
              <button
                onClick={() => setShowAllBadges(!showAllBadges)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {showAllBadges ? 'Piilota merkit' : 'Näytä kaikki merkit'}
              </button>
            </div>
            {showAllBadges ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {badges.map(badge => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 border-2 border-yellow-400 dark:border-yellow-600'
                        : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                    }`}
                    title={badge.unlocked ? badge.name : '🔒 Lukittu'}
                  >
                    <div className="text-3xl mb-1">{badge.unlocked ? badge.emoji : '🔒'}</div>
                    {badge.unlocked && (
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                        {badge.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.filter(b => b.unlocked).map(badge => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 border border-yellow-400 dark:border-yellow-600 rounded-lg"
                    title={badge.name}
                  >
                    <span className="text-xl">{badge.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Answer Summary */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Vastausten yhteenveto</h3>
            <button
              onClick={() => setShowAllAnswers(!showAllAnswers)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
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
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
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
          <Button
            onClick={onPlayAgain}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl font-medium"
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
