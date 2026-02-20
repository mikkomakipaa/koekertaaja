import type { Question, QuestionSet } from '@/types/questions';

const SPEED_QUIZ_MIN_QUESTIONS = 10;

export function getSpeedQuizEligibleQuestionCount(questions: Question[]): number {
  return questions.filter((question) => question.question_type !== 'matching').length;
}

/**
 * Returns a new array shuffled with the Fisher-Yates algorithm.
 *
 * The input array is never mutated, making this function safe for
 * immutable state updates and repeated use in tests.
 *
 * @typeParam T - Array item type.
 * @param array - Source array to shuffle.
 * @returns A new array with the same items in randomized order.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

/**
 * Selects a random subset of questions for one Aikahaaste session.
 *
 * Selection is performed by shuffling first and then taking the first `count`
 * items, which guarantees no duplicates when source question IDs are unique.
 *
 * @param questions - Available questions in the source question set.
 * @param count - Number of random questions to return. Defaults to 10.
 * @throws {Error} When there are fewer source questions than requested count.
 * @returns Exactly `count` randomly ordered questions.
 */
export function selectRandomQuestions(questions: Question[], count: number = SPEED_QUIZ_MIN_QUESTIONS): Question[] {
  const eligibleQuestions = questions.filter((question) => question.question_type !== 'matching');

  if (eligibleQuestions.length < count) {
    throw new Error(
      `Not enough questions for speed quiz: requires at least ${count}, received ${eligibleQuestions.length}`
    );
  }

  return shuffleArray(eligibleQuestions).slice(0, count);
}

/**
 * Checks whether a question set is eligible for Aikahaaste mode.
 *
 * Eligibility rules:
 * 1. Mode must be `quiz` (flashcards are not supported).
 * 2. Question count must be at least 10.
 *
 * @param questionSet - The question set metadata to evaluate.
 * @returns `true` when Aikahaaste can be started, otherwise `false`.
 */
export function canRunSpeedQuiz(questionSet: QuestionSet): boolean {
  return questionSet.mode === 'quiz' && questionSet.question_count >= SPEED_QUIZ_MIN_QUESTIONS;
}

/**
 * Returns a localized reason why Aikahaaste cannot be started.
 *
 * The function returns `null` for eligible sets and a Finnish UI message for
 * the first failed eligibility rule.
 *
 * @param questionSet - The question set metadata to evaluate.
 * @returns `null` when eligible, otherwise a Finnish validation message.
 */
export function getSpeedQuizEligibilityMessage(questionSet: QuestionSet): string | null {
  if (questionSet.question_count < SPEED_QUIZ_MIN_QUESTIONS) {
    return 'Tarvitaan vähintään 10 kysymystä';
  }

  if (questionSet.mode !== 'quiz') {
    return 'Aikahaaste toimii vain tietovisoilla';
  }

  return null;
}
