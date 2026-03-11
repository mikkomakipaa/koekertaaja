import { ShortAnswerQuestion } from '@/types';
import type { AnswerEntryConfig } from '@/lib/questions/answer-entry';
import { FractionInput } from '@/components/ui/fraction-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ShortAnswerProps {
  question: ShortAnswerQuestion;
  userAnswer: string;
  showExplanation: boolean;
  isAnswerCorrect?: boolean;
  onAnswerChange: (answer: string) => void;
  answerEntryConfig?: AnswerEntryConfig;
}

export function ShortAnswer({
  question,
  userAnswer,
  showExplanation,
  isAnswerCorrect = false,
  onAnswerChange,
  answerEntryConfig,
}: ShortAnswerProps) {
  const isCorrect = showExplanation && isAnswerCorrect;
  const isCompactInput = answerEntryConfig?.variant === 'compact';
  const isFractionWidget = isCompactInput && Boolean(answerEntryConfig?.mathInputType);
  const placeholder = answerEntryConfig?.placeholder ?? 'Kirjoita vastauksesi tähän... (Voit kirjoittaa useamman lauseen)';
  const sharedFieldClassName = cn(
    'text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    showExplanation && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400',
    showExplanation && !isCorrect && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-600'
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

      <div className={cn('relative', isFractionWidget && showExplanation && 'pr-20')}>
        {isFractionWidget ? (
          <FractionInput
            data-testid="fraction-answer-input"
            type={answerEntryConfig?.mathInputType === 'fraction' ? 'fraction' : 'mixed_number'}
            value={userAnswer}
            onChange={(value) => !showExplanation && onAnswerChange(value)}
            disabled={showExplanation}
            className={sharedFieldClassName}
          />
        ) : isCompactInput ? (
          <Input
            data-testid="compact-answer-input"
            type="text"
            inputMode="text"
            value={userAnswer}
            onChange={(e) => !showExplanation && onAnswerChange(e.target.value)}
            disabled={showExplanation}
            placeholder={placeholder}
            aria-label="Kirjoita vastauksesi"
            className={cn('min-h-12 text-lg px-4', sharedFieldClassName)}
          />
        ) : (
          <Textarea
            data-testid="freeform-answer-input"
            value={userAnswer}
            onChange={(e) => !showExplanation && onAnswerChange(e.target.value)}
            disabled={showExplanation}
            placeholder={placeholder}
            rows={6}
            className={cn('text-base resize-none min-h-32', sharedFieldClassName)}
          />
        )}
        {!isCompactInput && !showExplanation && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
            {userAnswer.trim() === '' ? 'Vastaus puuttuu' : `${userAnswer.trim().length} merkkiä`}
          </p>
        )}
        {showExplanation && !isFractionWidget && (
          <div className="absolute right-3 top-3">
            {isCorrect ? (
              <CheckCircle weight="duotone" className="w-6 h-6 text-green-600" />
            ) : (
              <div className="bg-yellow-100 p-2 rounded-lg">
                <span className="text-xs text-yellow-800 font-medium">Tarkista</span>
              </div>
            )}
          </div>
        )}
      </div>
      {showExplanation && isFractionWidget && (
        <div className="flex justify-end">
          {isCorrect ? (
            <CheckCircle weight="duotone" className="w-6 h-6 text-green-600" />
          ) : (
            <div className="bg-yellow-100 p-2 rounded-lg">
              <span className="text-xs text-yellow-800 font-medium">Tarkista</span>
            </div>
          )}
        </div>
      )}

      {showExplanation && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg space-y-3">
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Esimerkkivastaus:</p>
            <div className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
              <MathText>{question.correct_answer}</MathText>
            </div>
          </div>

          {question.acceptable_answers && question.acceptable_answers.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Muita hyväksyttäviä vastauksia:</p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc pl-5">
                {question.acceptable_answers.map((ans, i) => (
                  <li key={i}>
                    <MathText>{ans}</MathText>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isCorrect && answerEntryConfig?.feedbackHint && (
            <div
              data-testid="answer-feedback-hint"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            >
              <p className="font-semibold">Kirjoitusapu</p>
              <div className="mt-1">
                <MathText>{answerEntryConfig.feedbackHint}</MathText>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 Avoimissa kysymyksissä voit vertailla omaa vastaustasi esimerkkivastaukseen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
