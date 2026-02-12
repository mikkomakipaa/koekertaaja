/**
 * Lenient answer matching for young learners (grades 4-6)
 *
 * Implements age-appropriate answer checking that accounts for:
 * - Minor spelling mistakes
 * - Extra/missing spaces
 * - Capitalization differences
 * - Similar phrasing
 */

import { smartValidateAnswer } from './smartAnswerValidation';
/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits needed to change one word into another)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1.0;

  return 1 - distance / maxLength;
}

/**
 * Check if a string represents a numeric value
 * Supports both dot and comma as decimal separator
 */
function isNumericAnswer(str: string): boolean {
  // Remove spaces and check if it matches a number pattern
  const cleaned = str.trim().replace(/\s+/g, '');
  // Match integers, decimals with . or ,, and negative numbers
  return /^-?\d+([.,]\d+)?$/.test(cleaned);
}

/**
 * Normalize numeric string for comparison
 * Converts both comma and dot to same format for comparison
 */
function normalizeNumericString(str: string): string {
  return str.trim().replace(/\s+/g, '').replace(',', '.');
}

/**
 * Normalize string for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Remove punctuation (except for numeric values)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[.,!?;:]/g, ''); // Remove punctuation
}

/**
 * Grade-specific similarity thresholds
 * Lower grades get more lenient matching
 */
const GRADE_THRESHOLDS = {
  4: 0.75, // 75% similarity required (most lenient)
  5: 0.80, // 80% similarity required
  6: 0.85, // 85% similarity required
  default: 0.90, // 90% for higher grades or no grade specified
};

/**
 * Get similarity threshold for a given grade
 */
function getSimilarityThreshold(grade?: number): number {
  if (!grade) return GRADE_THRESHOLDS.default;

  if (grade in GRADE_THRESHOLDS) {
    return GRADE_THRESHOLDS[grade as keyof typeof GRADE_THRESHOLDS];
  }

  return GRADE_THRESHOLDS.default;
}

/**
 * Check if user answer matches correct answer with lenient matching
 *
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The correct answer to match against
 * @param grade - Student's grade level (4-6) for age-appropriate leniency
 * @returns true if answer is considered correct
 */
export function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string,
  grade?: number,
  options?: { questionType?: string; subject?: string }
): boolean {
  const smartResult = smartValidateAnswer(userAnswer, correctAnswer, options);
  if (smartResult.isCorrect) {
    return true;
  }

  // Special handling for numeric answers - require exact match
  if (isNumericAnswer(correctAnswer) && isNumericAnswer(userAnswer)) {
    const normalizedUser = normalizeNumericString(userAnswer);
    const normalizedCorrect = normalizeNumericString(correctAnswer);

    // Parse as numbers for exact comparison
    const userNum = parseFloat(normalizedUser);
    const correctNum = parseFloat(normalizedCorrect);

    // Check if both parsed successfully and are equal
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      return Math.abs(userNum - correctNum) < 0.0001; // Account for floating point precision
    }
  }

  // Normalize both answers for text comparison
  const normalizedUser = normalizeString(userAnswer);
  const normalizedCorrect = normalizeString(correctAnswer);

  // Strategy 1: Exact match (after normalization)
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Strategy 2: Correct answer is contained in user answer
  // (e.g., user wrote "the photosynthesis process" when answer is "photosynthesis")
  if (normalizedUser.includes(normalizedCorrect)) {
    return true;
  }

  // Strategy 3: Fuzzy matching with grade-based threshold
  const similarity = similarityRatio(normalizedUser, normalizedCorrect);
  const threshold = getSimilarityThreshold(grade);

  return similarity >= threshold;
}

/**
 * Check if user answer matches any of the acceptable answers
 *
 * @param userAnswer - The answer provided by the user
 * @param correctAnswer - The primary correct answer
 * @param acceptableAnswers - Optional array of alternative acceptable answers
 * @param grade - Student's grade level for age-appropriate leniency
 * @returns true if answer matches any acceptable answer
 */
export function isAnswerAcceptable(
  userAnswer: string,
  correctAnswer: string,
  acceptableAnswers?: string[],
  grade?: number,
  options?: { questionType?: string; subject?: string }
): boolean {
  // Check against primary correct answer
  if (isAnswerCorrect(userAnswer, correctAnswer, grade, options)) {
    return true;
  }

  // Check against acceptable alternatives
  if (acceptableAnswers && acceptableAnswers.length > 0) {
    return acceptableAnswers.some(acceptable =>
      isAnswerCorrect(userAnswer, acceptable, grade, options)
    );
  }

  return false;
}

/**
 * Get feedback message about answer similarity
 * Useful for debugging or showing to teachers
 */
export function getAnswerFeedback(
  userAnswer: string,
  correctAnswer: string,
  grade?: number
): {
  isCorrect: boolean;
  similarity: number;
  threshold: number;
  method: 'exact' | 'contains' | 'fuzzy' | 'numeric' | 'none';
} {
  const threshold = getSimilarityThreshold(grade);

  // Check numeric answers first
  if (isNumericAnswer(correctAnswer) && isNumericAnswer(userAnswer)) {
    const normalizedUser = normalizeNumericString(userAnswer);
    const normalizedCorrect = normalizeNumericString(correctAnswer);
    const userNum = parseFloat(normalizedUser);
    const correctNum = parseFloat(normalizedCorrect);

    if (!isNaN(userNum) && !isNaN(correctNum)) {
      const isCorrect = Math.abs(userNum - correctNum) < 0.0001;
      return {
        isCorrect,
        similarity: isCorrect ? 1.0 : 0.0,
        threshold: 1.0, // Numeric answers require exact match
        method: 'numeric',
      };
    }
  }

  const normalizedUser = normalizeString(userAnswer);
  const normalizedCorrect = normalizeString(correctAnswer);

  // Check exact match
  if (normalizedUser === normalizedCorrect) {
    return {
      isCorrect: true,
      similarity: 1.0,
      threshold,
      method: 'exact',
    };
  }

  // Check contains
  if (normalizedUser.includes(normalizedCorrect)) {
    return {
      isCorrect: true,
      similarity: 0.95, // Assume high similarity for contains
      threshold,
      method: 'contains',
    };
  }

  // Check fuzzy
  const similarity = similarityRatio(normalizedUser, normalizedCorrect);
  if (similarity >= threshold) {
    return {
      isCorrect: true,
      similarity,
      threshold,
      method: 'fuzzy',
    };
  }

  // No match
  return {
    isCorrect: false,
    similarity,
    threshold,
    method: 'none',
  };
}
