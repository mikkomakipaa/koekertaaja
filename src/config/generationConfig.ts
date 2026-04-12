export const QUESTIONS_PER_TOPIC_MIN = 6;
export const QUESTIONS_PER_TOPIC_MAX = 15;

/** Per-topic depth derived from material concept density, clamped to [MIN, MAX]. */
export function calcQuestionsPerTopic(totalConcepts: number, topicCount: number): number {
  return Math.min(
    QUESTIONS_PER_TOPIC_MAX,
    Math.max(QUESTIONS_PER_TOPIC_MIN, Math.round(totalConcepts / topicCount))
  );
}
