/**
 * Coverage Validation Utilities
 *
 * Validates that generated questions actually cover all identified topics
 * according to the calculated distribution using keyword-based detection.
 */

import { TopicDistribution } from './questionDistribution';
import { createLogger } from '@/lib/logger';
import type { Question } from '@/types';

const logger = createLogger({ module: 'coverageValidation' });

export interface TopicCoverage {
  topic: string;
  expectedCount: number;
  actualCount: number;
  deviation: number;
  deviationPercent: number;
  matchedKeywords: string[];
  coveredSubtopics: string[];
  isUnderRepresented: boolean;
}

export interface CoverageValidationResult {
  totalQuestions: number;
  coverageByTopic: TopicCoverage[];
  overallDeviation: number;
  isAcceptable: boolean;
  warnings: string[];
}

/**
 * Validate that questions cover topics according to distribution
 *
 * Uses keyword matching to detect which topic each question belongs to,
 * then compares actual counts vs expected distribution.
 */
export function validateCoverage(
  questions: Question[],
  distribution: TopicDistribution[]
): CoverageValidationResult {
  const coverageByTopic = distribution.map(dist => {
    // Find questions matching this topic's keywords
    const matchedQuestions = questions.filter(q =>
      matchesTopicKeywords(q, dist.keywords)
    );

    const actualCount = matchedQuestions.length;
    const deviation = actualCount - dist.targetCount;
    const deviationPercent =
      dist.targetCount > 0 ? Math.abs((deviation / dist.targetCount) * 100) : 0;

    // Check which keywords appear in questions
    const matchedKeywords = dist.keywords.filter(keyword =>
      matchedQuestions.some(q =>
        questionContainsKeyword(q, keyword)
      )
    );

    // Check which subtopics are covered
    const coveredSubtopics = dist.subtopics.filter(subtopic =>
      matchedQuestions.some(q =>
        q.question_text.toLowerCase().includes(subtopic.toLowerCase())
      )
    );

    // Under-represented if >20% below target
    const isUnderRepresented = deviationPercent > 20 && deviation < 0;

    return {
      topic: dist.topic,
      expectedCount: dist.targetCount,
      actualCount,
      deviation,
      deviationPercent,
      matchedKeywords,
      coveredSubtopics,
      isUnderRepresented,
    };
  });

  const overallDeviation = coverageByTopic.reduce(
    (sum, c) => sum + Math.abs(c.deviation),
    0
  );

  const warnings: string[] = [];

  // Check for under-represented topics
  coverageByTopic.forEach(coverage => {
    const distEntry = distribution.find(d => d.topic === coverage.topic);
    if (!distEntry) return;

    if (coverage.isUnderRepresented) {
      warnings.push(
        `Topic "${coverage.topic}" is under-represented: ` +
        `expected ${coverage.expectedCount}, got ${coverage.actualCount} ` +
        `(${Math.round(coverage.deviationPercent)}% deviation)`
      );
    }

    // Check for missing keywords (less than 50% found)
    const totalKeywords = distEntry.keywords.length;
    const foundKeywords = coverage.matchedKeywords.length;
    if (foundKeywords < totalKeywords * 0.5 && totalKeywords > 0) {
      warnings.push(
        `Topic "${coverage.topic}" has low keyword coverage: ` +
        `${foundKeywords}/${totalKeywords} keywords found`
      );
    }

    // Check for uncovered subtopics
    const totalSubtopics = distEntry.subtopics.length;
    const coveredCount = coverage.coveredSubtopics.length;
    const uncoveredSubtopics = totalSubtopics - coveredCount;
    if (uncoveredSubtopics > 0 && totalSubtopics > 0) {
      warnings.push(
        `Topic "${coverage.topic}" missing ${uncoveredSubtopics}/${totalSubtopics} subtopics`
      );
    }
  });

  // Overall deviation threshold: 10% of total questions
  const isAcceptable = overallDeviation <= questions.length * 0.1;

  logger.info(
    {
      totalQuestions: questions.length,
      overallDeviation,
      isAcceptable,
      coverageByTopic: coverageByTopic.map(c => ({
        topic: c.topic,
        expected: c.expectedCount,
        actual: c.actualCount,
        deviation: c.deviation,
        keywordCoverage: `${c.matchedKeywords.length}/${
          distribution.find(d => d.topic === c.topic)?.keywords.length || 0
        }`,
      })),
    },
    'Coverage validation completed'
  );

  if (warnings.length > 0) {
    logger.warn({ warnings, count: warnings.length }, 'Coverage validation warnings');
  }

  return {
    totalQuestions: questions.length,
    coverageByTopic,
    overallDeviation,
    isAcceptable,
    warnings,
  };
}

/**
 * Check if question matches topic keywords
 *
 * Searches question text, correct answer, and wrong answers for keyword matches.
 */
function matchesTopicKeywords(
  question: Question,
  keywords: string[]
): boolean {
  // Match if any keyword appears in question/answers
  return keywords.some(keyword =>
    questionContainsKeyword(question, keyword)
  );
}

/**
 * Check if question contains a specific keyword
 *
 * Extracts searchable text from different question types.
 */
function questionContainsKeyword(
  question: Question,
  keyword: string
): boolean {
  const textParts: string[] = [question.question_text];

  // Extract answer text based on question type
  switch (question.question_type) {
    case 'multiple_choice':
      textParts.push(question.correct_answer);
      textParts.push(...question.options);
      break;
    case 'multiple_select':
      textParts.push(...question.correct_answers);
      textParts.push(...question.options);
      break;
    case 'fill_blank':
    case 'short_answer':
      textParts.push(question.correct_answer);
      if (question.acceptable_answers) {
        textParts.push(...question.acceptable_answers);
      }
      break;
    case 'true_false':
      textParts.push(String(question.correct_answer));
      break;
    case 'matching':
      question.pairs.forEach(pair => {
        textParts.push(pair.left, pair.right);
      });
      break;
    case 'sequential':
      if (Array.isArray(question.items)) {
        question.items.forEach(item => {
          if (typeof item === 'string') {
            textParts.push(item);
          } else {
            textParts.push(item.text);
          }
        });
      }
      break;
    case 'flashcard':
      textParts.push(question.correct_answer);
      break;
  }

  const searchText = textParts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchText.includes(keyword.toLowerCase());
}

/**
 * Get detailed coverage report as formatted string
 *
 * Useful for logging and debugging in development.
 */
export function formatCoverageReport(
  result: CoverageValidationResult
): string {
  const lines: string[] = [
    '=== Coverage Validation Report ===',
    `Total Questions: ${result.totalQuestions}`,
    `Overall Deviation: ${result.overallDeviation} questions`,
    `Status: ${result.isAcceptable ? '✓ PASS' : '✗ FAIL'}`,
    '',
    'Coverage by Topic:',
  ];

  result.coverageByTopic.forEach(coverage => {
    const status = coverage.isUnderRepresented ? '⚠️' : '✓';
    lines.push(
      `${status} ${coverage.topic}: ${coverage.actualCount}/${coverage.expectedCount} ` +
      `(deviation: ${coverage.deviation >= 0 ? '+' : ''}${coverage.deviation})`
    );

    if (coverage.matchedKeywords.length > 0) {
      lines.push(`  Keywords: ${coverage.matchedKeywords.join(', ')}`);
    }

    if (coverage.coveredSubtopics.length > 0) {
      lines.push(`  Subtopics: ${coverage.coveredSubtopics.join(', ')}`);
    }
  });

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    result.warnings.forEach(warning => lines.push(`  - ${warning}`));
  }

  return lines.join('\n');
}
