import { supabase } from './client';
import { QuestionSet, Question, QuestionSetWithQuestions } from '@/types';
import { parseDatabaseQuestion } from '@/types/database';

/**
 * Get a question set by its code
 */
export async function getQuestionSetByCode(
  code: string
): Promise<QuestionSetWithQuestions | null> {
  const { data: questionSet, error: setError } = await supabase
    .from('question_sets')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (setError || !questionSet) {
    return null;
  }

  const { data: dbQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('question_set_id', (questionSet as any).id)
    .order('order_index', { ascending: true });

  if (questionsError || !dbQuestions) {
    return null;
  }

  const questions = (dbQuestions as any[]).map(parseDatabaseQuestion);

  return {
    ...(questionSet as any),
    questions,
  } as QuestionSetWithQuestions;
}

/**
 * Create a new question set with questions
 */
export async function createQuestionSet(
  questionSet: Omit<QuestionSet, 'id' | 'created_at' | 'updated_at'>,
  questions: Omit<Question, 'id' | 'question_set_id'>[]
): Promise<{ code: string; questionSet: QuestionSet } | null> {
  // Insert question set
  const { data: newSet, error: setError } = await supabase
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

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert as any);

  if (questionsError) {
    console.error('Error creating questions:', questionsError);
    // Rollback: delete the question set
    await supabase.from('question_sets').delete().eq('id', (newSet as any).id);
    return null;
  }

  return {
    code: (newSet as any).code,
    questionSet: newSet as QuestionSet,
  };
}

/**
 * Get recent question sets (for future browse feature)
 */
export async function getRecentQuestionSets(limit = 10): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent question sets:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Search question sets by subject
 */
export async function getQuestionSetsBySubject(
  subject: string,
  limit = 20
): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('subject', subject)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching question sets by subject:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}
