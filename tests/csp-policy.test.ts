import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { buildContentSecurityPolicy } from '../src/lib/security/csp';

const require = createRequire(import.meta.url);
const nextConfig = require('../next.config.js');

test('CSP policy omits unsafe script directives and keeps required integrations', () => {
  const policy = buildContentSecurityPolicy('nonce-value');
  const scriptDirective = policy
    .split(';')
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith('script-src'));

  assert.ok(scriptDirective, 'Expected script-src directive to be present');
  assert.match(scriptDirective, /script-src 'self' 'nonce-nonce-value'/);
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective, /'unsafe-eval'/);

  assert.match(policy, /https:\/\/va\.vercel-scripts\.com/);
  assert.match(policy, /https:\/\/vitals\.vercel-insights\.com/);
  assert.match(policy, /https:\/\/\*\.supabase\.co/);
});

test('next config security headers do not define a static CSP', async () => {
  const headers = await nextConfig.headers();
  const appHeaders = headers.find((entry: { source: string }) => entry.source === '/:path*');

  assert.ok(appHeaders, 'Expected global app headers to exist');
  assert.equal(
    appHeaders.headers.some((header: { key: string }) => header.key === 'Content-Security-Policy'),
    false
  );
});
