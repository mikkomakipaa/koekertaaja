import { Question } from '@/types';
import { MultipleChoice } from './MultipleChoice';
import { FillBlank } from './FillBlank';
import { TrueFalse } from './TrueFalse';
import { Matching } from './Matching';
import { ShortAnswer } from './ShortAnswer';

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
  switch (question.question_type) {
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

    default:
      return <div>Tuntematon kysymystyyppi: {question.question_type}</div>;
  }
}
