import { Answer } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, XCircle } from 'lucide-react';

interface ResultsScreenProps {
  score: number;
  total: number;
  answers: Answer[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ResultsScreen({
  score,
  total,
  answers,
  onPlayAgain,
  onBackToMenu,
}: ResultsScreenProps) {
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-20 h-20 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Hienoa työtä!</h1>
            <p className="text-blue-50 text-xl">
              Sait {score} / {total} pistettä ({percentage}%)
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="text-center py-4">
              {percentage >= 80 && (
                <p className="text-2xl font-bold text-green-600">⭐ Erinomaista! ⭐</p>
              )}
              {percentage >= 60 && percentage < 80 && (
                <p className="text-2xl font-bold text-blue-600">👍 Hyvä suoritus! 👍</p>
              )}
              {percentage < 60 && (
                <p className="text-2xl font-bold text-orange-600">💪 Harjoittele lisää! 💪</p>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-lg text-indigo-700">Vastausten yhteenveto:</h3>
              {answers.map((answer, index) => (
                <Card
                  key={index}
                  className={
                    answer.isCorrect
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{answer.questionText}</p>
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
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={onBackToMenu} variant="outline" className="flex-1">
                Palaa valikkoon
              </Button>
              <Button onClick={onPlayAgain} className="flex-1">
                Pelaa uudestaan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
