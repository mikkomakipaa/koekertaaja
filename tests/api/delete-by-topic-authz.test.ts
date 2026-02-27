import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDeleteByTopicHandler } from '../../src/lib/api/deleteByTopicHandler';

const questionSetId = '123e4567-e89b-12d3-a456-426614174000';

function createDeleteByTopicRequest(topic: string | null): Request {
  return new Request('http://localhost/api/questions/delete-by-topic', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ questionSetId, topic }),
  });
}

test('delete-by-topic returns 403 for authenticated non-owner', async () => {
  const handler = createDeleteByTopicHandler({
    requireAuthFn: async () =>
      ({ id: 'user-a', email: 'user-a@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'user-a', isAdmin: false }),
    deleteQuestionsByTopicFn: async (_questionSetId, _topic, actor) => {
      assert.equal(actor.userId, 'user-a');
      assert.equal(actor.isAdmin, false);
      return { success: false, reason: 'forbidden' };
    },
  });

  const response = await handler(createDeleteByTopicRequest('Kielioppi') as any);
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.match(body.error, /forbidden/i);
});

test('delete-by-topic allows owner mutation', async () => {
  const handler = createDeleteByTopicHandler({
    requireAuthFn: async () =>
      ({ id: 'owner-user', email: 'owner@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'owner-user', isAdmin: false }),
    deleteQuestionsByTopicFn: async (_questionSetId, topic, actor) => {
      assert.equal(topic, 'Sanaluokat');
      assert.equal(actor.userId, 'owner-user');
      assert.equal(actor.isAdmin, false);
      return { success: true, deletedCount: 4, newQuestionCount: 12 };
    },
  });

  const response = await handler(createDeleteByTopicRequest('Sanaluokat') as any);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.deletedCount, 4);
  assert.equal(body.newQuestionCount, 12);
});

test('delete-by-topic allows admin mutation', async () => {
  const handler = createDeleteByTopicHandler({
    requireAuthFn: async () =>
      ({ id: 'admin-user', email: 'admin@example.com' }) as any,
    toWriteActorContextFn: () => ({ userId: 'admin-user', isAdmin: true }),
    deleteQuestionsByTopicFn: async (_questionSetId, _topic, actor) => {
      assert.equal(actor.userId, 'admin-user');
      assert.equal(actor.isAdmin, true);
      return { success: true, deletedCount: 2, newQuestionCount: 20 };
    },
  });

  const response = await handler(createDeleteByTopicRequest(null) as any);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.deletedCount, 2);
  assert.equal(body.newQuestionCount, 20);
});
