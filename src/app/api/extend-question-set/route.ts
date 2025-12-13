import { NextRequest, NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { identifyTopics } from '@/lib/ai/topicIdentifier';
import { getQuestionSetById } from '@/lib/supabase/queries';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Configure route segment for Vercel deployment
export const maxDuration = 300; // 5 minutes timeout for AI generation

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/extend-question-set' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    // Verify authentication
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to extend question sets.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const questionSetId = formData.get('questionSetId') as string;
    const questionsToAdd = parseInt(formData.get('questionsToAdd') as string);
    const materialText = (formData.get('materialText') as string | null) || undefined;

    if (!questionSetId) {
      return NextResponse.json(
        { error: 'Question set ID is required' },
        { status: 400 }
      );
    }

    // Get existing question set
    const existingSet = await getQuestionSetById(questionSetId);

    if (!existingSet) {
      return NextResponse.json(
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
      },
      'Extending existing question set'
    );

    // Process uploaded files with same validation as generate-questions
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
    const MAX_FILES = 2;
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
      return NextResponse.json(
        {
          error: `Maximum ${MAX_FILES} files allowed.`,
        },
        { status: 400 }
      );
    }

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${value.name}" exceeds 2MB limit.` },
            { status: 400 }
          );
        }

        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file type using magic bytes
        const detectedType = await fileTypeFromBuffer(buffer);
        const isTextFile = value.type.startsWith('text/') && !detectedType;

        if (!isTextFile && (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime))) {
          return NextResponse.json(
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
      return NextResponse.json(
        { error: 'Please provide material (text or files)' },
        { status: 400 }
      );
    }

    // STEP 1: Identify topics from material
    logger.info('Step 1: Identifying topics from new material');
    const topicAnalysis = await identifyTopics({
      subject: existingSet.subject,
      grade: existingSet.grade || undefined,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
    });

    logger.info(
      {
        identifiedTopics: topicAnalysis.topics,
        topicCount: topicAnalysis.topics.length,
      },
      'Topics identified successfully'
    );

    // STEP 2: Generate new questions
    logger.info('Step 2: Generating new questions');
    const newQuestions = await generateQuestions({
      subject: existingSet.subject,
      difficulty: existingSet.difficulty,
      questionCount: questionsToAdd,
      grade: existingSet.grade || undefined,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      mode: existingSet.mode || 'quiz',
      identifiedTopics: topicAnalysis.topics,
    });

    if (newQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions were generated. Please try again.' },
        { status: 500 }
      );
    }

    logger.info(
      { questionsGenerated: newQuestions.length },
      'Questions generated successfully'
    );

    // STEP 3: Find max order_index from existing questions
    const supabaseAdmin = getSupabaseAdmin();
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
      },
      'Request completed successfully'
    );

    return NextResponse.json(response, {
      status,
    });
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
    return NextResponse.json(
      {
        error: isProduction
          ? 'Failed to extend question set. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      {
        status: 500,
        status,
      }
    );
  }
}
