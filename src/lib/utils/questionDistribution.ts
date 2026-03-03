/**
 * Question Distribution Calculator
 *
 * Calculates how questions should be distributed across topics based on
 * coverage percentages from enhanced topic analysis.
 */

import { EnhancedTopic } from '@/lib/ai/topicIdentifier';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'questionDistribution' });

export interface TopicDistribution {
  topic: string;
  targetCount: number;
  coverage: number;
  keywords: string[];
  subtopics: string[];
  difficulty: string;
  importance: string;
  questionCapacity?: number;
  flashcardCapacity?: number;
}

export interface OptimalQuestionCounts {
  /** Optimal quiz question count based on content capacity and topic priority */
  quizCount: number;
  /** Optimal flashcard count based on content capacity and topic priority */
  flashcardCount: number;
}

const IMPORTANCE_WEIGHT: Record<'high' | 'medium' | 'low', number> = {
  high: 1.0,
  medium: 0.8,
  low: 0.6,
};

/**
 * Calculate optimal question and flashcard counts from topic capacities.
 *
 * Each topic's capacity is weighted by its importance so high-priority topics
 * contribute more to the total. The result is capped at `requestedTotal` so
 * we never generate more than the user asked for.
 */
export function calculateOptimalCounts(
  topics: EnhancedTopic[],
  requestedTotal: number
): OptimalQuestionCounts {
  if (topics.length === 0) {
    return { quizCount: requestedTotal, flashcardCount: requestedTotal };
  }

  let totalQuizCapacity = 0;
  let totalFlashcardCapacity = 0;

  for (const topic of topics) {
    const weight = IMPORTANCE_WEIGHT[topic.importance] ?? 0.8;
    // Fall back to keyword/subtopic estimate when capacity not provided
    const qCap = topic.questionCapacity
      ?? Math.min(50, Math.max(3, topic.keywords.length * 4 + topic.subtopics.length * 3));
    const fCap = topic.flashcardCapacity
      ?? Math.min(30, Math.max(2, topic.keywords.length * 3 + topic.subtopics.length * 2));
    totalQuizCapacity += Math.round(qCap * weight);
    totalFlashcardCapacity += Math.round(fCap * weight);
  }

  logger.info(
    {
      topics: topics.map(t => ({
        name: t.name,
        importance: t.importance,
        questionCapacity: t.questionCapacity,
        flashcardCapacity: t.flashcardCapacity,
      })),
      totalQuizCapacity,
      totalFlashcardCapacity,
      requestedTotal,
    },
    'Calculated optimal question counts from topic capacities'
  );

  return {
    quizCount: Math.min(totalQuizCapacity, requestedTotal),
    flashcardCount: Math.min(totalFlashcardCapacity, requestedTotal),
  };
}

/**
 * Calculate question distribution based on topic coverage percentages.
 *
 * Uses coverage to determine how many questions should be generated for each topic.
 * Ensures total exactly matches the actual generation count (adjusts for rounding).
 *
 * @param topics - Enhanced topics with coverage percentages
 * @param totalQuestions - User-requested total (used for coverage math if actualTotal omitted)
 * @param actualTotal - Optimal/capped total to distribute (defaults to totalQuestions)
 * @returns Distribution array with target counts per topic
 */
export function calculateDistribution(
  topics: EnhancedTopic[],
  totalQuestions: number,
  actualTotal: number = totalQuestions
): TopicDistribution[] {
  if (topics.length === 0) {
    logger.warn('No topics provided for distribution calculation');
    return [];
  }

  // Calculate target count for each topic based on coverage
  const distribution = topics.map(topic => {
    const targetCount = Math.round(actualTotal * topic.coverage);

    return {
      topic: topic.name,
      targetCount,
      coverage: topic.coverage,
      keywords: topic.keywords,
      subtopics: topic.subtopics,
      difficulty: topic.difficulty,
      importance: topic.importance,
      questionCapacity: topic.questionCapacity,
      flashcardCapacity: topic.flashcardCapacity,
    };
  });

  // Verify total matches (rounding may cause ±1 difference)
  const distributedTotal = distribution.reduce((sum, d) => sum + d.targetCount, 0);

  if (distributedTotal !== actualTotal) {
    const difference = actualTotal - distributedTotal;

    logger.warn(
      {
        requested: totalQuestions,
        actual: actualTotal,
        distributed: distributedTotal,
        difference,
      },
      'Distribution rounding caused mismatch, adjusting'
    );

    // Adjust the topic with highest importance (or largest coverage if tied)
    const toAdjust = distribution.reduce((best, current) => {
      if (current.importance === 'high' && best.importance !== 'high') {
        return current;
      }
      if (current.importance === best.importance) {
        return current.coverage > best.coverage ? current : best;
      }
      return best;
    });

    toAdjust.targetCount += difference;

    logger.info(
      {
        adjustedTopic: toAdjust.topic,
        adjustment: difference,
        newCount: toAdjust.targetCount,
      },
      'Adjusted topic count to match total'
    );
  }

  // Final verification
  const finalTotal = distribution.reduce((sum, d) => sum + d.targetCount, 0);
  if (finalTotal !== actualTotal) {
    logger.error(
      {
        requested: totalQuestions,
        actual: actualTotal,
        calculated: finalTotal,
        distribution,
      },
      'Failed to match total questions after adjustment'
    );
    throw new Error(
      `Distribution total (${finalTotal}) does not match actual target (${actualTotal})`
    );
  }

  logger.info(
    {
      totalQuestions,
      distribution: distribution.map(d => ({
        topic: d.topic,
        count: d.targetCount,
        percentage: Math.round(d.coverage * 100),
        importance: d.importance,
      })),
    },
    'Calculated question distribution from coverage'
  );

  return distribution;
}

/**
 * Format distribution for prompt display
 */
export function formatDistributionForPrompt(distribution: TopicDistribution[]): string {
  return distribution
    .map(
      d =>
        `- ${d.topic}: ${d.targetCount} kysymystä (${Math.round(d.coverage * 100)}%)\n` +
        `  Vaikeustaso: ${d.difficulty}\n` +
        `  Avainsanat: ${d.keywords.join(', ')}\n` +
        `  Aliaihealueet: ${d.subtopics.join(', ')}`
    )
    .join('\n\n');
}

/**
 * Validate actual question distribution against expected
 *
 * @param questions - Generated questions
 * @param distribution - Expected distribution
 * @returns Validation report with deviations
 */
export function validateDistribution(
  questions: Array<{ question_text: string; topic?: string }>,
  distribution: TopicDistribution[]
): {
  topic: string;
  expected: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
}[] {
  const results = distribution.map(d => {
    // Count questions matching this topic's keywords
    const actual = questions.filter(q => {
      const text = q.question_text.toLowerCase();
      return d.keywords.some(keyword => text.includes(keyword.toLowerCase()));
    }).length;

    const deviation = actual - d.targetCount;
    const deviationPercent = (deviation / d.targetCount) * 100;

    return {
      topic: d.topic,
      expected: d.targetCount,
      actual,
      deviation,
      deviationPercent,
    };
  });

  const totalDeviation = results.reduce((sum, r) => sum + Math.abs(r.deviation), 0);
  const avgDeviationPercent =
    results.reduce((sum, r) => sum + Math.abs(r.deviationPercent), 0) / results.length;

  logger.info(
    {
      validation: results,
      totalDeviation,
      avgDeviationPercent: Math.round(avgDeviationPercent),
    },
    'Validated question distribution'
  );

  // Warn if significant deviation
  if (avgDeviationPercent > 15) {
    logger.warn(
      {
        avgDeviationPercent,
        threshold: 15,
      },
      'Distribution has significant deviation from target'
    );
  }

  return results;
}
