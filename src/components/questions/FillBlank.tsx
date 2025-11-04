import { FillBlankQuestion } from '@/types';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';
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
            "text-lg",
            showExplanation && isCorrect && "border-green-500 bg-green-50",
            showExplanation && !isCorrect && "border-red-500 bg-red-50"
          )}
        />
        {showExplanation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
        )}
      </div>

      {showExplanation && !isCorrect && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Oikea vastaus: <span className="font-bold text-blue-700">{question.correct_answer}</span>
          </p>
          {question.acceptable_answers && question.acceptable_answers.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Hyväksyttävät vastaukset: {question.acceptable_answers.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
