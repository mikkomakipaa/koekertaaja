import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mapQuestionsToInsertRows } from '../../../src/lib/supabase/write-queries';

test('mapQuestionsToInsertRows canonicalizes topic and subtopic before insert', () => {
  const rows = mapQuestionsToInsertRows(
    [
      {
        question_text: 'Valitse oikea vaihtoehto.',
        question_type: 'multiple_choice',
        explanation: 'Selitys on riittävän pitkä testikäyttöön.',
        topic: 'Vocabulary / Thematic Content',
        subtopic: 'Object Pronouns',
        correct_answer: 'A',
        options: ['A', 'B'],
        order_index: 0,
      } as any,
    ],
    'set-123'
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].topic, 'Sanasto ja temaattinen sisältö');
  assert.equal(rows[0].subtopic, 'Objektipronominit');
  assert.equal(rows[0].question_set_id, 'set-123');
});
