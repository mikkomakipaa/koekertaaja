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
}

/**
 * Calculate question distribution based on topic coverage percentages
 *
 * Uses coverage to determine how many questions should be generated for each topic.
 * Ensures total exactly matches requested count (adjusts for rounding).
 *
 * @param topics - Enhanced topics with coverage percentages
 * @param totalQuestions - Total number of questions to generate
 * @returns Distribution array with target counts per topic
 */
export function calculateDistribution(
  topics: EnhancedTopic[],
  totalQuestions: number
): TopicDistribution[] {
  if (topics.length === 0) {
    logger.warn('No topics provided for distribution calculation');
    return [];
  }

  // Calculate target count for each topic based on coverage
  const distribution = topics.map(topic => {
    const targetCount = Math.round(totalQuestions * topic.coverage);

    return {
      topic: topic.name,
      targetCount,
      coverage: topic.coverage,
      keywords: topic.keywords,
      subtopics: topic.subtopics,
      difficulty: topic.difficulty,
      importance: topic.importance,
    };
  });

  // Verify total matches (rounding may cause ±1 difference)
  const distributedTotal = distribution.reduce((sum, d) => sum + d.targetCount, 0);

  if (distributedTotal !== totalQuestions) {
    const difference = totalQuestions - distributedTotal;

    logger.warn(
      {
        requested: totalQuestions,
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
  if (finalTotal !== totalQuestions) {
    logger.error(
      {
        requested: totalQuestions,
        calculated: finalTotal,
        distribution,
      },
      'Failed to match total questions after adjustment'
    );
    throw new Error(
      `Distribution total (${finalTotal}) does not match requested (${totalQuestions})`
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
