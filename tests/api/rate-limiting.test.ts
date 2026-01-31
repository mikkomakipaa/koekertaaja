import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRateLimitKey,
  checkRateLimit,
  createRateLimitHeaders,
  resetRateLimitStore,
} from '../../src/lib/ratelimit';

test('rate limiter enforces limits and returns remaining', () => {
  resetRateLimitStore();
  const key = buildRateLimitKey({ ip: '1.2.3.4', userId: 'user-1', prefix: 'test' });
  const config = { limit: 2, windowMs: 1000 };

  const first = checkRateLimit(key, config);
  assert.equal(first.success, true);
  assert.equal(first.remaining, 1);

  const second = checkRateLimit(key, config);
  assert.equal(second.success, true);
  assert.equal(second.remaining, 0);

  const third = checkRateLimit(key, config);
  assert.equal(third.success, false);
  assert.equal(third.remaining, 0);
});

test('rate limiter resets after window', async () => {
  resetRateLimitStore();
  const key = buildRateLimitKey({ ip: '5.6.7.8', clientId: 'client-1', prefix: 'test' });
  const config = { limit: 1, windowMs: 20 };

  const first = checkRateLimit(key, config);
  assert.equal(first.success, true);
  assert.equal(first.remaining, 0);

  await new Promise(resolve => setTimeout(resolve, 30));

  const second = checkRateLimit(key, config);
  assert.equal(second.success, true);
  assert.equal(second.remaining, 0);
});

test('buildRateLimitKey prefers userId over clientId', () => {
  const key = buildRateLimitKey({
    ip: '9.9.9.9',
    userId: 'user-2',
    clientId: 'client-2',
    prefix: 'endpoint',
  });

  assert.ok(key.includes('endpoint:9.9.9.9:user-2'));
});

test('createRateLimitHeaders includes retry-after when provided', () => {
  const headers = createRateLimitHeaders({
    success: false,
    limit: 5,
    remaining: 0,
    reset: Date.now() + 1000,
  }, 120);

  assert.equal(headers.get('X-RateLimit-Limit'), '5');
  assert.equal(headers.get('X-RateLimit-Remaining'), '0');
  assert.equal(headers.get('Retry-After'), '120');
});
