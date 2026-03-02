import { Question } from '@/types';
import type { ShortAnswerQuestion } from '@/types';
import type { AnswerEntryConfig } from '@/lib/questions/answer-entry';
import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
import { MultipleChoice } from './MultipleChoice';
import { MultipleSelect } from './MultipleSelect';
import { FillBlank } from './FillBlank';
import { TrueFalse } from './TrueFalse';
import { Matching } from './Matching';
import { ShortAnswer } from './ShortAnswer';
import { SequentialQuestion } from './SequentialQuestion';

interface QuestionRendererProps {
  question: Question;
  userAnswer: any;
  showExplanation: boolean;
  answerIsCorrect?: boolean;
  onAnswerChange: (answer: any) => void;
  answerEntryConfig?: AnswerEntryConfig;
}

export function QuestionRenderer({
  question,
  userAnswer,
  showExplanation,
  answerIsCorrect,
  onAnswerChange,
  answerEntryConfig,
}: QuestionRendererProps) {
  const computedIsCorrect = showExplanation
    ? evaluateQuestionAnswer(question, userAnswer).isCorrect
    : false;
  const normalizedIsCorrect = answerIsCorrect ?? computedIsCorrect;

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
          isAnswerCorrect={normalizedIsCorrect}
          onAnswerChange={onAnswerChange}
          answerEntryConfig={answerEntryConfig}
        />
      );

    case 'multiple_select':
      return (
        <MultipleSelect
          question={question}
          selectedAnswers={Array.isArray(userAnswer) ? userAnswer : []}
          showExplanation={showExplanation}
          onSelectionChange={onAnswerChange}
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
          isAnswerCorrect={normalizedIsCorrect}
          onAnswerChange={onAnswerChange}
          answerEntryConfig={answerEntryConfig}
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

    case 'flashcard': {
      // Flashcards in quiz mode are treated as short answer questions
      const flashcardAsShortAnswer: ShortAnswerQuestion = {
        ...question,
        question_type: 'short_answer',
      };
      return (
        <ShortAnswer
          question={flashcardAsShortAnswer}
          userAnswer={userAnswer || ''}
          showExplanation={showExplanation}
          isAnswerCorrect={normalizedIsCorrect}
          onAnswerChange={onAnswerChange}
          answerEntryConfig={answerEntryConfig}
        />
      );
    }

    default:
      // This should never happen due to TypeScript type checking, but handle it gracefully at runtime
      return <div>Tuntematon kysymystyyppi: {questionType}</div>;
  }
}
