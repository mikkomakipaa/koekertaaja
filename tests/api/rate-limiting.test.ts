import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRateLimitKey,
  buildServerRateLimitKey,
  checkRateLimit,
  createRateLimitHeaders,
  resetRateLimitStore,
  setRateLimitBackendForTests,
  type RateLimitBackend,
} from '../../src/lib/ratelimit';

test('rate limiter enforces limits and returns remaining', async () => {
  resetRateLimitStore();
  const key = buildRateLimitKey({ ip: '1.2.3.4', userId: 'user-1', prefix: 'test' });
  const config = { limit: 2, windowMs: 1000 };

  const first = await checkRateLimit(key, config);
  assert.equal(first.success, true);
  assert.equal(first.remaining, 1);

  const second = await checkRateLimit(key, config);
  assert.equal(second.success, true);
  assert.equal(second.remaining, 0);

  const third = await checkRateLimit(key, config);
  assert.equal(third.success, false);
  assert.equal(third.remaining, 0);
});

test('rate limiter resets after window', async () => {
  resetRateLimitStore();
  const key = buildRateLimitKey({ ip: '5.6.7.8', clientId: 'client-1', prefix: 'test' });
  const config = { limit: 1, windowMs: 20 };

  const first = await checkRateLimit(key, config);
  assert.equal(first.success, true);
  assert.equal(first.remaining, 0);

  await new Promise(resolve => setTimeout(resolve, 30));

  const second = await checkRateLimit(key, config);
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

test('server-derived key ignores spoofed x-client-id rotation', () => {
  const headersA = new Headers({
    'x-forwarded-for': '10.20.30.40',
    'user-agent': 'Mozilla/5.0',
    'accept-language': 'fi-FI',
    'x-client-id': 'spoof-1',
  });
  const headersB = new Headers({
    'x-forwarded-for': '10.20.30.40',
    'user-agent': 'Mozilla/5.0',
    'accept-language': 'fi-FI',
    'x-client-id': 'spoof-2',
  });

  const keyA = buildServerRateLimitKey(headersA, { prefix: 'question-flags' });
  const keyB = buildServerRateLimitKey(headersB, { prefix: 'question-flags' });

  assert.equal(keyA, keyB);
});

test('checkRateLimit supports pluggable backend injection', async () => {
  let called = false;

  const backend: RateLimitBackend = {
    kind: 'memory',
    async check(identifier, config) {
      called = true;
      assert.equal(identifier, 'test-key');
      assert.equal(config.limit, 7);
      assert.equal(config.windowMs, 2000);
      return {
        success: true,
        limit: 7,
        remaining: 6,
        reset: Date.now() + 2000,
      };
    },
  };

  setRateLimitBackendForTests(backend);

  const result = await checkRateLimit('test-key', { limit: 7, windowMs: 2000 });
  assert.equal(called, true);
  assert.equal(result.success, true);
  assert.equal(result.limit, 7);
  assert.equal(result.remaining, 6);

  setRateLimitBackendForTests(undefined);
});
