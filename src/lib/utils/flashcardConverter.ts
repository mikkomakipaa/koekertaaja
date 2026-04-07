import {
  Question,
  Flashcard,
  FlashcardCompatibleQuestion,
  MultipleChoiceQuestion,
  MultipleSelectQuestion,
  FlashcardQuestion,
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

    case 'multiple_select':
      return formatMultipleSelectAnswer(question as MultipleSelectQuestion);

    case 'flashcard':
      return formatFlashcardAnswer(question as FlashcardQuestion);

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

function formatFlashcardAnswer(question: FlashcardQuestion): string {
  return question.correct_answer;
}

/**
 * Format multiple choice answer
 */
function formatMultipleChoiceAnswer(question: MultipleChoiceQuestion): string {
  return question.correct_answer;
}

function formatMultipleSelectAnswer(question: MultipleSelectQuestion): string {
  return question.correct_answers.join(', ');
}

/**
 * Format fill blank answer with acceptable alternatives
 */
function formatFillBlankAnswer(question: FillBlankQuestion): string {
  return question.correct_answer;
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
  return question.correct_answer;
}
