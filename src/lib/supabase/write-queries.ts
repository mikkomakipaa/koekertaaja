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
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('Error creating question set');
    } else {
      console.error('Error creating question set:', JSON.stringify(setError, null, 2));
      console.error('Attempted to insert:', JSON.stringify(questionSet, null, 2));
    }

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
          options: (q as any).max_length ? { max_length: (q as any).max_length } : null,
        };
    }
  });

  const { error: questionsError } = await supabaseAdmin
    .from('questions')
    .insert(questionsToInsert as any);

  if (questionsError) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('Error creating questions');
    } else {
      console.error('Error creating questions:', JSON.stringify(questionsError, null, 2));
      console.error('Attempted to insert questions count:', questionsToInsert.length);
      if (questionsToInsert.length > 0) {
        console.error('First question sample:', JSON.stringify(questionsToInsert[0], null, 2));
      }
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
 * Note: Questions are automatically deleted via CASCADE in the database
 */
export async function deleteQuestionSet(questionSetId: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();

  // Delete the question set (questions will be deleted via CASCADE)
  const { error } = await supabaseAdmin
    .from('question_sets')
    .delete()
    .eq('id', questionSetId);

  if (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('Error deleting question set');
    } else {
      console.error('Error deleting question set:', JSON.stringify(error, null, 2));
      console.error('Question set ID:', questionSetId);
    }

    return false;
  }

  return true;
}
