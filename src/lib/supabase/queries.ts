/**
 * Read operations for Supabase
 * Safe to import in client components
 */

import { supabase } from './client';
import { QuestionSet, QuestionSetWithQuestions } from '@/types';
import { parseDatabaseQuestion } from '@/types/database';

/**
 * Get a question set by its code
 * Only returns published question sets
 */
export async function getQuestionSetByCode(
  code: string
): Promise<QuestionSetWithQuestions | null> {
  const { data: questionSet, error: setError } = await supabase
    .from('question_sets')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'published')
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
 * Only returns published question sets
 */
export async function getRecentQuestionSets(limit = 10): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('status', 'published')
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
 * Only returns published question sets
 */
export async function getQuestionSetsBySubject(
  subject: string,
  limit = 20
): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('subject', subject)
    .eq('status', 'published')
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
 * Only returns published question sets
 */
export async function getAllQuestionSets(): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all question sets:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Get all question sets for management (includes drafts and published)
 */
export async function getAllQuestionSetsForManage(): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching question sets for manage:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Get unique topics for a question set (for flashcard topic selection)
 */
export async function getQuestionSetTopics(questionSetId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('topic')
    .eq('question_set_id', questionSetId)
    .not('topic', 'is', null);

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }

  // Extract unique topics
  const topics = [...new Set((data || []).map((q: any) => q.topic).filter(Boolean))];
  return topics as string[];
}

/**
 * Get a question set by ID (server-side only)
 * For extending existing question sets
 */
export async function getQuestionSetById(id: string): Promise<QuestionSet | null> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as QuestionSet;
}

/**
 * Get question sets with status 'created' (not yet published)
 * For management/admin view
 */
export async function getCreatedQuestionSets(limit = 50): Promise<QuestionSet[]> {
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .eq('status', 'created')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching created question sets:', error);
    return [];
  }

  return (data || []) as QuestionSet[];
}
