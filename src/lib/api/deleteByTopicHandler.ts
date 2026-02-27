import { createLogger } from '@/lib/logger';
import type { WriteActorContext } from '@/types';
import crypto from 'crypto';
import { z } from 'zod';

type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthErrorResolver = (
  error: unknown,
  messages?: { unauthorized?: string; forbidden?: string }
) => { status: number; message: string };

type DeleteByTopicResult = {
  success: boolean;
  reason?: 'forbidden' | 'not_found' | 'error';
  deletedCount?: number;
  newQuestionCount?: number;
};

const requestSchema = z.object({
  questionSetId: z.string().uuid(),
  topic: z.string().nullable(),
});

export type DeleteByTopicHandlerDeps = {
  requireAuthFn: (request?: Request) => Promise<AuthUser>;
  resolveAuthErrorFn: AuthErrorResolver;
  toWriteActorContextFn: (user: AuthUser) => WriteActorContext;
  deleteQuestionsByTopicFn: (
    questionSetId: string,
    topic: string | null,
    actor: WriteActorContext
  ) => Promise<DeleteByTopicResult>;
};

export function createDeleteByTopicHandler(
  deps: Partial<DeleteByTopicHandlerDeps>
) {
  const requireAuthFn = deps.requireAuthFn ?? (async () => {
    throw new Error('Auth dependency not configured');
  });
  const resolveAuthErrorFn = deps.resolveAuthErrorFn ?? (() => ({
    status: 401,
    message: 'Unauthorized',
  }));
  const toWriteActorContextFn = deps.toWriteActorContextFn ?? ((user) => ({
    userId: user.id,
    isAdmin: false,
  }));
  const deleteQuestionsByTopicFn = deps.deleteQuestionsByTopicFn ?? (async () => ({
    success: false,
    reason: 'error' as const,
  }));

  return async function handleDeleteByTopic(request: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const logger = createLogger({ requestId, route: '/api/questions/delete-by-topic' });

    try {
      let user;
      try {
        user = await requireAuthFn(request);
        logger.info({ userId: user.id }, 'User authenticated');
      } catch (authError) {
        const { status, message } = resolveAuthErrorFn(authError, {
          unauthorized: 'Unauthorized. Please log in.',
        });
        logger.warn({ status, error: message }, 'Authentication failed');
        return Response.json(
          { error: message },
          { status }
        );
      }

      const body = await request.json();
      const parsed = requestSchema.safeParse(body);

      if (!parsed.success) {
        logger.warn({ issues: parsed.error.issues }, 'Invalid request body');
        return Response.json(
          { error: 'Invalid request: questionSetId (UUID) and topic (string | null) are required' },
          { status: 400 }
        );
      }

      const { questionSetId, topic } = parsed.data;
      const actor = toWriteActorContextFn(user);
      logger.info({ questionSetId, topic, actor }, 'Deleting questions by topic');

      const result = await deleteQuestionsByTopicFn(questionSetId, topic, actor);

      if (!result.success) {
        if (result.reason === 'forbidden') {
          return Response.json(
            { error: 'Forbidden. You can only edit your own question sets.' },
            { status: 403 }
          );
        }

        if (result.reason === 'not_found') {
          return Response.json(
            { error: 'Question set not found.' },
            { status: 404 }
          );
        }

        logger.error({ questionSetId, topic }, 'Failed to delete questions by topic');
        return Response.json(
          { error: 'Failed to delete questions. Check server logs for details.' },
          { status: 500 }
        );
      }

      const responsePayload = {
        success: true,
        deletedCount: result.deletedCount ?? 0,
        newQuestionCount: result.newQuestionCount ?? 0,
      };
      logger.info({ questionSetId, topic, ...responsePayload }, 'Successfully deleted questions by topic');
      return Response.json(responsePayload);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined },
        'Error in delete-by-topic API'
      );
      return Response.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
