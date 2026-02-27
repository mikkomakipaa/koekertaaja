import type { BuildMindMapTreeInput, MindMapNode } from '@/types/mindMap';

interface TopicGroup {
  questionIds: Set<string>;
}

const normalizeLabel = (value?: string | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const createNode = (
  id: string,
  kind: MindMapNode['kind'],
  label: string,
  questionIds: Set<string>,
  children: MindMapNode[]
): MindMapNode => ({
  id,
  kind,
  label,
  questionCount: questionIds.size,
  questionIds: Array.from(questionIds).sort((a, b) => a.localeCompare(b)),
  children,
  mastery: 'none',
});

export const buildMindMapTree = ({
  rootId,
  rootLabel,
  questions,
}: BuildMindMapTreeInput): MindMapNode => {
  const rootQuestionIds = new Set<string>();
  const topicGroups = new Map<string, TopicGroup>();

  for (const question of questions) {
    rootQuestionIds.add(question.id);

    const topic = normalizeLabel(question.topic);
    if (!topic) continue;

    if (!topicGroups.has(topic)) {
      topicGroups.set(topic, {
        questionIds: new Set<string>(),
      });
    }

    const topicGroup = topicGroups.get(topic);
    if (!topicGroup) continue;

    topicGroup.questionIds.add(question.id);
  }

  const topicNodes = Array.from(topicGroups.entries())
    .sort(([topicA], [topicB]) => topicA.localeCompare(topicB))
    .map(([topic, topicGroup]) => createNode(`topic:${topic}`, 'branch', topic, topicGroup.questionIds, []));

  return createNode(rootId, 'root', rootLabel, rootQuestionIds, topicNodes);
};
