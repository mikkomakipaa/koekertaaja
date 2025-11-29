import { ShortAnswerQuestion } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortAnswerProps {
  question: ShortAnswerQuestion;
  userAnswer: string;
  showExplanation: boolean;
  onAnswerChange: (answer: string) => void;
}

export function ShortAnswer({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: ShortAnswerProps) {
  // For short answer questions, we'll do a flexible comparison
  // Check if user answer contains key parts of the correct answer
  const isCorrect = showExplanation && (
    userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim() ||
    (question.acceptable_answers?.some(
      (ans) => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
    ) ?? false)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={userAnswer}
          onChange={(e) => !showExplanation && onAnswerChange(e.target.value)}
          disabled={showExplanation}
          placeholder="Kirjoita vastauksesi tähän... (Voit kirjoittaa useamman lauseen)"
          rows={6}
          className={cn(
            "text-base resize-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            showExplanation && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400",
            showExplanation && !isCorrect && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-600"
          )}
        />
        {showExplanation && (
          <div className="absolute right-3 top-3">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <div className="bg-yellow-100 p-2 rounded-lg">
                <span className="text-xs text-yellow-800 font-medium">Tarkista</span>
              </div>
            )}
          </div>
        )}
      </div>

      {showExplanation && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-2">Esimerkkivastaus:</p>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              <MathText>{question.correct_answer}</MathText>
            </div>
          </div>

          {question.acceptable_answers && question.acceptable_answers.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Muita hyväksyttäviä vastauksia:</p>
              <ul className="text-sm text-blue-700 list-disc pl-5">
                {question.acceptable_answers.map((ans, i) => (
                  <li key={i}>
                    <MathText>{ans}</MathText>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Avoimissa kysymyksissä voit vertailla omaa vastaustasi esimerkkivastaukseen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
