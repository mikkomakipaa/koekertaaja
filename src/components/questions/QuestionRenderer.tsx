import { Question } from '@/types';
import { MultipleChoice } from './MultipleChoice';
import { FillBlank } from './FillBlank';
import { TrueFalse } from './TrueFalse';
import { Matching } from './Matching';
import { ShortAnswer } from './ShortAnswer';
import { SequentialQuestion } from './SequentialQuestion';
import { lazy, Suspense } from 'react';

// Lazy load map components to reduce initial bundle size
const MapQuestion = lazy(() => import('./MapQuestion').then(mod => ({ default: mod.MapQuestion })));

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  showExplanation: boolean;
  onAnswerChange: (answer: any) => void;
}

export function QuestionRenderer({
  question,
  userAnswer,
  showExplanation,
  onAnswerChange,
}: QuestionRendererProps) {
  // Store question type for default case (TypeScript exhaustiveness check)
  const questionType = question.question_type;

  switch (questionType) {
    case 'multiple_choice':
      return (
        <MultipleChoice
          question={question}
          selectedAnswer={userAnswer}
          showExplanation={showExplanation}
          onAnswerSelect={onAnswerChange}
        />
      );

    case 'fill_blank':
      return (
        <FillBlank
          question={question}
          userAnswer={userAnswer || ''}
          showExplanation={showExplanation}
          onAnswerChange={onAnswerChange}
        />
      );

    case 'true_false':
      return (
        <TrueFalse
          question={question}
          selectedAnswer={userAnswer}
          showExplanation={showExplanation}
          onAnswerSelect={onAnswerChange}
        />
      );

    case 'matching':
      return (
        <Matching
          question={question}
          userMatches={userAnswer || {}}
          showExplanation={showExplanation}
          onMatchChange={onAnswerChange}
        />
      );

    case 'short_answer':
      return (
        <ShortAnswer
          question={question}
          userAnswer={userAnswer || ''}
          showExplanation={showExplanation}
          onAnswerChange={onAnswerChange}
        />
      );

    case 'sequential':
      return (
        <SequentialQuestion
          question={question}
          userAnswer={userAnswer || null}
          showExplanation={showExplanation}
          onAnswerChange={onAnswerChange}
        />
      );

    case 'map':
      return (
        <Suspense fallback={
          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-300">Ladataan karttaa...</p>
            </div>
          </div>
        }>
          <MapQuestion
            question={question}
            userAnswer={userAnswer}
            showExplanation={showExplanation}
            onAnswerChange={onAnswerChange}
          />
        </Suspense>
      );

    default:
      // This should never happen due to TypeScript type checking, but handle it gracefully at runtime
      return <div>Tuntematon kysymystyyppi: {questionType}</div>;
  }
}
