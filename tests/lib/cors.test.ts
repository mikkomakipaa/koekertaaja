import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCorsHeaders,
  getAllowedCorsOrigins,
  isAllowedCorsOrigin,
  isSameOriginRequest,
} from '../../src/lib/security/cors';

test('builds explicit CORS allowlist from environment values', () => {
  const origins = getAllowedCorsOrigins({
    CORS_ALLOWED_ORIGINS:
      ' https://allowed.example.com , not-a-url, https://preview.example.com/path ',
    NEXT_PUBLIC_APP_URL: 'https://app.example.com/',
  } as unknown as NodeJS.ProcessEnv);

  assert.deepEqual(origins, [
    'https://koekertaaja.vercel.app',
    'http://localhost:3000',
    'https://app.example.com',
    'https://allowed.example.com',
    'https://preview.example.com',
  ]);
});

test('accepts allowlisted origin and rejects unknown origin', () => {
  const allowedOrigins = getAllowedCorsOrigins({
    CORS_ALLOWED_ORIGINS: 'https://allowed.example.com',
  } as unknown as NodeJS.ProcessEnv);

  assert.equal(
    isAllowedCorsOrigin('https://allowed.example.com', allowedOrigins),
    true
  );
  assert.equal(
    isAllowedCorsOrigin('https://evil.example.com', allowedOrigins),
    false
  );
  assert.equal(isAllowedCorsOrigin(null, allowedOrigins), false);
});

test('builds consistent CORS response headers for credentialed requests', () => {
  const headers = buildCorsHeaders('https://allowed.example.com');

  assert.equal(
    headers['Access-Control-Allow-Origin'],
    'https://allowed.example.com'
  );
  assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  assert.equal(
    headers['Access-Control-Allow-Methods'],
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  assert.equal(
    headers['Access-Control-Allow-Headers'],
    'Content-Type, Authorization, X-CSRF-Token'
  );
  assert.equal(headers['Access-Control-Max-Age'], '86400');
  assert.equal(headers.Vary, 'Origin');
});

test('treats same-origin API requests as trusted even when not explicitly allowlisted', () => {
  assert.equal(
    isSameOriginRequest('https://app.custom-domain.fi', 'https://app.custom-domain.fi'),
    true
  );
  assert.equal(
    isSameOriginRequest('https://app.custom-domain.fi:443', 'https://app.custom-domain.fi'),
    true
  );
  assert.equal(
    isSameOriginRequest('https://other-domain.fi', 'https://app.custom-domain.fi'),
    false
  );
});
