import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDeleteQuestionSetHandler } from '../../src/lib/api/deleteQuestionSetHandler';

function createDeleteRequest(questionSetId: string): Request {
  return new Request('http://localhost/api/delete-question-set', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ questionSetId }),
  });
}

test('delete-question-set returns 403 for authenticated non-owner', async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  const handler = createDeleteQuestionSetHandler({
    requireAuthFn: async () =>
      ({ id: 'user-a', email: 'user-a@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'user-a', isAdmin: false }),
    deleteQuestionSetFn: async (_questionSetId, actor) => {
      assert.equal(actor.userId, 'user-a');
      assert.equal(actor.isAdmin, false);
      return { success: false, reason: 'forbidden' };
    },
  });

  const response = await handler(createDeleteRequest('set-1') as any);
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.match(body.error, /forbidden/i);
});

test('delete-question-set allows owner mutation', async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  const handler = createDeleteQuestionSetHandler({
    requireAuthFn: async () =>
      ({ id: 'owner-user', email: 'owner@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'owner-user', isAdmin: false }),
    deleteQuestionSetFn: async (_questionSetId, actor) => {
      assert.equal(actor.userId, 'owner-user');
      assert.equal(actor.isAdmin, false);
      return { success: true };
    },
  });

  const response = await handler(createDeleteRequest('set-owner') as any);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test('delete-question-set allows admin mutation', async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  const handler = createDeleteQuestionSetHandler({
    requireAuthFn: async () =>
      ({ id: 'admin-user', email: 'admin@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'admin-user', isAdmin: true }),
    deleteQuestionSetFn: async (_questionSetId, actor) => {
      assert.equal(actor.userId, 'admin-user');
      assert.equal(actor.isAdmin, true);
      return { success: true };
    },
  });

  const response = await handler(createDeleteRequest('set-admin') as any);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});
