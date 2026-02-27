import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  flagSchema,
  getFlagAbuseRejection,
  MAX_FLAGS_PER_DAY,
  MAX_FLAGS_PER_QUESTION_WINDOW,
  PER_QUESTION_WINDOW_MS,
} from '../src/lib/question-flags/abuse-controls';
import { buildServerRateLimitKey } from '../src/lib/ratelimit';

describe('/api/question-flags validation', () => {
  test('valid payload no longer requires clientId', () => {
    const payload = {
      questionId: '123e4567-e89b-12d3-a456-426614174000',
      questionSetId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'wrong_answer' as const,
    };

    const parsed = flagSchema.safeParse(payload);
    assert.equal(parsed.success, true);
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
});

describe('/api/question-flags abuse controls', () => {
  test('clientId rotation does not change server-derived identity key', () => {
    const headersA = new Headers({
      'x-forwarded-for': '203.0.113.15',
      'user-agent': 'Mozilla/5.0 test',
      'accept-language': 'fi-FI',
      'x-client-id': 'spoof-a',
    });
    const headersB = new Headers({
      'x-forwarded-for': '203.0.113.15',
      'user-agent': 'Mozilla/5.0 test',
      'accept-language': 'fi-FI',
      'x-client-id': 'spoof-b',
    });

    const keyA = buildServerRateLimitKey(headersA, { prefix: 'question-flags' });
    const keyB = buildServerRateLimitKey(headersB, { prefix: 'question-flags' });
    assert.equal(keyA, keyB);
  });

  test('daily abuse threshold is enforced', () => {
    const rejection = getFlagAbuseRejection({
      dailyCount: MAX_FLAGS_PER_DAY,
      questionWindowCount: 0,
    });

    assert.deepEqual(rejection, { error: 'Flagging limit reached. Try again later.' });
  });

  test('per-question spam window is enforced', () => {
    const rejection = getFlagAbuseRejection({
      dailyCount: 0,
      questionWindowCount: MAX_FLAGS_PER_QUESTION_WINDOW,
    });

    assert.deepEqual(rejection, {
      error: 'You already flagged this question recently. Try again later.',
    });
    assert.equal(PER_QUESTION_WINDOW_MS, 6 * 60 * 60 * 1000);
  });
});
