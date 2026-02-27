import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeSubmissionTopics } from '../../src/lib/topics/submitNormalization';

test('submit normalization converts mixed-language topic and subtopic labels to canonical Finnish', () => {
  const warnings: Array<{ message: string; payload?: Record<string, unknown> }> = [];
  const logger = {
    warn(payload: Record<string, unknown>, message: string) {
      warnings.push({ payload, message });
    },
  } as any;

  const normalized = normalizeSubmissionTopics(
    [
      {
        question: 'Valitse oikea vaihtoehto.',
        type: 'multiple_choice',
        topic: 'Nouns and Articles',
        subtopic: 'Object Pronouns',
        options: ['A', 'B'],
        correct_answer: 'A',
        explanation: 'Selitys on riittävän pitkä tähän testiin.',
      },
      {
        question: 'Vastaa lyhyesti.',
        type: 'short_answer',
        topic: 'Preesensin kielioppi',
        subtopic: 'clothing vocabulary',
        correct_answer: 'Testivastaus',
        explanation: 'Toinen selitys on riittävän pitkä testille.',
      },
    ],
    logger
  );

  assert.equal(normalized[0].topic, 'Substantiivit ja artikkelit');
  assert.equal(normalized[0].subtopic, 'Objektipronominit');
  assert.equal(normalized[1].topic, 'Preesensin kielioppi');
  assert.equal(normalized[1].subtopic, 'Vaatesanasto');
  assert.equal(warnings.length, 0);
});
