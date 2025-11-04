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
    console.error('Error creating question set:', setError);
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
    console.error('Error creating questions:', questionsError);
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
