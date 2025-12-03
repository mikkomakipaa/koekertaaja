import { FillBlankQuestion } from '@/types';
import { Input } from '@/components/ui/input';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FillBlankProps {
  question: FillBlankQuestion;
  userAnswer: string;
  showExplanation: boolean;
  onAnswerChange: (answer: string) => void;
}

export function FillBlank({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: FillBlankProps) {
  const isCorrect = showExplanation && (
    userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim() ||
    (question.acceptable_answers?.some(
      (ans) => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
    ) ?? false)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={userAnswer}
          onChange={(e) => !showExplanation && onAnswerChange(e.target.value)}
          disabled={showExplanation}
          placeholder="Kirjoita vastauksesi tähän..."
          className={cn(
            "text-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            showExplanation && isCorrect && "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400",
            showExplanation && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400"
          )}
        />
        {showExplanation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCorrect ? (
              <CheckCircle weight="duotone" className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle weight="duotone" className="w-6 h-6 text-red-600" />
            )}
          </div>
        )}
      </div>

      {showExplanation && !isCorrect && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Oikea vastaus: <span className="font-bold text-blue-700 dark:text-blue-300">
              <MathText>{question.correct_answer}</MathText>
            </span>
          </p>
          {question.acceptable_answers && question.acceptable_answers.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Hyväksyttävät vastaukset: {question.acceptable_answers.map((ans, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <MathText>{ans}</MathText>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
