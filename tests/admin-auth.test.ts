import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { isAdmin } from '../src/lib/auth/admin';

/**
 * Tests for admin authentication helpers
 *
 * These tests verify:
 * - Admin email allowlist functionality
 * - Case-insensitive email matching
 * - Comma-separated list parsing
 * - Empty/undefined allowlist handling
 */

describe('isAdmin', () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  test('returns true for admin email in allowlist', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';

    assert.equal(isAdmin('admin@example.com'), true);
    assert.equal(isAdmin('super@example.com'), true);
  });

  test('returns false for non-admin email', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';

    assert.equal(isAdmin('user@example.com'), false);
    assert.equal(isAdmin('hacker@example.com'), false);
  });

  test('is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Example.com';

    assert.equal(isAdmin('admin@example.com'), true);
    assert.equal(isAdmin('ADMIN@EXAMPLE.COM'), true);
    assert.equal(isAdmin('Admin@Example.com'), true);
  });

  test('handles whitespace in allowlist', () => {
    process.env.ADMIN_EMAILS = ' admin@example.com , super@example.com ';

    assert.equal(isAdmin('admin@example.com'), true);
    assert.equal(isAdmin('super@example.com'), true);
  });

  test('returns false when ADMIN_EMAILS is undefined', () => {
    delete process.env.ADMIN_EMAILS;

    assert.equal(isAdmin('admin@example.com'), false);
  });

  test('returns false when ADMIN_EMAILS is empty', () => {
    process.env.ADMIN_EMAILS = '';

    assert.equal(isAdmin('admin@example.com'), false);
  });

  test('handles single admin email', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';

    assert.equal(isAdmin('admin@example.com'), true);
    assert.equal(isAdmin('user@example.com'), false);
  });

  test('ignores empty entries in comma-separated list', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,,super@example.com';

    assert.equal(isAdmin('admin@example.com'), true);
    assert.equal(isAdmin('super@example.com'), true);
    assert.equal(isAdmin(''), false);
  });

  // Restore original environment variable after all tests
  test.afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });
});
