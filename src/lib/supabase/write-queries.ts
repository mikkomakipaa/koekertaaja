/**
 * Write operations for Supabase
 * SERVER-SIDE ONLY - Uses admin client to bypass RLS
 *
 * IMPORTANT: Never import this file in client components!
 * Only use in API routes and server components.
 */

import { getSupabaseAdmin } from './admin';
import { QuestionSet, Question } from '@/types';

/**
 * Create a new question set with questions
 * Uses admin client to bypass RLS for server-side writes
 */
export async function createQuestionSet(
  questionSet: Omit<QuestionSet, 'id' | 'created_at' | 'updated_at'>,
  questions: Omit<Question, 'id' | 'question_set_id'>[]
): Promise<{ code: string; questionSet: QuestionSet } | null> {
  const supabaseAdmin = getSupabaseAdmin();

  // Insert question set using admin client
  const { data: newSet, error: setError } = await supabaseAdmin
    .from('question_sets')
    .insert(questionSet as any)
    .select()
    .single();

  if (setError || !newSet) {
    // Log detailed error info (sanitize sensitive data in production)
    console.error('Error creating question set:', {
      code: setError?.code,
      message: setError?.message,
      details: setError?.details,
      hint: setError?.hint,
    });

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
      default:
        console.error('Unknown question type:', q.question_type, {
          question_text: q.question_text?.substring(0, 50),
        });
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
      console.error('Undefined question found in questionsToInsert');
      return false;
    }
    if (!q.question_text || !q.explanation || q.correct_answer === undefined) {
      console.error('Invalid question data:', {
        has_question_text: !!q.question_text,
        has_explanation: !!q.explanation,
        has_correct_answer: q.correct_answer !== undefined,
        question_type: q.question_type,
      });
      return false;
    }

    // Validate multiple_choice questions must have non-empty options
    if (q.question_type === 'multiple_choice') {
      if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
        console.error('Multiple choice question missing options:', {
          question_text: q.question_text?.substring(0, 50),
          has_options: !!q.options,
          is_array: Array.isArray(q.options),
          options_length: q.options?.length || 0,
        });
        return false;
      }
    }

    return true;
  });

  if (validQuestions.length !== questionsToInsert.length) {
    console.error(`Filtered out ${questionsToInsert.length - validQuestions.length} invalid questions`);
  }

  if (validQuestions.length === 0) {
    console.error('No valid questions to insert');
    const admin = getSupabaseAdmin();
    await admin.from('question_sets').delete().eq('id', (newSet as any).id);
    return null;
  }

  const { error: questionsError } = await supabaseAdmin
    .from('questions')
    .insert(validQuestions as any);

  if (questionsError) {
    // Log detailed error info to help diagnose issues
    console.error('Error creating questions:', {
      code: questionsError?.code,
      message: questionsError?.message,
      details: questionsError?.details,
      hint: questionsError?.hint,
      questionSetId: (newSet as any).id,
      questionCount: questionsToInsert.length,
    });

    // Log first question sample for debugging (without sensitive data)
    if (questionsToInsert.length > 0) {
      console.error('Sample question data:', {
        question_type: questionsToInsert[0].question_type,
        has_correct_answer: questionsToInsert[0].correct_answer !== undefined,
        correct_answer_type: typeof questionsToInsert[0].correct_answer,
        has_explanation: !!questionsToInsert[0].explanation,
      });
    }

    // Rollback: delete the question set
    const admin = getSupabaseAdmin();
    await admin.from('question_sets').delete().eq('id', (newSet as any).id);
    return null;
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
      console.error('Error deleting questions');
    } else {
      console.error('Error deleting questions:', JSON.stringify(questionsError, null, 2));
      console.error('Question set ID:', questionSetId);
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
      console.error('Error deleting question set');
    } else {
      console.error('Error deleting question set:', JSON.stringify(setError, null, 2));
      console.error('Question set ID:', questionSetId);
    }

    return false;
  }

  return true;
}
