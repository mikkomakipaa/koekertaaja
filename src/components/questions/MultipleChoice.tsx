import { MultipleChoiceQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultipleChoiceProps {
  question: MultipleChoiceQuestion;
  selectedAnswer: string | null;
  showExplanation: boolean;
  onAnswerSelect: (answer: string) => void;
}

export function MultipleChoice({
  question,
  selectedAnswer,
  showExplanation,
  onAnswerSelect,
}: MultipleChoiceProps) {
  // Safety check for empty or missing options
  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Virhe: Kysymyksellä ei ole vastausvaihtoehtoja.</p>
        <p className="text-sm text-red-600 mt-1">Oikea vastaus: {question.correct_answer}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === question.correct_answer;
        const showCorrect = showExplanation && isCorrect;
        const showWrong = showExplanation && isSelected && !isCorrect;

        return (
          <button
            key={index}
            onClick={() => !showExplanation && onAnswerSelect(option)}
            disabled={showExplanation}
            className={cn(
              "w-full p-5 text-left rounded-lg border-2 transition-all active:scale-[0.98]",
              showCorrect && "border-green-500 bg-green-50",
              showWrong && "border-red-500 bg-red-50",
              !showCorrect && !showWrong && isSelected && "border-blue-500 bg-blue-50",
              !showCorrect && !showWrong && !isSelected && "border-gray-200 hover:border-blue-300 hover:bg-blue-50",
              showExplanation ? "cursor-default" : "cursor-pointer"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">
                <MathText>{option}</MathText>
              </span>
              {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 ml-2" />}
              {showWrong && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 ml-2" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
