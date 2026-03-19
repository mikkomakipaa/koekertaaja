import type { Question } from '@/types';
import { isAnswerAcceptable } from '@/lib/utils/answerMatching';
import { smartValidateAnswer, type SmartMatchType } from '@/lib/utils/smartAnswerValidation';

export type AnswerNotation =
  | 'empty'
  | 'fraction'
  | 'mixed_number'
  | 'decimal'
  | 'percentage'
  | 'currency'
  | 'unit'
  | 'text'
  | 'other';

export type NotationFrictionSignal =
  | 'none'
  | 'accepted_equivalent'
  | 'likely_format_issue'
  | 'content_misunderstanding';

export interface AnswerFormatDiagnostics {
  userNotation: AnswerNotation;
  expectedNotations: AnswerNotation[];
  matchedAnswer?: string;
  acceptedEquivalentForm: boolean;
  notationFrictionSignal: NotationFrictionSignal;
  isStructuredMath: boolean;
}

export interface QuestionAnswerEvaluation {
  isCorrect: boolean;
  correctAnswer: unknown;
  matchType?: SmartMatchType;
  diagnostics?: AnswerFormatDiagnostics;
}

const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;
const MIXED_NUMBER_PATTERN = /^-?\d+\s+\d+\s*\/\s*\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;
const PERCENT_PATTERN = /^-?\d+(?:[.,]\d+)?\s*%$/;
const CURRENCY_PATTERN = /^-?\d+(?:[.,]\d+)?\s*€$/;
const UNIT_PATTERN = /^-?\d+(?:[.,]\d+)?\s*[a-zA-ZåäöÅÄÖ°]+$/;
const MATH_ATTEMPT_PATTERN = /[\d/%.,]/;

function normalizeCandidate(answer: string): string {
  return answer.trim().replace(/\s+/g, ' ');
}

function collectAnswerCandidates(question: Question): string[] {
  if (!('correct_answer' in question) || typeof question.correct_answer !== 'string') {
    return [];
  }

  const acceptableAnswers = 'acceptable_answers' in question && Array.isArray(question.acceptable_answers)
    ? question.acceptable_answers.filter((answer): answer is string => typeof answer === 'string')
    : [];

  return [question.correct_answer, ...acceptableAnswers]
    .map(normalizeCandidate)
    .filter((answer, index, all) => answer.length > 0 && all.indexOf(answer) === index);
}

function detectAnswerNotation(answer: string): AnswerNotation {
  const normalized = normalizeCandidate(answer);

  if (!normalized) {
    return 'empty';
  }
  if (MIXED_NUMBER_PATTERN.test(normalized)) {
    return 'mixed_number';
  }
  if (FRACTION_PATTERN.test(normalized)) {
    return 'fraction';
  }
  if (PERCENT_PATTERN.test(normalized)) {
    return 'percentage';
  }
  if (CURRENCY_PATTERN.test(normalized)) {
    return 'currency';
  }
  if (UNIT_PATTERN.test(normalized)) {
    return 'unit';
  }
  if (DECIMAL_PATTERN.test(normalized)) {
    return 'decimal';
  }
  if (/^[\p{L}\s-]+$/u.test(normalized)) {
    return 'text';
  }
  return 'other';
}

function isPlainNumericAnswer(answer: string): boolean {
  return DECIMAL_PATTERN.test(normalizeCandidate(answer));
}

function buildUserAnswerVariants(question: Question, userAnswer: string): string[] {
  const normalizedUserAnswer = normalizeCandidate(userAnswer);
  const variants = [normalizedUserAnswer];

  if (!normalizedUserAnswer || !isPlainNumericAnswer(normalizedUserAnswer)) {
    return variants;
  }

  const candidates = collectAnswerCandidates(question);
  const expectedNotations = Array.from(new Set(candidates.map(detectAnswerNotation)));

  if (expectedNotations.length === 1 && expectedNotations[0] === 'percentage') {
    variants.push(`${normalizedUserAnswer} %`, `${normalizedUserAnswer}%`);
  }

  if (expectedNotations.length === 1 && expectedNotations[0] === 'currency') {
    variants.push(`${normalizedUserAnswer} €`);
  }

  return variants.filter((variant, index, all) => variant.length > 0 && all.indexOf(variant) === index);
}

function buildDiagnostics(
  question: Question,
  userAnswer: string,
  isCorrect: boolean,
  matchedAnswer: string | undefined,
  matchType: SmartMatchType
): AnswerFormatDiagnostics | undefined {
  if (question.question_type !== 'short_answer' && question.question_type !== 'fill_blank' && question.question_type !== 'flashcard') {
    return undefined;
  }

  const candidates = collectAnswerCandidates(question);
  const expectedNotations = Array.from(new Set(candidates.map(detectAnswerNotation)));
  const userNotation = detectAnswerNotation(userAnswer);
  const isStructuredMath = expectedNotations.some((notation) =>
    ['fraction', 'mixed_number', 'decimal', 'percentage', 'currency', 'unit'].includes(notation)
  );

  let notationFrictionSignal: NotationFrictionSignal = 'none';
  const acceptedEquivalentForm =
    isCorrect &&
    matchType === 'numerical' &&
    Boolean(matchedAnswer) &&
    matchedAnswer !== normalizeCandidate(userAnswer) &&
    detectAnswerNotation(matchedAnswer ?? '') !== userNotation;

  if (acceptedEquivalentForm) {
    notationFrictionSignal = 'accepted_equivalent';
  } else if (!isCorrect && isStructuredMath && userAnswer.trim()) {
    notationFrictionSignal =
      userNotation === 'other' && MATH_ATTEMPT_PATTERN.test(userAnswer)
        ? 'likely_format_issue'
        : 'content_misunderstanding';
  }

  return {
    userNotation,
    expectedNotations,
    matchedAnswer,
    acceptedEquivalentForm,
    notationFrictionSignal,
    isStructuredMath,
  };
}

export function evaluateQuestionAnswer(
  question: Question,
  userAnswer: unknown,
  grade?: number,
  subject?: string
): QuestionAnswerEvaluation {
  const evaluateTextAnswer = (correctAnswer: string, acceptableAnswers?: string[]): QuestionAnswerEvaluation => {
    const stringAnswer = String(userAnswer ?? '');
    const userAnswerVariants = buildUserAnswerVariants(question, stringAnswer);
    const candidates = [correctAnswer, ...(acceptableAnswers ?? [])];
    const smartMatches = userAnswerVariants
      .flatMap((answerVariant) => candidates.map((candidate) => ({
        candidate,
        answerVariant,
        result: smartValidateAnswer(answerVariant, candidate, { questionType: question.question_type, subject }),
      })))
      .filter(({ result }) => result.isCorrect);
    const smartMatch = smartMatches[0];
    const isCorrect = userAnswerVariants.some((answerVariant) =>
      isAnswerAcceptable(
        answerVariant,
        correctAnswer,
        acceptableAnswers,
        grade,
        { questionType: question.question_type, subject }
      )
    );
    const matchType = isCorrect
      ? (smartMatch?.result.matchType && smartMatch.result.matchType !== 'none'
        ? smartMatch.result.matchType
        : 'exact')
      : 'none';

    return {
      isCorrect,
      correctAnswer,
      matchType,
      diagnostics: buildDiagnostics(
        question,
        stringAnswer,
        isCorrect,
        smartMatch?.candidate ? normalizeCandidate(smartMatch.candidate) : undefined,
        matchType
      ),
    };
  };

  switch (question.question_type) {
    case 'multiple_choice':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
        matchType: userAnswer === question.correct_answer ? 'exact' : 'none',
      };
    case 'multiple_select': {
      const userSelections = Array.isArray(userAnswer)
        ? userAnswer.filter((value): value is string => typeof value === 'string')
        : [];
      const userSet = new Set(userSelections);
      const correctSet = new Set(question.correct_answers);

      if (userSet.size !== correctSet.size) {
        return {
          isCorrect: false,
          correctAnswer: question.correct_answers,
          matchType: 'none',
        };
      }

      for (const correct of correctSet) {
        if (!userSet.has(correct)) {
          return {
            isCorrect: false,
            correctAnswer: question.correct_answers,
            matchType: 'none',
          };
        }
      }

      return {
        isCorrect: true,
        correctAnswer: question.correct_answers,
        matchType: 'exact',
      };
    }
    case 'fill_blank': {
      return evaluateTextAnswer(question.correct_answer, question.acceptable_answers);
    }
    case 'true_false':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
        matchType: userAnswer === question.correct_answer ? 'exact' : 'none',
      };
    case 'matching': {
      const userMatches = (userAnswer ?? {}) as Record<string, string>;
      const isCorrect = question.pairs.every(
        (pair) => userMatches[pair.left] === pair.right
      );
      return { isCorrect, correctAnswer: question.pairs, matchType: isCorrect ? 'exact' : 'none' };
    }
    case 'short_answer': {
      return evaluateTextAnswer(question.correct_answer, question.acceptable_answers);
    }
    case 'sequential':
      return {
        isCorrect: JSON.stringify(userAnswer) === JSON.stringify(question.correct_order),
        correctAnswer: question.correct_order,
        matchType:
          JSON.stringify(userAnswer) === JSON.stringify(question.correct_order)
            ? 'exact'
            : 'none',
      };
    case 'flashcard': {
      return evaluateTextAnswer(question.correct_answer);
    }
    default:
      return { isCorrect: false, correctAnswer: null, matchType: 'none' };
  }
}
