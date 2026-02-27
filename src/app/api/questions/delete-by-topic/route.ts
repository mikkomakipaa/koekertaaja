/**
 * API Route: Delete Questions By Topic
 *
 * Deletes all questions with a specific topic from a question set.
 * Pass topic: null to delete questions with no topic.
 */

import { NextRequest } from 'next/server';
import { deleteQuestionsByTopic } from '@/lib/supabase/write-queries';
import {
  requireAuth,
  resolveAuthError,
  toWriteActorContext,
} from '@/lib/supabase/server-auth';
import { createDeleteByTopicHandler } from '@/lib/api/deleteByTopicHandler';

const handler = createDeleteByTopicHandler({
  requireAuthFn: (request) => requireAuth(request as any),
  resolveAuthErrorFn: resolveAuthError,
  toWriteActorContextFn: toWriteActorContext,
  deleteQuestionsByTopicFn: deleteQuestionsByTopic,
});

export async function DELETE(request: NextRequest) {
  return handler(request);
}
