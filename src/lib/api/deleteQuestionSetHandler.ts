import { createLogger } from '@/lib/logger';
import type { WriteActorContext } from '@/types';
import crypto from 'crypto';

type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthErrorResolver = (
  error: unknown,
  messages?: { unauthorized?: string; forbidden?: string }
) => { status: number; message: string };

type DeleteQuestionSetResult = {
  success: boolean;
  reason?: 'forbidden' | 'not_found' | 'error';
};

export type DeleteQuestionSetHandlerDeps = {
  requireAuthFn: (request?: Request) => Promise<AuthUser>;
  resolveAuthErrorFn: AuthErrorResolver;
  toWriteActorContextFn: (user: AuthUser) => WriteActorContext;
  deleteQuestionSetFn: (
    questionSetId: string,
    actor: WriteActorContext
  ) => Promise<DeleteQuestionSetResult>;
};

export function createDeleteQuestionSetHandler(
  deps: Partial<DeleteQuestionSetHandlerDeps>
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
  const deleteQuestionSetFn = deps.deleteQuestionSetFn ?? (async () => ({
    success: false,
    reason: 'error' as const,
  }));

  return async function handleDeleteQuestionSet(request: Request): Promise<Response> {
    const requestId = crypto.randomUUID();
    const logger = createLogger({ requestId, route: '/api/delete-question-set' });

    try {
      let user;
      try {
        user = await requireAuthFn(request);
        logger.info({ userId: user.id }, 'User authenticated');
      } catch (authError) {
        const { status, message } = resolveAuthErrorFn(authError, {
          unauthorized: 'Unauthorized. Please log in to delete question sets.',
        });
        logger.warn({ status, error: message }, 'Authentication failed');
        return Response.json({ error: message }, { status });
      }

      const body = await request.json();
      const questionSetId = (body as { questionSetId?: unknown }).questionSetId;

      if (!questionSetId || typeof questionSetId !== 'string') {
        logger.warn('Missing question set ID in request');
        return Response.json(
          { error: 'Question set ID is required' },
          { status: 400 }
        );
      }

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        logger.error('SUPABASE_SERVICE_ROLE_KEY is not set');
        return Response.json(
          { error: 'Server configuration error: Missing service role key' },
          { status: 500 }
        );
      }

      const actor = toWriteActorContextFn(user);
      logger.info({ questionSetId, actor }, 'Attempting to delete question set');

      const result = await deleteQuestionSetFn(questionSetId, actor);

      if (!result.success) {
        if (result.reason === 'forbidden') {
          return Response.json(
            { error: 'Forbidden. You can only delete your own question sets.' },
            { status: 403 }
          );
        }

        if (result.reason === 'not_found') {
          return Response.json(
            { error: 'Question set not found.' },
            { status: 404 }
          );
        }

        logger.error({ questionSetId }, 'Failed to delete question set');
        return Response.json(
          { error: 'Failed to delete question set. Check server logs for details.' },
          { status: 500 }
        );
      }

      logger.info({ questionSetId }, 'Successfully deleted question set');
      return Response.json({ success: true });
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined },
        'Error in delete-question-set API'
      );
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return Response.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
}
