import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { normalizeSubmissionTopics } from '../../src/lib/topics/submitNormalization';
import { mapQuestionsToInsertRows } from '../../src/lib/supabase/write-queries';
import { updateTopicMasteryInStorage } from '../../src/hooks/useTopicMastery';
import { TopicMasteryDisplay } from '../../src/components/play/TopicMasteryDisplay';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

test('mixed-language input persists canonical Finnish topics and mastery UI shows canonical labels', () => {
  (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;

  const logger = { warn: () => undefined };
  const normalizedSubmission = normalizeSubmissionTopics(
    [
      {
        question: 'Valitse oikea vaihtoehto.',
        type: 'multiple_choice',
        topic: 'Nouns and Articles',
        subtopic: 'Object Pronouns',
        options: ['A', 'B'],
        correct_answer: 'A',
        explanation: 'Selitys on riittavan pitka testiin.',
      },
      {
        question: 'Vastaa lyhyesti.',
        type: 'short_answer',
        topic: 'Substantiivit ja artikkelit',
        subtopic: 'Objektipronominit',
        correct_answer: 'A',
        explanation: 'Toinen selitys on riittavan pitka testiin.',
      },
    ],
    logger
  );

  const rows = mapQuestionsToInsertRows(
    normalizedSubmission.map((question, index) => ({
      question_text: question.question,
      question_type: question.type,
      explanation: question.explanation,
      topic: question.topic,
      subtopic: question.subtopic,
      correct_answer: question.correct_answer,
      options: question.options,
      order_index: index,
    })) as any,
    'set-integration'
  );

  assert.deepEqual(new Set(rows.map((row) => row.topic)), new Set(['Substantiivit ja artikkelit']));
  assert.deepEqual(new Set(rows.map((row) => row.subtopic)), new Set(['Objektipronominit']));

  updateTopicMasteryInStorage('FLOW123', rows[0].topic, true);
  updateTopicMasteryInStorage('FLOW123', 'Nouns and Articles', false);

  const html = renderToString(
    createElement(TopicMasteryDisplay, {
      questionSetCode: 'FLOW123',
    })
  );

  assert.ok(html.includes('Substantiivit ja artikkelit'));
  assert.ok(!html.includes('Nouns and Articles'));
  assert.match(html, /1(?:<!-- -->)?\/(?:<!-- -->)?2(?:<!-- -->)? oikein/);
});
