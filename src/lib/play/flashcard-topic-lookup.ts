import type { Flashcard } from '@/types';
import type { StudyMode } from '@/types';
import { normalizeTopicLabel } from '@/lib/topics/normalization';

export type TopicQuestion = {
  id: string;
  topic?: string | null;
};

export const ALL_TOPICS = 'ALL';
export const QUIZ_TOPIC_SELECTOR_QUERY_PARAM = 'selectTopic';

function toNormalizedTopic(topic: string | null | undefined, context: string): string | null {
  if (!topic || topic.trim().length === 0) {
    return null;
  }

  const normalizedTopic = normalizeTopicLabel(topic, { context });
  return normalizedTopic.trim().length > 0 ? normalizedTopic : null;
}

export function buildQuestionTopicLookup(questions: TopicQuestion[]): Map<string, string> {
  const questionTopicLookup = new Map<string, string>();

  questions.forEach((question, index) => {
    const normalizedTopic = toNormalizedTopic(question.topic, `play.buildQuestionTopicLookup[${index}]`);
    if (!normalizedTopic) {
      return;
    }

    questionTopicLookup.set(question.id, normalizedTopic);
  });

  return questionTopicLookup;
}

export function buildAvailableTopics(questions: TopicQuestion[]): string[] {
  return [...new Set(buildQuestionTopicLookup(questions).values())];
}

export function buildTopicCounts(questions: TopicQuestion[]): Map<string, number> {
  const topicCounts = new Map<string, number>();

  questions.forEach((question, index) => {
    const normalizedTopic = toNormalizedTopic(question.topic, `play.buildTopicCounts[${index}]`);
    if (!normalizedTopic) {
      return;
    }

    topicCounts.set(normalizedTopic, (topicCounts.get(normalizedTopic) ?? 0) + 1);
  });

  return topicCounts;
}

export function buildTopicCountsFromDistribution(
  topicDistribution?: Record<string, number> | null
): Map<string, number> {
  const topicCounts = new Map<string, number>();

  if (!topicDistribution) {
    return topicCounts;
  }

  for (const [topic, rawCount] of Object.entries(topicDistribution)) {
    const normalizedTopic = toNormalizedTopic(topic, 'play.buildTopicCountsFromDistribution');
    if (!normalizedTopic) {
      continue;
    }

    const count = Number.isFinite(rawCount) ? rawCount : Number(rawCount);
    if (!Number.isFinite(count) || count <= 0) {
      continue;
    }

    topicCounts.set(normalizedTopic, (topicCounts.get(normalizedTopic) ?? 0) + count);
  }

  return topicCounts;
}

export function hasMultipleTopicOptions(
  topicSource: TopicQuestion[] | Record<string, number> | Map<string, number> | null | undefined
): boolean {
  if (!topicSource) {
    return false;
  }

  if (topicSource instanceof Map) {
    return topicSource.size > 1;
  }

  if (Array.isArray(topicSource)) {
    return buildTopicCounts(topicSource).size > 1;
  }

  return buildTopicCountsFromDistribution(topicSource).size > 1;
}

export function resolveRequestedTopic(
  topics: string[],
  requestedTopic: string | null | undefined
): string | null {
  const normalizedRequestedTopic = toNormalizedTopic(
    requestedTopic,
    'play.resolveRequestedTopic'
  );

  if (!normalizedRequestedTopic) {
    return null;
  }

  return topics.find((topic) => topic === normalizedRequestedTopic) ?? null;
}

export function filterQuestionsByTopic<T extends TopicQuestion>(
  questions: T[],
  selectedTopic: string | null
): T[] {
  if (!selectedTopic || selectedTopic === ALL_TOPICS) {
    return questions;
  }

  return questions.filter((question, index) => {
    const normalizedTopic = toNormalizedTopic(question.topic, `play.filterQuestionsByTopic[${index}]`);
    return normalizedTopic === selectedTopic;
  });
}

export function buildFlashcardTopicCounts(
  flashcards: Flashcard[],
  questionTopicLookup: ReadonlyMap<string, string>
): Map<string, number> {
  const topicCounts = new Map<string, number>();

  for (const flashcard of flashcards) {
    const topic = questionTopicLookup.get(flashcard.questionId);
    if (!topic) {
      continue;
    }
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }

  return topicCounts;
}

export function filterFlashcardsByTopic(
  flashcards: Flashcard[],
  selectedTopic: string | null,
  questionTopicLookup: ReadonlyMap<string, string>
): Flashcard[] {
  if (!selectedTopic || selectedTopic === ALL_TOPICS) {
    return flashcards;
  }

  return flashcards.filter((flashcard) => questionTopicLookup.get(flashcard.questionId) === selectedTopic);
}

export function buildStudyTopicHref(
  setCode: string,
  studyMode: StudyMode,
  topic: string | null
): string {
  const searchParams = new URLSearchParams();
  searchParams.set('mode', studyMode);

  if (topic && topic !== ALL_TOPICS) {
    searchParams.set('topic', topic);
  }

  return `/play/${setCode}?${searchParams.toString()}`;
}

export function buildQuizTopicSelectorHref(setCode: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set('mode', 'pelaa');
  searchParams.set(QUIZ_TOPIC_SELECTOR_QUERY_PARAM, '1');

  return `/play/${setCode}?${searchParams.toString()}`;
}

export function shouldShowQuizTopicSelector({
  availableTopicCount,
  isAikahaaste,
  isReviewMode,
  selectorRequested,
  studyMode,
}: {
  availableTopicCount: number;
  isAikahaaste: boolean;
  isReviewMode: boolean;
  selectorRequested: boolean;
  studyMode: StudyMode;
}): boolean {
  return (
    selectorRequested &&
    studyMode === 'pelaa' &&
    !isReviewMode &&
    !isAikahaaste &&
    availableTopicCount > 1
  );
}
