/**
 * API Route: Delete Question Set
 *
 * Deletes a question set and all its questions (CASCADE)
 * Server-side only to use admin client
 */

import { NextRequest } from 'next/server';
import { deleteQuestionSet } from '@/lib/supabase/write-queries';
import {
  requireAuth,
  resolveAuthError,
  toWriteActorContext,
} from '@/lib/supabase/server-auth';
import { createDeleteQuestionSetHandler } from '@/lib/api/deleteQuestionSetHandler';

const handler = createDeleteQuestionSetHandler({
  requireAuthFn: (request) => requireAuth(request as any),
  resolveAuthErrorFn: resolveAuthError,
  toWriteActorContextFn: toWriteActorContext,
  deleteQuestionSetFn: deleteQuestionSet,
});

export async function DELETE(request: NextRequest) {
  return handler(request);
}
