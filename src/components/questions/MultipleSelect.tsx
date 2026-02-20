import { useMemo } from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn, shuffleArray } from '@/lib/utils';
import { MathText } from '@/components/ui/math-text';
import type { MultipleSelectQuestion } from '@/types';

interface MultipleSelectProps {
  question: MultipleSelectQuestion;
  selectedAnswers: string[] | null;
  showExplanation: boolean;
  onSelectionChange: (answers: string[]) => void;
}

export function MultipleSelect({
  question,
  selectedAnswers,
  showExplanation,
  onSelectionChange,
}: MultipleSelectProps) {
  const selected = selectedAnswers ?? [];

  const shuffledOptions = useMemo(
    () => shuffleArray([...question.options]),
    [question.id]
  );

  const toggleOption = (option: string) => {
    if (showExplanation) return;

    if (selected.includes(option)) {
      onSelectionChange(selected.filter((item) => item !== option));
      return;
    }

    onSelectionChange([...selected, option]);
  };

  return (
    <fieldset aria-describedby={`multiple-select-hint-${question.id}`}>
      <legend id={`multiple-select-hint-${question.id}`} className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-400">
        Valitse KAIKKI oikeat vastaukset
      </legend>

      <div className="space-y-2">
        {shuffledOptions.map((option) => {
          const userSelected = selected.includes(option);
          const isCorrectOption = question.correct_answers.includes(option);
          const showCorrect = showExplanation && userSelected && isCorrectOption;
          const showWrong = showExplanation && userSelected && !isCorrectOption;
          const showMissedCorrect = showExplanation && !userSelected && isCorrectOption;

          return (
            <label
              key={option}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all',
                'text-slate-900 dark:text-slate-100',
                showCorrect && 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900',
                showWrong && 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900',
                showMissedCorrect && 'border-yellow-500 bg-yellow-50 dark:border-yellow-400 dark:bg-yellow-900/30',
                !showCorrect && !showWrong && !showMissedCorrect && userSelected && 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/30',
                !showCorrect && !showWrong && !showMissedCorrect && !userSelected && 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                showExplanation && 'cursor-default'
              )}
            >
              <input
                type="checkbox"
                checked={userSelected}
                onChange={() => toggleOption(option)}
                disabled={showExplanation}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex-1">
                <MathText>{option}</MathText>
              </span>
              {showCorrect && <CheckCircle weight="duotone" className="h-5 w-5 text-green-600 dark:text-green-300" />}
              {showWrong && <XCircle weight="duotone" className="h-5 w-5 text-red-600 dark:text-red-300" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
