import assert from 'node:assert/strict';
import { test } from 'node:test';

const baseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  ANTHROPIC_API_KEY: 'anthropic-key',
};

test('validateEnv succeeds with required server vars', async () => {
  const { validateEnv } = await import('../../src/lib/env');
  const env = validateEnv(baseEnv, true);
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, baseEnv.NEXT_PUBLIC_SUPABASE_URL);
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, baseEnv.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(env.ANTHROPIC_API_KEY, baseEnv.ANTHROPIC_API_KEY);
});

test('validateEnv rejects invalid URL', async () => {
  const { validateEnv } = await import('../../src/lib/env');
  assert.throws(
    () => validateEnv({ ...baseEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' }, true),
    /NEXT_PUBLIC_SUPABASE_URL must be a valid URL/
  );
});

test('validateEnv rejects missing required vars', async () => {
  const { validateEnv } = await import('../../src/lib/env');
  const { ANTHROPIC_API_KEY, ...missing } = baseEnv;
  assert.throws(
    () => validateEnv(missing, true),
    /ANTHROPIC_API_KEY is required/
  );
});

test('validateEnv client schema ignores server-only vars', async () => {
  const { validateEnv } = await import('../../src/lib/env');
  const env = validateEnv({
    NEXT_PUBLIC_SUPABASE_URL: baseEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: baseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }, false);

  assert.equal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, baseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
});
