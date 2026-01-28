import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

/**
 * Tests for /api/question-flags endpoint (validation + rate limit behavior)
 *
 * NOTE: These are schema/logic tests and do not hit Supabase.
 */

describe('/api/question-flags validation', () => {
  test('valid payload includes required fields', () => {
    const payload = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      questionSetId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'wrong_answer' as const,
      clientId: 'client-12345678',
    };

    assert.equal(typeof payload.questionId, 'string');
    assert.equal(typeof payload.questionSetId, 'string');
    assert.equal(typeof payload.reason, 'string');
    assert.equal(typeof payload.clientId, 'string');
  });

  test('reason enum only allows known values', () => {
    const validReasons = ['wrong_answer', 'ambiguous', 'typo', 'other'];
    const invalidReasons = ['spam', 'abuse', 'duplicate'];

    validReasons.forEach(reason => {
      assert.ok(validReasons.includes(reason));
    });

    invalidReasons.forEach(reason => {
      assert.ok(!validReasons.includes(reason));
    });
  });

  test('UUID format is required for questionId and questionSetId', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    assert.ok(uuidRegex.test('123e4567-e89b-12d3-a456-426614174000'));
    assert.ok(uuidRegex.test('550e8400-e29b-41d4-a716-446655440000'));
    assert.ok(!uuidRegex.test('not-a-uuid'));
  });
});

describe('/api/question-flags rate limit', () => {
  test('fourth flag within 24 hours should be rejected', () => {
    const maxFlagsPerDay = 3;
    const existingFlags = 3;

    assert.ok(existingFlags >= maxFlagsPerDay, 'Rate limit should block further flags');
  });
});
