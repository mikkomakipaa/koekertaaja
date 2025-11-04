import { Answer } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, XCircle, Zap, Flame } from 'lucide-react';

interface ResultsScreenProps {
  score: number;
  total: number;
  answers: Answer[];
  totalPoints: number;
  bestStreak: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ResultsScreen({
  score,
  total,
  answers,
  totalPoints,
  bestStreak,
  onPlayAgain,
  onBackToMenu,
}: ResultsScreenProps) {
  const percentage = Math.round((score / total) * 100);

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
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Results Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">{celebration.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {celebration.text}
          </h1>
          <p className="text-2xl text-gray-600">
            {score} / {total} oikein ({percentage}%)
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-10">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Pisteet</div>
            <div className="text-3xl font-bold text-purple-600">💎 {totalPoints}</div>
          </div>
          {bestStreak > 0 && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Paras putki</div>
              <div className="text-3xl font-bold text-orange-600">🔥 {bestStreak}</div>
            </div>
          )}
        </div>

        {/* Achievement badges */}
        {(percentage === 100 || bestStreak >= 5) && (
          <div className="space-y-3 mb-10">
            {percentage === 100 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 text-center">
                <span className="text-2xl mr-2">🏆</span>
                <span className="font-semibold text-yellow-900">Saavutus avattu: Täydellisyys!</span>
              </div>
            )}
            {bestStreak >= 5 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 text-center">
                <span className="text-2xl mr-2">🔥</span>
                <span className="font-semibold text-orange-900">Saavutus avattu: Tulinen putki!</span>
              </div>
            )}
          </div>
        )}

        {/* Answer Summary */}
        <div className="mb-10">
          <h3 className="font-semibold text-gray-900 mb-4">Vastausten yhteenveto</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {answers.map((answer, index) => (
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
                    <p className="font-medium text-gray-900">{answer.questionText}</p>
                    {!answer.isCorrect && (
                      <p className="text-sm text-gray-600 mt-1">
                        Oikea vastaus:{' '}
                        <span className="font-semibold">
                          {typeof answer.correctAnswer === 'object'
                            ? JSON.stringify(answer.correctAnswer)
                            : answer.correctAnswer}
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
