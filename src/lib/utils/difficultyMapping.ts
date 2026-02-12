/**
 * Difficulty Mapping Utilities
 *
 * Maps topic difficulty to question type preferences and validates
 * that generated questions match expected difficulty levels.
 */

import { Difficulty } from '@/types';
import { QuestionType } from '@/types/questions';
import type { Question } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'difficultyMapping' });

export interface QuestionTypeWeights {
  multiple_choice: number;
  fill_blank: number;
  true_false: number;
  matching: number;
  short_answer: number;
  sequential: number;
}

/**
 * Get question type weights based on topic difficulty
 *
 * Easier topics favor simpler question types (multiple choice, true/false)
 * Harder topics favor complex question types (short answer, matching)
 */
export function getQuestionTypeWeights(
  topicDifficulty: Difficulty
): QuestionTypeWeights {
  switch (topicDifficulty) {
    case 'helppo':
      return {
        multiple_choice: 0.40, // 40% multiple choice
        fill_blank: 0.25, // 25% fill blank
        true_false: 0.20, // 20% true/false
        matching: 0.10, // 10% matching
        short_answer: 0.05, // 5% short answer
        sequential: 0.00, // 0% sequential
      };

    case 'normaali':
      return {
        multiple_choice: 0.30, // 30% multiple choice
        fill_blank: 0.25, // 25% fill blank
        true_false: 0.10, // 10% true/false
        matching: 0.20, // 20% matching
        short_answer: 0.10, // 10% short answer
        sequential: 0.05, // 5% sequential
      };

    default:
      // Default to normaali weights
      logger.warn({ topicDifficulty }, 'Unknown difficulty, using normaali weights');
      return getQuestionTypeWeights('normaali');
  }
}

/**
 * Format question type weights for AI prompt
 */
export function formatQuestionTypeWeights(weights: QuestionTypeWeights): string {
  const entries = Object.entries(weights)
    .filter(([_, weight]) => weight > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([type, weight]) => {
      const percentage = Math.round(weight * 100);
      const typeLabel = formatQuestionTypeFinnish(type as QuestionType);
      return `- ${typeLabel}: ${percentage}%`;
    });

  return entries.join('\n');
}

/**
 * Get Finnish label for question type
 */
function formatQuestionTypeFinnish(type: QuestionType): string {
  const labels: Record<QuestionType, string> = {
    multiple_choice: 'Monivalinta',
    fill_blank: 'Täydennys',
    true_false: 'Tosi/Epätosi',
    matching: 'Paritus',
    short_answer: 'Avoin vastaus',
    sequential: 'Järjestys',
    flashcard: 'Flashcard',
  };
  return labels[type] || type;
}

/**
 * Calculate weighted average difficulty from topics
 *
 * Uses coverage percentages to weight each topic's difficulty contribution.
 */
export function calculateWeightedDifficulty(
  topics: Array<{ difficulty: Difficulty; coverage: number }>
): Difficulty {
  if (topics.length === 0) {
    return 'normaali';
  }

  const difficultyScores: Record<Difficulty, number> = {
    helppo: 1,
    normaali: 2,
  };

  const weightedSum = topics.reduce((sum, topic) => {
    return sum + difficultyScores[topic.difficulty] * topic.coverage;
  }, 0);

  logger.info(
    {
      topics: topics.map(t => ({ difficulty: t.difficulty, coverage: t.coverage })),
      weightedSum,
    },
    'Calculating weighted difficulty'
  );

  // Map weighted average back to difficulty level
  // If more than 50% helppo content, return helppo, otherwise normaali
  if (weightedSum < 1.5) return 'helppo';
  return 'normaali';
}

export interface DifficultyConsistencyResult {
  expectedDifficulty: Difficulty;
  questionTypes: Record<string, number>;
  isConsistent: boolean;
  warnings: string[];
}

/**
 * Validate that question types match expected difficulty
 *
 * Checks if the distribution of question types is appropriate for
 * the expected difficulty level.
 */
export function validateDifficultyConsistency(
  questions: Question[],
  expectedDifficulty: Difficulty
): DifficultyConsistencyResult {
  if (questions.length === 0) {
    return {
      expectedDifficulty,
      questionTypes: {},
      isConsistent: true,
      warnings: [],
    };
  }

  // Count question types
  const typeCounts: Record<string, number> = {};
  questions.forEach(q => {
    typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
  });

  // Calculate percentages
  const questionTypes: Record<string, number> = {};
  Object.keys(typeCounts).forEach(type => {
    questionTypes[type] = typeCounts[type] / questions.length;
  });

  const expectedWeights = getQuestionTypeWeights(expectedDifficulty);
  const warnings: string[] = [];

  // Check for significant deviations (>30% absolute difference)
  Object.entries(expectedWeights).forEach(([type, expectedWeight]) => {
    const actualWeight = questionTypes[type] || 0;
    const deviation = Math.abs(actualWeight - expectedWeight);

    // Only warn about significant deviations for question types that should be common
    if (deviation > 0.30 && expectedWeight > 0.15) {
      warnings.push(
        `Question type "${type}" has ${Math.round(actualWeight * 100)}% ` +
          `but expected ~${Math.round(expectedWeight * 100)}% for difficulty "${expectedDifficulty}"`
      );
    }
  });

  // Check for overly complex questions on easy topics
  if (expectedDifficulty === 'helppo') {
    const complexTypes = ['short_answer', 'sequential', 'matching'];
    const complexPercentage = complexTypes.reduce((sum, type) => {
      return sum + (questionTypes[type] || 0);
    }, 0);

    if (complexPercentage > 0.3) {
      warnings.push(
        `Easy topic has ${Math.round(complexPercentage * 100)}% complex questions, ` +
          `consider simpler types`
      );
    }
  }

  const isConsistent = warnings.length === 0;

  logger.info(
    {
      expectedDifficulty,
      questionTypes: Object.entries(questionTypes).map(([type, pct]) => ({
        type,
        percentage: Math.round(pct * 100),
      })),
      isConsistent,
      warningCount: warnings.length,
    },
    'Difficulty consistency validation completed'
  );

  if (warnings.length > 0) {
    logger.warn({ warnings }, 'Difficulty consistency warnings');
  }

  return {
    expectedDifficulty,
    questionTypes,
    isConsistent,
    warnings,
  };
}
