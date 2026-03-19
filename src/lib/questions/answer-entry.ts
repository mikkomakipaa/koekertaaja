import type { Question, QuestionType } from '@/types';

export interface AnswerEntryConfig {
  variant: 'freeform' | 'compact';
  placeholder: string;
  notationHint?: string;
  feedbackHint?: string;
  acceptedFormats?: string[];
  mathInputType?: 'fraction' | 'mixed_number' | 'fraction_or_mixed' | 'percentage' | 'currency';
  isStructuredMath: boolean;
}

const BASE_HINTS: Record<QuestionType, string> = {
  fill_blank: 'Esim: sana, termi tai lyhyt vastaus',
  short_answer: 'Kirjoita omin sanoin (1-3 lausetta)',
  multiple_choice: 'Valitse yksi vaihtoehto',
  multiple_select: 'Valitse kaikki oikeat vaihtoehdot',
  true_false: 'Valitse totta tai tarua',
  matching: 'Yhdistä oikeat parit',
  sequential: 'Järjestä kohteet oikeaan järjestykseen',
  flashcard: 'Näytä vastaus ja arvioi muistaminen',
};

const FRACTION_KEYWORDS = /(murtol|sekaluk|osoittaj|nimitt|lavent|supist|murto-os|muunna.*murtoluv|kirjoita.*murtoluk)/;
const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;
const MIXED_NUMBER_PATTERN = /^-?\d+\s+\d+\s*\/\s*\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;
const PERCENT_PATTERN = /^-?\d+(?:[.,]\d+)?\s*%$/;
const CURRENCY_PATTERN = /^-?\d+(?:[.,]\d+)?\s*€$/;
const UNIT_PATTERN = /^-?\d+(?:[.,]\d+)?\s*[a-zA-ZåäöÅÄÖ°]+$/;
const GENERIC_FRACTION_EXAMPLE = '3/4';
const GENERIC_MIXED_NUMBER_EXAMPLE = '1 1/2';
const GENERIC_DECIMAL_EXAMPLE = '0,75';
const GENERIC_PERCENT_EXAMPLE = '75 %';
const GENERIC_CURRENCY_EXAMPLE = '12 €';
const GENERIC_UNIT_EXAMPLE = '12 cm';

function normalizeCandidate(answer: string): string {
  return answer.trim().replace(/\s+/g, ' ');
}

function hasLatexDelimiters(value: string): boolean {
  return value.includes('$$');
}

function latexToPlainText(value: string): string {
  return normalizeCandidate(
    value
      .replace(/\$\$\s*(-?\d+)\s*\\frac\s*{([^}]*)}\s*{([^}]*)}\s*\$\$/g, '$1 $2/$3')
      .replace(/\$\$\s*\\frac\s*{([^}]*)}\s*{([^}]*)}\s*\$\$/g, '$1/$2')
      .replace(/\$\$/g, '')
      .replace(/\\div/g, '÷')
      .replace(/\\times|\\cdot/g, '·')
      .replace(/\\left|\\right/g, '')
      .replace(/[{}]/g, '')
  );
}

function toComparableAnswer(value: string): string {
  return hasLatexDelimiters(value) ? latexToPlainText(value) : normalizeCandidate(value);
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

function isFraction(value: string): boolean {
  return FRACTION_PATTERN.test(toComparableAnswer(value));
}

function isMixedNumber(value: string): boolean {
  return MIXED_NUMBER_PATTERN.test(toComparableAnswer(value));
}

function isStructuredNumericValue(value: string): boolean {
  const normalized = toComparableAnswer(value);
  return (
    isFraction(normalized) ||
    isMixedNumber(normalized) ||
    DECIMAL_PATTERN.test(normalized) ||
    PERCENT_PATTERN.test(normalized) ||
    UNIT_PATTERN.test(normalized) ||
    CURRENCY_PATTERN.test(normalized)
  );
}

function getStructuredExample(params: {
  fractionAnswer?: string;
  mixedNumberAnswer?: string;
  candidates: string[];
}): string {
  const { fractionAnswer, mixedNumberAnswer, candidates } = params;

  if (fractionAnswer) {
    return GENERIC_FRACTION_EXAMPLE;
  }

  if (mixedNumberAnswer) {
    return GENERIC_MIXED_NUMBER_EXAMPLE;
  }

  const normalizedCandidates = candidates.map(toComparableAnswer);

  if (normalizedCandidates.some((candidate) => PERCENT_PATTERN.test(candidate))) {
    return GENERIC_PERCENT_EXAMPLE;
  }

  if (normalizedCandidates.some((candidate) => CURRENCY_PATTERN.test(candidate))) {
    return GENERIC_CURRENCY_EXAMPLE;
  }

  if (normalizedCandidates.some((candidate) => UNIT_PATTERN.test(candidate))) {
    return GENERIC_UNIT_EXAMPLE;
  }

  if (normalizedCandidates.some((candidate) => DECIMAL_PATTERN.test(candidate))) {
    return GENERIC_DECIMAL_EXAMPLE;
  }

  return GENERIC_FRACTION_EXAMPLE;
}

function getMathInputType(params: {
  fractionAnswer?: string;
  mixedNumberAnswer?: string;
  isFractionLike: boolean;
  percentageAnswer?: string;
  currencyAnswer?: string;
}): AnswerEntryConfig['mathInputType'] {
  const { fractionAnswer, mixedNumberAnswer, isFractionLike, percentageAnswer, currencyAnswer } = params;

  if (fractionAnswer && mixedNumberAnswer) {
    return 'fraction_or_mixed';
  }

  if (mixedNumberAnswer) {
    return 'mixed_number';
  }

  if (fractionAnswer || isFractionLike) {
    return 'fraction';
  }

  if (percentageAnswer) {
    return 'percentage';
  }

  if (currencyAnswer) {
    return 'currency';
  }

  return undefined;
}

export function getAnswerEntryConfig(question: Question): AnswerEntryConfig {
  const basePlaceholder =
    question.question_type === 'fill_blank' && question.question_text.toLowerCase().includes('miksi')
      ? 'Vinkki: aloita sanalla koska...'
      : BASE_HINTS[question.question_type];

  if (question.question_type !== 'short_answer' && question.question_type !== 'fill_blank') {
    return {
      variant: 'freeform',
      placeholder: basePlaceholder,
      isStructuredMath: false,
    };
  }

  const candidates = collectAnswerCandidates(question);
  const lowerQuestionText = question.question_text.toLowerCase();
  const fractionAnswer = candidates.find(isFraction);
  const mixedNumberAnswer = candidates.find(isMixedNumber);
  const percentageAnswer = candidates.find((candidate) => PERCENT_PATTERN.test(toComparableAnswer(candidate)));
  const currencyAnswer = candidates.find((candidate) => CURRENCY_PATTERN.test(toComparableAnswer(candidate)));
  const isFractionLike = Boolean(fractionAnswer || mixedNumberAnswer || FRACTION_KEYWORDS.test(lowerQuestionText));
  const allStructured = candidates.length > 0 && candidates.every(isStructuredNumericValue);

  if (!isFractionLike && !(question.question_type === 'short_answer' && allStructured)) {
    return {
      variant: question.question_type === 'short_answer' ? 'freeform' : 'compact',
      placeholder: basePlaceholder,
      isStructuredMath: false,
    };
  }

  const mathInputType = getMathInputType({
    fractionAnswer,
    mixedNumberAnswer,
    isFractionLike,
    percentageAnswer,
    currencyAnswer,
  });

  const preferredExample = getStructuredExample({
    fractionAnswer,
    mixedNumberAnswer,
    candidates,
  });
  const acceptedFormats = [fractionAnswer, mixedNumberAnswer]
    .filter((answer): answer is string => Boolean(answer))
    .filter((answer, index, all) => all.indexOf(answer) === index);
  const placeholderExample = hasLatexDelimiters(preferredExample)
    ? latexToPlainText(preferredExample)
    : preferredExample;

  let notationHint = `Kirjoita vastaus lyhyesti, esimerkiksi ${preferredExample}.`;
  let feedbackHint = `Tarkista myös kirjoitustapa. Kokeile muotoa ${preferredExample}.`;

  if (fractionAnswer && mixedNumberAnswer) {
    notationHint = `Kirjoita vastaus murtolukuna muodossa ${GENERIC_FRACTION_EXAMPLE}. Voit kirjoittaa myös sekalukuna, esimerkiksi ${GENERIC_MIXED_NUMBER_EXAMPLE}.`;
    feedbackHint = `Tarkista kirjoitustapa. Käytä murtolukua muodossa ${GENERIC_FRACTION_EXAMPLE} tai sekalukua muodossa ${GENERIC_MIXED_NUMBER_EXAMPLE}.`;
  } else if (fractionAnswer) {
    notationHint = `Kirjoita murtoluku muodossa ${GENERIC_FRACTION_EXAMPLE}.`;
    feedbackHint = `Tarkista kirjoitustapa. Käytä murtolukua muodossa ${GENERIC_FRACTION_EXAMPLE}.`;
  } else if (mixedNumberAnswer) {
    notationHint = `Kirjoita sekaluku muodossa ${GENERIC_MIXED_NUMBER_EXAMPLE}.`;
    feedbackHint = `Tarkista kirjoitustapa. Käytä sekalukua muodossa ${GENERIC_MIXED_NUMBER_EXAMPLE}.`;
  } else if (mathInputType === 'percentage') {
    notationHint = `Kirjoita prosenttiluku muodossa ${GENERIC_PERCENT_EXAMPLE}.`;
    feedbackHint = `Tarkista kirjoitustapa. Kokeile muotoa ${GENERIC_PERCENT_EXAMPLE}.`;
  } else if (mathInputType === 'currency') {
    notationHint = `Kirjoita rahasumma muodossa ${GENERIC_CURRENCY_EXAMPLE}.`;
    feedbackHint = `Tarkista kirjoitustapa. Kokeile muotoa ${GENERIC_CURRENCY_EXAMPLE}.`;
  }

  return {
    variant: 'compact',
    placeholder: `Esim. ${placeholderExample}`,
    notationHint,
    feedbackHint,
    acceptedFormats,
    mathInputType,
    isStructuredMath: isFractionLike || allStructured,
  };
}
