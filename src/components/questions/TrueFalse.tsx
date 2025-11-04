import { TrueFalseQuestion } from '@/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrueFalseProps {
  question: TrueFalseQuestion;
  selectedAnswer: boolean | null;
  showExplanation: boolean;
  onAnswerSelect: (answer: boolean) => void;
}

export function TrueFalse({
  question,
  selectedAnswer,
  showExplanation,
  onAnswerSelect,
}: TrueFalseProps) {
  const options = [
    { value: true, label: 'Totta' },
    { value: false, label: 'Tarua' },
  ];

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedAnswer === option.value;
        const isCorrect = option.value === question.correct_answer;
        const showCorrect = showExplanation && isCorrect;
        const showWrong = showExplanation && isSelected && !isCorrect;

        return (
          <button
            key={option.label}
            onClick={() => !showExplanation && onAnswerSelect(option.value)}
            disabled={showExplanation}
            className={cn(
              "w-full p-4 text-left rounded-lg border-2 transition-all",
              showCorrect && "border-green-500 bg-green-50",
              showWrong && "border-red-500 bg-red-50",
              !showCorrect && !showWrong && isSelected && "border-blue-500 bg-blue-50",
              !showCorrect && !showWrong && !isSelected && "border-gray-200 hover:border-blue-300 hover:bg-blue-50",
              showExplanation ? "cursor-default" : "cursor-pointer"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{option.label}</span>
              {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />}
              {showWrong && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
