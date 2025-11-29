import {
  Question,
  Flashcard,
  FlashcardCompatibleQuestion,
  MultipleChoiceQuestion,
  FillBlankQuestion,
  TrueFalseQuestion,
  MatchingQuestion,
  ShortAnswerQuestion,
} from '@/types';

/**
 * Converts questions to flashcards, excluding sequential questions
 */
export function convertQuestionsToFlashcards(questions: Question[]): Flashcard[] {
  return questions
    .filter((q) => q.question_type !== 'sequential')
    .map((q) => convertQuestionToFlashcard(q as FlashcardCompatibleQuestion));
}

/**
 * Converts a single question to a flashcard
 */
function convertQuestionToFlashcard(question: FlashcardCompatibleQuestion): Flashcard {
  const front = question.question_text;
  const back = {
    answer: formatAnswer(question),
    explanation: question.explanation,
  };

  return {
    id: `flashcard-${question.id}`,
    questionId: question.id,
    front,
    back,
    questionType: question.question_type,
    originalQuestion: question,
  };
}

/**
 * Formats the answer based on question type
 */
function formatAnswer(question: FlashcardCompatibleQuestion): string {
  switch (question.question_type) {
    case 'multiple_choice':
      return formatMultipleChoiceAnswer(question as MultipleChoiceQuestion);

    case 'fill_blank':
      return formatFillBlankAnswer(question as FillBlankQuestion);

    case 'true_false':
      return formatTrueFalseAnswer(question as TrueFalseQuestion);

    case 'matching':
      return formatMatchingAnswer(question as MatchingQuestion);

    case 'short_answer':
      return formatShortAnswer(question as ShortAnswerQuestion);

    default:
      return 'Tuntematon kysymystyyppi';
  }
}

/**
 * Format multiple choice answer
 */
function formatMultipleChoiceAnswer(question: MultipleChoiceQuestion): string {
  return question.correct_answer;
}

/**
 * Format fill blank answer with acceptable alternatives
 */
function formatFillBlankAnswer(question: FillBlankQuestion): string {
  const main = question.correct_answer;
  if (question.acceptable_answers && question.acceptable_answers.length > 0) {
    const alternatives = question.acceptable_answers.join(', ');
    return `${main}\n\nHyväksytään myös: ${alternatives}`;
  }
  return main;
}

/**
 * Format true/false answer in Finnish
 */
function formatTrueFalseAnswer(question: TrueFalseQuestion): string {
  return question.correct_answer ? 'Totta' : 'Tarua';
}

/**
 * Format matching pairs as a list
 */
function formatMatchingAnswer(question: MatchingQuestion): string {
  return question.pairs
    .map((pair, index) => `${index + 1}. ${pair.left} → ${pair.right}`)
    .join('\n');
}

/**
 * Format short answer with acceptable alternatives
 */
function formatShortAnswer(question: ShortAnswerQuestion): string {
  const main = question.correct_answer;
  if (question.acceptable_answers && question.acceptable_answers.length > 0) {
    const alternatives = question.acceptable_answers.join(', ');
    return `${main}\n\nHyväksytään myös: ${alternatives}`;
  }
  return main;
}
