import { readTopicMasteryFromStorage } from '@/lib/mindMap/storage';
import type { MasteryLevel, MindMapNode, TopicMasteryAggregate } from '@/types/mindMap';

const roundPercentage = (correct: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
};

export const mapMasteryPercentageToLevel = (percentage: number): MasteryLevel => {
  if (percentage >= 80) return 'mastered';
  if (percentage >= 50) return 'partial';
  return 'none';
};

export const getTopicMasteryAggregates = (questionSetCode?: string): Record<string, TopicMasteryAggregate> => {
  const rawStats = readTopicMasteryFromStorage(questionSetCode);
  const aggregates: Record<string, TopicMasteryAggregate> = {};

  for (const [topic, stats] of Object.entries(rawStats)) {
    const total = stats.total > 0 ? stats.total : 0;
    const correct = stats.correct > 0 ? stats.correct : 0;
    const percentage = roundPercentage(correct, total);

    aggregates[topic] = {
      correct,
      total,
      percentage,
      level: mapMasteryPercentageToLevel(percentage),
    };
  }

  return aggregates;
};

export const applyTopicMasteryToTree = (
  tree: MindMapNode,
  questionSetCode?: string
): MindMapNode => {
  const masteryByTopic = getTopicMasteryAggregates(questionSetCode);

  const children = tree.children.map((topicNode) => {
    const topicMastery = masteryByTopic[topicNode.label]?.level ?? 'none';

    return {
      ...topicNode,
      mastery: topicMastery,
      // v1 renders topic leaves only.
      children: [],
    };
  });

  return {
    ...tree,
    mastery: 'none',
    children,
  };
};
