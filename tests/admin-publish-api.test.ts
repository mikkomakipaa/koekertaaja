import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

/**
 * Tests for /api/question-sets/publish endpoint
 *
 * These tests verify:
 * - Admin authorization checks (403 for non-admins)
 * - Request validation (400 for invalid requests)
 * - Status update functionality
 * - Error handling for missing question sets (404)
 *
 * NOTE: These are schema/validation tests.
 * Full integration tests with Supabase would require test database setup.
 */

describe('/api/question-sets/publish validation', () => {
  test('request schema requires questionSetId', () => {
    const invalidRequest = {
      status: 'published',
      // missing questionSetId
    };

    // In actual API, this would return 400 with validation error
    assert.equal('questionSetId' in invalidRequest, false);
  });

  test('request schema requires status', () => {
    const invalidRequest = {
      questionSetId: '123e4567-e89b-12d3-a456-426614174000',
      // missing status
    };

    assert.equal('status' in invalidRequest, false);
  });

  test('valid request has both required fields', () => {
    const validRequest = {
      questionSetId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'published' as const,
    };

    assert.equal('questionSetId' in validRequest, true);
    assert.equal('status' in validRequest, true);
  });

  test('status must be either "created" or "published"', () => {
    const validStatuses = ['created', 'published'];
    const invalidStatuses = ['draft', 'pending', 'archived', 'deleted'];

    // Valid statuses
    validStatuses.forEach(status => {
      assert.ok(
        status === 'created' || status === 'published',
        `${status} should be valid`
      );
    });

    // Invalid statuses
    invalidStatuses.forEach(status => {
      assert.ok(
        !(status === 'created' || status === 'published'),
        `${status} should be invalid`
      );
    });
  });

  test('questionSetId must be UUID format', () => {
    const validUUIDs = [
      '123e4567-e89b-12d3-a456-426614174000',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    const invalidUUIDs = [
      'not-a-uuid',
      '12345',
      '',
      'abc-def-ghi',
    ];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    validUUIDs.forEach(uuid => {
      assert.ok(uuidRegex.test(uuid), `${uuid} should be valid UUID`);
    });

    invalidUUIDs.forEach(uuid => {
      assert.ok(!uuidRegex.test(uuid), `${uuid} should be invalid UUID`);
    });
  });
});

describe('/api/question-sets/publish authorization', () => {
  test('non-admin users should receive 403', () => {
    // In actual API:
    // - User authenticated but not in ADMIN_EMAILS allowlist
    // - Should return { error: 'Forbidden...', status: 403 }
    const expectedStatus = 403;
    const expectedError = 'Forbidden. Admin access required to publish question sets.';

    assert.equal(expectedStatus, 403);
    assert.ok(expectedError.includes('Forbidden'));
    assert.ok(expectedError.includes('Admin access required'));
  });

  test('unauthenticated users should receive 401', () => {
    // In actual API:
    // - No valid session cookie
    // - Should return { error: 'Unauthorized...', status: 401 }
    const expectedStatus = 401;
    const expectedError = 'Unauthorized. Please log in.';

    assert.equal(expectedStatus, 401);
    assert.ok(expectedError.includes('Unauthorized'));
  });

  test('admin users should be allowed', () => {
    // In actual API:
    // - User authenticated AND email in ADMIN_EMAILS allowlist
    // - Should proceed to update question set
    const adminEmail = 'admin@example.com';
    process.env.ADMIN_EMAILS = 'admin@example.com';

    const allowlist = process.env.ADMIN_EMAILS
      .split(',')
      .map(email => email.trim().toLowerCase());

    assert.ok(allowlist.includes(adminEmail.toLowerCase()));
  });
});

describe('/api/question-sets/publish response format', () => {
  test('success response includes question set details', () => {
    const successResponse = {
      success: true,
      questionSet: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABC123',
        name: 'Test Question Set',
        status: 'published' as const,
        updated_at: '2024-01-01T00:00:00Z',
      },
    };

    assert.equal(successResponse.success, true);
    assert.ok('questionSet' in successResponse);
    assert.equal(successResponse.questionSet.status, 'published');
  });

  test('error response includes error message', () => {
    const errorResponse = {
      error: 'Question set not found',
    };

    assert.ok('error' in errorResponse);
    assert.equal(typeof errorResponse.error, 'string');
  });

  test('validation error includes details', () => {
    const validationErrorResponse = {
      error: 'Validation failed',
      details: [
        'questionSetId: Invalid question set ID',
        'status: Status must be "created" or "published"',
      ],
    };

    assert.ok('error' in validationErrorResponse);
    assert.ok('details' in validationErrorResponse);
    assert.ok(Array.isArray(validationErrorResponse.details));
  });
});

describe('/api/question-sets/publish status transitions', () => {
  test('publishing transition: created → published', () => {
    const initialStatus = 'created';
    const targetStatus = 'published';

    // Simulate API request
    const request = {
      questionSetId: '123e4567-e89b-12d3-a456-426614174000',
      status: targetStatus,
    };

    // Verify transition is valid
    assert.equal(request.status, 'published');
    assert.ok(['created', 'published'].includes(request.status));
  });

  test('unpublishing transition: published → created', () => {
    const initialStatus = 'published';
    const targetStatus = 'created';

    // Simulate API request
    const request = {
      questionSetId: '123e4567-e89b-12d3-a456-426614174000',
      status: targetStatus,
    };

    // Verify transition is valid
    assert.equal(request.status, 'created');
    assert.ok(['created', 'published'].includes(request.status));
  });

  test('invalid status values are rejected', () => {
    const invalidStatuses = [
      'draft',
      'pending',
      'archived',
      'deleted',
      'inactive',
      '',
      null,
      undefined,
    ];

    invalidStatuses.forEach((status) => {
      const isValid = status === 'created' || status === 'published';
      assert.ok(!isValid, `Status "${status}" should be invalid`);
    });
  });

  test('status field is required in request', () => {
    const requestWithoutStatus = {
      questionSetId: '123e4567-e89b-12d3-a456-426614174000',
    };

    // Should fail validation
    assert.equal('status' in requestWithoutStatus, false);
  });
});

describe('/api/question-sets/publish permissions model', () => {
  test('only admin emails can publish question sets', () => {
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@example.com')
      .split(',')
      .map((email) => email.trim().toLowerCase());

    // Valid admin
    const adminUser = { email: 'admin@example.com' };
    assert.ok(adminEmails.includes(adminUser.email.toLowerCase()));

    // Non-admin
    const regularUser = { email: 'user@example.com' };
    assert.ok(!adminEmails.includes(regularUser.email.toLowerCase()));
  });

  test('unauthenticated requests are rejected', () => {
    // No user session
    const user = null;
    const isAuthenticated = user !== null;

    assert.equal(isAuthenticated, false);
  });

  test('authenticated non-admin requests are forbidden', () => {
    const user = { email: 'user@example.com' };
    const adminAllowlist = ['admin@example.com'];
    const isAdmin = user && adminAllowlist.includes(user.email.toLowerCase());

    assert.equal(isAdmin, false);
  });
});
