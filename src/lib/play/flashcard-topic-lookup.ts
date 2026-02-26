import type { Flashcard } from '@/types';

type TopicQuestion = {
  id: string;
  topic?: string | null;
};

export function buildQuestionTopicLookup(questions: TopicQuestion[]): Map<string, string> {
  const questionTopicLookup = new Map<string, string>();

  for (const question of questions) {
    if (!question.topic || question.topic.trim().length === 0) {
      continue;
    }
    questionTopicLookup.set(question.id, question.topic);
  }

  return questionTopicLookup;
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
  if (!selectedTopic || selectedTopic === 'ALL') {
    return flashcards;
  }

  return flashcards.filter((flashcard) => questionTopicLookup.get(flashcard.questionId) === selectedTopic);
}
