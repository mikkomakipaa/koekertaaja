import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { validateCsrfInput } from '@/lib/security/csrf-core';

describe('csrf-core validation', () => {
  test('allows same-origin mutating request with matching token', () => {
    const accepted = validateCsrfInput({
      method: 'POST',
      requestOrigin: 'http://localhost:3000',
      originHeader: 'http://localhost:3000',
      refererHeader: null,
      cookieToken: 'token-1',
      headerToken: 'token-1',
    });

    assert.equal(accepted, true);
  });

  test('rejects mutating request with missing token', () => {
    const accepted = validateCsrfInput({
      method: 'POST',
      requestOrigin: 'http://localhost:3000',
      originHeader: 'http://localhost:3000',
      refererHeader: null,
      cookieToken: null,
      headerToken: null,
    });

    assert.equal(accepted, false);
  });

  test('rejects mutating request from different origin even with matching token', () => {
    const accepted = validateCsrfInput({
      method: 'DELETE',
      requestOrigin: 'http://localhost:3000',
      originHeader: 'https://evil.example',
      refererHeader: null,
      cookieToken: 'token-1',
      headerToken: 'token-1',
    });

    assert.equal(accepted, false);
  });

  test('accepts non-mutating request without token', () => {
    const accepted = validateCsrfInput({
      method: 'GET',
      requestOrigin: 'http://localhost:3000',
      originHeader: null,
      refererHeader: null,
      cookieToken: null,
      headerToken: null,
    });

    assert.equal(accepted, true);
  });
});
