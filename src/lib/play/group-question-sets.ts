import type { QuestionSet } from '@/types';
import { stripDifficultySuffix } from '@/lib/question-set-name';

export interface GroupedQuestionSets {
  key: string;
  name: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  grade?: number;
  sets: QuestionSet[];
}

const getSeriesBaseKey = (set: QuestionSet, cleanName: string): string => (
  [
    cleanName,
    set.subject,
    set.grade ?? '',
    set.topic ?? '',
    set.subtopic ?? '',
    set.exam_date ?? '',
  ].join('|')
);

const canAttachSetToGroup = (group: GroupedQuestionSets, set: QuestionSet): boolean => {
  if (set.mode === 'flashcard') {
    return !group.sets.some((existing) => existing.mode === 'flashcard');
  }

  return !group.sets.some(
    (existing) => existing.mode === 'quiz' && existing.difficulty === set.difficulty
  );
};

const compareByCreatedAtAscending = (left: QuestionSet, right: QuestionSet): number => {
  const leftCreatedAt = new Date(left.created_at).getTime();
  const rightCreatedAt = new Date(right.created_at).getTime();

  if (Number.isFinite(leftCreatedAt) && Number.isFinite(rightCreatedAt) && leftCreatedAt !== rightCreatedAt) {
    return leftCreatedAt - rightCreatedAt;
  }

  return left.code.localeCompare(right.code);
};

export function buildGroupedQuestionSets(sets: QuestionSet[]): GroupedQuestionSets[] {
  const buckets = new Map<string, GroupedQuestionSets[]>();

  for (const set of [...sets].sort(compareByCreatedAtAscending)) {
    const cleanName = stripDifficultySuffix(set.name);
    const baseKey = getSeriesBaseKey(set, cleanName);
    const bucket = buckets.get(baseKey) ?? [];

    let targetGroup = bucket.find((group) => canAttachSetToGroup(group, set));

    if (!targetGroup) {
      targetGroup = {
        key: `${baseKey}|${bucket.length}`,
        name: cleanName,
        subject: set.subject,
        topic: set.topic,
        subtopic: set.subtopic,
        grade: set.grade,
        sets: [],
      };
      bucket.push(targetGroup);
      buckets.set(baseKey, bucket);
    }

    targetGroup.sets.push(set);
  }

  return [...buckets.values()].flat();
}
