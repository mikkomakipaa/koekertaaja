/**
 * Read operations for Supabase
 * Safe to import in client components
 */

import { supabase } from './client';
import { QuestionSet, QuestionSetWithQuestions } from '@/types';
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

/**
 * Get all question sets
 */
export async function getAllQuestionSets(): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all question sets:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}
