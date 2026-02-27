import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { identifyTopics, getSimpleTopics } from '@/lib/ai/topicIdentifier';
import { getQuestionSetById } from '@/lib/supabase/queries';
import { createLogger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { extendQuestionCountSchema } from '@/lib/validation/schemas';
import { parseRequestedProvider, validateRequestedProvider } from '@/lib/api/modelSelection';

interface ExtendQuestionSetRequestLike {
  formData(): Promise<FormData>;
}

export interface ExtendQuestionSetDeps {
  requireAuthFn?: (request?: unknown) => Promise<{ id: string }>;
  getQuestionSetByIdFn?: typeof getQuestionSetById;
  identifyTopicsFn?: typeof identifyTopics;
  generateQuestionsFn?: typeof generateQuestions;
  getSupabaseAdminFn?: typeof getSupabaseAdmin;
  createLoggerFn?: typeof createLogger;
}

export async function handleExtendQuestionSetRequest(
  request: ExtendQuestionSetRequestLike,
  deps: ExtendQuestionSetDeps = {}
): Promise<Response> {
  const authModule = await import('@/lib/supabase/server-auth');
  const requireAuthFn: (request?: unknown) => Promise<{ id: string }> =
    deps.requireAuthFn ??
    ((authRequest?: unknown) => authModule.requireAuth(authRequest as any));
  const resolveAuthErrorFn = authModule.resolveAuthError;
  const getQuestionSetByIdFn = deps.getQuestionSetByIdFn ?? getQuestionSetById;
  const identifyTopicsFn = deps.identifyTopicsFn ?? identifyTopics;
  const generateQuestionsFn = deps.generateQuestionsFn ?? generateQuestions;
  const getSupabaseAdminFn = deps.getSupabaseAdminFn ?? getSupabaseAdmin;
  const createLoggerFn = deps.createLoggerFn ?? createLogger;

  const requestId = crypto.randomUUID();
  const logger = createLoggerFn({ requestId, route: '/api/extend-question-set' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    // Verify authentication
    let userId = '';
    try {
      const user = await requireAuthFn(request);
      userId = user.id;
      logger.info('Authentication successful');
    } catch (authError) {
      const { status, message } = resolveAuthErrorFn(authError, {
        unauthorized: 'Unauthorized. Please log in to extend question sets.',
      });
      logger.warn({ status, message }, 'Authentication failed');
      return Response.json(
        { error: message },
        { status }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const questionSetId = formData.get('questionSetId') as string;
    const questionsToAddResult = extendQuestionCountSchema.safeParse(
      formData.get('questionsToAdd')
    );
    const materialText = (formData.get('materialText') as string | null) || undefined;
    const targetProvider = parseRequestedProvider(formData.get('provider'));

    if (targetProvider) {
      const modelValidationError = validateRequestedProvider(targetProvider);
      if (modelValidationError) {
        return Response.json({ error: modelValidationError }, { status: 400 });
      }
    }

    if (!questionSetId) {
      return Response.json(
        { error: 'Question set ID is required' },
        { status: 400 }
      );
    }

    if (!questionsToAddResult.success) {
      return Response.json(
        { error: 'Invalid questionsToAdd. Must be an integer between 1 and 200.' },
        { status: 400 }
      );
    }

    const questionsToAdd = questionsToAddResult.data;

    // Get existing question set
    const existingSet = await getQuestionSetByIdFn(questionSetId);

    if (!existingSet) {
      return Response.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    logger.info(
      {
        questionSetId,
        questionSetName: existingSet.name,
        currentQuestionCount: existingSet.question_count,
        questionsToAdd,
        provider: targetProvider ?? 'anthropic',
      },
      'Extending existing question set'
    );

    // Process uploaded files with same validation as generate-questions
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    const MAX_FILES = 1;
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];

    const files: Array<{ type: string; name: string; data: string }> = [];
    const fileEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith('file_')
    );

    // Validate file count
    if (fileEntries.length > MAX_FILES) {
      return Response.json(
        {
          error: `Maximum ${MAX_FILES} file allowed.`,
        },
        { status: 400 }
      );
    }

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          return Response.json(
            { error: `File "${value.name}" exceeds 5MB limit.` },
            { status: 400 }
          );
        }

        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file type using magic bytes
        const detectedType = await fileTypeFromBuffer(buffer);
        const isTextFile = value.type.startsWith('text/') && !detectedType;

        if (!isTextFile && (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime))) {
          return Response.json(
            {
              error: `File "${value.name}" has invalid type.`,
            },
            { status: 400 }
          );
        }

        const base64 = buffer.toString('base64');
        files.push({
          type: detectedType?.mime || 'text/plain',
          name: value.name,
          data: base64,
        });
      }
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return Response.json(
        { error: 'Please provide material (text or files)' },
        { status: 400 }
      );
    }

    // STEP 1: Identify topics from material
    logger.info('Step 1: Identifying topics from new material');
    const topicAnalysis = await identifyTopicsFn({
      subject: existingSet.subject,
      grade: existingSet.grade || undefined,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      targetProvider,
    });

    logger.info(
      {
        identifiedTopics: getSimpleTopics(topicAnalysis),
        topicCount: getSimpleTopics(topicAnalysis).length,
      },
      'Topics identified successfully'
    );

    // STEP 2: Generate new questions
    logger.info('Step 2: Generating new questions');
    const newQuestions = await generateQuestionsFn({
      subject: existingSet.subject,
      difficulty: existingSet.difficulty,
      questionCount: questionsToAdd,
      grade: existingSet.grade || undefined,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      mode: existingSet.mode || 'quiz',
      identifiedTopics: getSimpleTopics(topicAnalysis),
      targetProvider,
      metricsContext: {
        userId,
        questionSetId,
      },
    });

    if (newQuestions.length === 0) {
      return Response.json(
        { error: 'No questions were generated. Please try again.' },
        { status: 500 }
      );
    }

    logger.info(
      { questionsGenerated: newQuestions.length },
      'Questions generated successfully'
    );

    // STEP 3: Find max order_index from existing questions
    const supabaseAdmin = getSupabaseAdminFn();
    const { data: maxOrderData, error: maxOrderError } = await supabaseAdmin
      .from('questions')
      .select('order_index')
      .eq('question_set_id', questionSetId)
      .order('order_index', { ascending: false })
      .limit(1);

    if (maxOrderError) {
      logger.error({ error: maxOrderError }, 'Failed to get max order_index');
      throw new Error('Failed to query existing questions');
    }

    const maxOrderIndex = maxOrderData && maxOrderData.length > 0
      ? (maxOrderData[0] as any).order_index
      : -1;

    logger.info({ maxOrderIndex }, 'Found max order_index');

    // STEP 4: Insert new questions with correct order_index
    const questionsToInsert = newQuestions.map((q, index) => ({
      question_set_id: questionSetId,
      question_text: q.question_text,
      question_type: q.question_type,
      topic: (q as any).topic || null,
      skill: (q as any).skill || null,
      subtopic: (q as any).subtopic || null,
      correct_answer: (q as any).correct_answer,
      options: (q as any).options || null,
      explanation: q.explanation,
      order_index: maxOrderIndex + 1 + index,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('questions')
      .insert(questionsToInsert as any);

    if (insertError) {
      logger.error({ error: insertError }, 'Failed to insert questions');
      throw new Error('Failed to insert questions');
    }

    logger.info(
      { questionsInserted: questionsToInsert.length },
      'Questions inserted successfully'
    );

    // STEP 5: Update question_count in question_sets
    const newQuestionCount = existingSet.question_count + newQuestions.length;

    const { error: updateError } = await (supabaseAdmin as any)
      .from('question_sets')
      .update({ question_count: newQuestionCount })
      .eq('id', questionSetId);

    if (updateError) {
      logger.error({ error: updateError }, 'Failed to update question count');
      throw new Error('Failed to update question count');
    }

    logger.info(
      {
        oldCount: existingSet.question_count,
        newCount: newQuestionCount,
        added: newQuestions.length,
      },
      'Question count updated successfully'
    );

    const response = {
      success: true,
      message: `Added ${newQuestions.length} questions to ${existingSet.name}`,
      questionSet: {
        id: existingSet.id,
        code: existingSet.code,
        name: existingSet.name,
        question_count: newQuestionCount,
      },
      questionsAdded: newQuestions.length,
    };

    logger.info(
      {
        questionSetId,
        questionsAdded: newQuestions.length,
        newTotal: newQuestionCount,
        provider: targetProvider ?? 'anthropic',
      },
      'Request completed successfully'
    );

    return Response.json(response);
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error server-side
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      },
      'Request failed'
    );

    // Return sanitized error to client
    return Response.json(
      {
        error: isProduction
          ? 'Failed to extend question set. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}
