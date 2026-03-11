import { FillBlankQuestion } from '@/types';
import type { AnswerEntryConfig } from '@/lib/questions/answer-entry';
import { FractionInput } from '@/components/ui/fraction-input';
import { Input } from '@/components/ui/input';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface FillBlankProps {
  question: FillBlankQuestion;
  userAnswer: string;
  showExplanation: boolean;
  isAnswerCorrect?: boolean;
  onAnswerChange: (answer: string) => void;
  answerEntryConfig?: AnswerEntryConfig;
}

export function FillBlank({
  question,
  userAnswer,
  showExplanation,
  isAnswerCorrect = false,
  onAnswerChange,
  answerEntryConfig,
}: FillBlankProps) {
  const isCorrect = showExplanation && isAnswerCorrect;
  const isFractionWidget = Boolean(answerEntryConfig?.mathInputType);
  const placeholder = answerEntryConfig?.placeholder ?? 'Kirjoita vastauksesi tähän...';
  const sharedFieldClassName = cn(
    'min-h-12 text-lg px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    showExplanation && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400',
    showExplanation && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400'
  );

  return (
    <div className="space-y-4">
      {!showExplanation && answerEntryConfig?.notationHint && (
        <div
          data-testid="answer-notation-hint"
          className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <p className="font-semibold">Kirjoitusvinkki</p>
          <div className="mt-1">
            <MathText>{answerEntryConfig.notationHint}</MathText>
          </div>
        </div>
      )}

      <div className="relative">
        {isFractionWidget ? (
          <FractionInput
            data-testid="fraction-answer-input"
            type={answerEntryConfig?.mathInputType === 'fraction' ? 'fraction' : 'mixed_number'}
            value={userAnswer}
            onChange={(value) => !showExplanation && onAnswerChange(value)}
            disabled={showExplanation}
            className={sharedFieldClassName}
          />
        ) : (
          <Input
            data-testid="compact-answer-input"
            type="text"
            inputMode="text"
            value={userAnswer}
            onChange={(e) => !showExplanation && onAnswerChange(e.target.value)}
            disabled={showExplanation}
            placeholder={placeholder}
            className={sharedFieldClassName}
          />
        )}
        {showExplanation && !isFractionWidget && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isCorrect ? (
              <CheckCircle weight="duotone" className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle weight="duotone" className="w-6 h-6 text-red-600" />
            )}
          </div>
        )}
      </div>
      {showExplanation && isFractionWidget && (
        <div className="flex justify-end">
          {isCorrect ? (
            <CheckCircle weight="duotone" className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle weight="duotone" className="w-6 h-6 text-red-600" />
          )}
        </div>
      )}

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
          {answerEntryConfig?.feedbackHint && (
            <div
              data-testid="answer-feedback-hint"
              className="mt-2 text-sm leading-relaxed text-blue-800 dark:text-blue-200"
            >
              <span className="font-semibold">Kirjoitusapu:</span>{' '}
              <MathText>{answerEntryConfig.feedbackHint}</MathText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
