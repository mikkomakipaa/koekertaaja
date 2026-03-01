import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shouldRetryQuestionSetInsertWithoutPromptMetadata } from '../../../src/lib/supabase/write-queries';

test('retries question set insert when prompt_metadata column is missing from schema cache', () => {
  assert.equal(
    shouldRetryQuestionSetInsertWithoutPromptMetadata({
      code: 'PGRST204',
      message: "Could not find the 'prompt_metadata' column of 'question_sets' in the schema cache",
      details: null,
    }),
    true
  );
});

test('does not retry question set insert for unrelated insert failures', () => {
  assert.equal(
    shouldRetryQuestionSetInsertWithoutPromptMetadata({
      code: '23505',
      message: 'duplicate key value violates unique constraint "question_sets_code_key"',
      details: 'Key (code)=(ABC123) already exists.',
    }),
    false
  );
});
