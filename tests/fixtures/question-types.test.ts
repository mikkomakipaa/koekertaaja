import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../../src/lib/validation/schemas';
import { parseDatabaseQuestion } from '../../src/types/database';
import { aiQuestionFixtures, dbQuestionFixtures } from './question-types';

test('aiQuestion fixtures validate against aiQuestionSchema', () => {
  for (const [type, fixture] of Object.entries(aiQuestionFixtures)) {
    const result = aiQuestionSchema.safeParse(fixture);
    assert.equal(result.success, true, `Fixture for ${type} should pass aiQuestionSchema`);
  }
});

test('database fixtures parse into question types', () => {
  for (const [type, fixture] of Object.entries(dbQuestionFixtures)) {
    assert.doesNotThrow(() => {
      const parsed = parseDatabaseQuestion(fixture);
      assert.equal(parsed.question_type, type, `Parsed question type should be ${type}`);
    });
  }
});
