/**
 * Write operations for Supabase
 * SERVER-SIDE ONLY - Uses admin client to bypass RLS
 *
 * IMPORTANT: Never import this file in client components!
 * Only use in API routes and server components.
 */

import { getSupabaseAdmin } from './admin';
import {
  Question,
  QuestionSet,
  SequentialItem,
  isSequentialItemArray,
  isStringArray,
} from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'supabase.write-queries' });

/**
 * Create a new question set with questions
 * Uses admin client to bypass RLS for server-side writes
 */
export async function createQuestionSet(
  questionSet: Omit<QuestionSet, 'id' | 'created_at' | 'updated_at'>,
  questions: Omit<Question, 'id' | 'question_set_id'>[]
): Promise<{ code: string; questionSet: QuestionSet } | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const normalizeSequentialItems = (items: unknown): SequentialItem[] => {
    if (isSequentialItemArray(items)) {
      return items;
    }
    if (isStringArray(items)) {
      return items.map((text) => ({ text }));
    }
    return [];
  };

  // Insert question set using admin client
  const { data: newSet, error: setError } = await supabaseAdmin
    .from('question_sets')
    .insert(questionSet as any)
    .select()
    .single();

  if (setError || !newSet) {
    // Log detailed error info (sanitize sensitive data in production)
    logger.error(
      {
      code: setError?.code,
      message: setError?.message,
      details: setError?.details,
      hint: setError?.hint,
      },
      'Error creating question set'
    );

    return null;
  }

  // Prepare questions for insertion
  const questionsToInsert = questions.map((q, index) => {
    const baseQuestion = {
      question_set_id: (newSet as any).id,
      question_text: q.question_text,
      question_type: q.question_type,
      explanation: q.explanation,
      image_url: q.image_url,
      order_index: index,
      topic: (q as any).topic || null,  // REQUIRED: High-level topic for stratified sampling
      skill: (q as any).skill || null,  // REQUIRED: Skill tag for performance tracking
      subtopic: (q as any).subtopic || null,  // OPTIONAL: Finer-grained subtopic within topic
    };

    switch (q.question_type) {
      case 'multiple_choice':
        return {
          ...baseQuestion,
          correct_answer: (q as any).correct_answer,
          options: (q as any).options,
        };
      case 'fill_blank':
        return {
          ...baseQuestion,
          correct_answer: (q as any).correct_answer,
          options: (q as any).acceptable_answers || null,
        };
      case 'true_false':
        return {
          ...baseQuestion,
          correct_answer: (q as any).correct_answer,
          options: null,
        };
      case 'matching':
        return {
          ...baseQuestion,
          correct_answer: (q as any).pairs,
          options: null,
        };
      case 'short_answer':
        return {
          ...baseQuestion,
          correct_answer: (q as any).correct_answer,
          options: (q as any).acceptable_answers || ((q as any).max_length ? { max_length: (q as any).max_length } : null),
        };
      case 'sequential': {
        const items = normalizeSequentialItems((q as any).items);
        return {
          ...baseQuestion,
          correct_answer: {
            items,
            correct_order: (q as any).correct_order || [],
          },
          options: null,
        };
      }
      default:
        logger.error(
          { questionType: q.question_type, questionPreview: q.question_text?.substring(0, 50) },
          'Unknown question type'
        );
        // For unknown types, try to infer the best match
        // If it has options, treat as multiple choice
        if ((q as any).options && Array.isArray((q as any).options) && (q as any).options.length > 0) {
          return {
            ...baseQuestion,
            question_type: 'multiple_choice',
            correct_answer: (q as any).correct_answer,
            options: (q as any).options,
          };
        }
        // Otherwise treat as short answer
        return {
          ...baseQuestion,
          question_type: 'short_answer',
          correct_answer: (q as any).correct_answer || '',
          options: null,
        };
    }
  });

  // Filter out any undefined/null questions and validate
  const validQuestions = questionsToInsert.filter((q) => {
    if (!q) {
      logger.error('Undefined question found in questionsToInsert');
      return false;
    }
    if (!q.question_text || !q.explanation || q.correct_answer === undefined) {
      logger.error(
        {
        has_question_text: !!q.question_text,
        has_explanation: !!q.explanation,
        has_correct_answer: q.correct_answer !== undefined,
        question_type: q.question_type,
        },
        'Invalid question data'
      );
      return false;
    }

    // Validate multiple_choice questions must have non-empty options
    if (q.question_type === 'multiple_choice') {
      if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
        logger.error(
          {
            questionPreview: q.question_text?.substring(0, 50),
            has_options: !!q.options,
            is_array: Array.isArray(q.options),
            options_length: q.options?.length || 0,
          },
          'Multiple choice question missing options'
        );
        return false;
      }
    }

    return true;
  });

  if (validQuestions.length !== questionsToInsert.length) {
    logger.warn(
      { filteredCount: questionsToInsert.length - validQuestions.length },
      'Filtered out invalid questions'
    );
  }

  if (validQuestions.length === 0) {
    logger.error('No valid questions to insert');
    const admin = getSupabaseAdmin();
    await admin.from('question_sets').delete().eq('id', (newSet as any).id);
    return null;
  }

  const { error: questionsError } = await supabaseAdmin
    .from('questions')
    .insert(validQuestions as any);

  if (questionsError) {
    // Log detailed error info to help diagnose issues
    logger.error(
      {
        code: questionsError?.code,
        message: questionsError?.message,
        details: questionsError?.details,
        hint: questionsError?.hint,
        questionSetId: (newSet as any).id,
        questionCount: questionsToInsert.length,
      },
      'Error creating questions'
    );

    // Log first question sample for debugging (without sensitive data)
    if (questionsToInsert.length > 0) {
      logger.warn(
        {
          question_type: questionsToInsert[0].question_type,
          has_correct_answer: questionsToInsert[0].correct_answer !== undefined,
          correct_answer_type: typeof questionsToInsert[0].correct_answer,
          has_explanation: !!questionsToInsert[0].explanation,
        },
        'Sample question data'
      );
    }

    // Rollback: delete the question set
    const admin = getSupabaseAdmin();
    await admin.from('question_sets').delete().eq('id', (newSet as any).id);
    return null;
  }

  // Update question_count with actual number of questions inserted
  if (validQuestions.length !== questionSet.question_count) {
    logger.info(
      {
        from: questionSet.question_count,
        to: validQuestions.length,
        questionSetId: (newSet as any).id,
      },
      'Updating question_count after insert'
    );
    await (supabaseAdmin as any)
      .from('question_sets')
      .update({ question_count: validQuestions.length })
      .eq('id', (newSet as any).id);

    // Update the returned newSet object with correct count
    (newSet as any).question_count = validQuestions.length;
  }

  return {
    code: (newSet as any).code,
    questionSet: newSet as QuestionSet,
  };
}

/**
 * Delete a question set and all its questions
 * Uses admin client to bypass RLS for server-side deletes
 *
 * Explicitly deletes questions first, then the question set
 */
export async function deleteQuestionSet(questionSetId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  // First, delete all questions for this question set
  const { error: questionsError } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('question_set_id', questionSetId);

  if (questionsError) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      logger.error('Error deleting questions');
    } else {
      logger.error(
        { error: questionsError, questionSetId },
        'Error deleting questions'
      );
    }

    return false;
  }

  // Then delete the question set
  const { error: setError } = await supabaseAdmin
    .from('question_sets')
    .delete()
    .eq('id', questionSetId);

  if (setError) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      logger.error('Error deleting question set');
    } else {
      logger.error(
        { error: setError, questionSetId },
        'Error deleting question set'
      );
    }

    return false;
  }

  return true;
}
