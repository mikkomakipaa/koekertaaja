/**
 * Read operations for Supabase
 * Safe to import in client components
 */

import { supabase } from './client';
import { QuestionSet, QuestionSetWithQuestions } from '@/types';
import { parseDatabaseQuestion } from '@/types/database';
import { createLogger } from '@/lib/logger';
import { normalizeTopicLabel } from '@/lib/topics/normalization';
import { stripDifficultySuffix } from '@/lib/question-set-name';

const logger = createLogger({ module: 'supabase.queries' });

type QuestionSetSchoolFilter = {
  schoolId?: string;
};

type RecentQuestionSetsOptions = QuestionSetSchoolFilter & {
  limit?: number;
};

type QuestionSetsReadClient = Pick<typeof supabase, 'from'>;

export function normalizeUniqueQuestionTopics(
  rows: Array<{ topic?: string | null }>,
  options?: { context?: string; questionSetId?: string }
): string[] {
  return [
    ...new Set(
      rows
        .map((q) => q.topic)
        .filter((topic): topic is string => typeof topic === 'string' && topic.trim().length > 0)
        .map((topic, index) =>
          normalizeTopicLabel(topic, {
            context: options?.context ?? `queries.getQuestionSetTopics[${index}]`,
            onUnexpectedEnglish: (event) => {
              logger.warn(
                {
                  kind: event.kind,
                  input: event.input,
                  normalized: event.normalized,
                  context: event.context,
                  questionSetId: options?.questionSetId,
                },
                'Unexpected unmapped English topic label encountered when reading topics'
              );
            },
          })
        ),
    ),
  ];
}

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
export async function getRecentQuestionSets(
  limitOrOptions: number | RecentQuestionSetsOptions = 10,
  legacyOptions?: QuestionSetSchoolFilter,
  client: QuestionSetsReadClient = supabase
): Promise<QuestionSet[]> {
  const resolvedLimit =
    typeof limitOrOptions === 'number' ? limitOrOptions : (limitOrOptions?.limit ?? 10);
  const resolvedSchoolId =
    typeof limitOrOptions === 'number'
      ? legacyOptions?.schoolId
      : limitOrOptions?.schoolId;

  let query = client
    .from('question_sets')
    .select('*')
    .eq('status', 'published');

  if (resolvedSchoolId) {
    query = query.eq('school_id', resolvedSchoolId);
  }

  const { data, error } = await query
    .order('exam_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(resolvedLimit);

  if (error) {
    logger.error({ error, schoolId: resolvedSchoolId }, 'Error fetching recent question sets');
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
    logger.error({ error, subject }, 'Error fetching question sets by subject');
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Get all question sets
 * Only returns published question sets
 */
export async function getAllQuestionSets(
  options?: QuestionSetSchoolFilter,
  client: QuestionSetsReadClient = supabase
): Promise<QuestionSet[]> {
  let query = client
    .from('question_sets')
    .select('*')
    .eq('status', 'published');

  if (options?.schoolId) {
    query = query.eq('school_id', options.schoolId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logger.error({ error, schoolId: options?.schoolId }, 'Error fetching all question sets');
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Fetch published question sets for browse-mode pages.
 * Alias kept explicit for route-level readability.
 */
export async function fetchPublishedQuestionSets(
  options?: QuestionSetSchoolFilter,
  client: QuestionSetsReadClient = supabase
): Promise<QuestionSet[]> {
  return getAllQuestionSets(options, client);
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
    logger.error({ error }, 'Error fetching question sets for manage');
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
    logger.error({ error, questionSetId }, 'Error fetching topics');
    return [];
  }

  return normalizeUniqueQuestionTopics(data || [], {
    context: 'queries.getQuestionSetTopics',
    questionSetId,
  });
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
    logger.error({ error }, 'Error fetching created question sets');
    return [];
  }

  return (data || []) as QuestionSet[];
}

/**
 * Find related published flashcard set code for a quiz set code.
 * Matches by subject, grade, and base name without difficulty suffix.
 */
export async function findRelatedFlashcardCode(quizCode: string): Promise<string | null> {
  const normalizedCode = quizCode.trim().toUpperCase();
  if (!normalizedCode) {
    return null;
  }

  const { data: quizSet, error: quizError } = await supabase
    .from('question_sets')
    .select('subject, grade, name')
    .eq('code', normalizedCode)
    .single();

  if (quizError || !quizSet) {
    return null;
  }

  const baseName = stripDifficultySuffix(quizSet.name ?? '');
  if (!baseName || !quizSet.subject || quizSet.grade == null) {
    return null;
  }

  const { data: flashcardCandidates, error: flashcardError } = await supabase
    .from('question_sets')
    .select('code, name')
    .eq('subject', quizSet.subject)
    .eq('grade', quizSet.grade)
    .eq('mode', 'flashcard')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (flashcardError || !flashcardCandidates) {
    if (flashcardError) {
      logger.error(
        { error: flashcardError, quizCode: normalizedCode },
        'Error fetching related flashcard candidates'
      );
    }
    return null;
  }

  for (const candidate of flashcardCandidates) {
    if (!candidate.code || !candidate.name) {
      continue;
    }

    if (stripDifficultySuffix(candidate.name) === baseName) {
      return candidate.code;
    }
  }

  return null;
}

/**
 * Find related published normal quiz set code for a Helppo quiz set code.
 * Matches by subject, grade, and base name without difficulty suffix.
 */
export async function findRelatedNormalCode(helppoCode: string): Promise<string | null> {
  const normalizedCode = helppoCode.trim().toUpperCase();
  if (!normalizedCode) {
    return null;
  }

  try {
    const { data: helppoSet, error: helppoError } = await supabase
      .from('question_sets')
      .select('subject, grade, name')
      .eq('code', normalizedCode)
      .single();

    if (helppoError) {
      logger.error(
        { error: helppoError, helppoCode: normalizedCode },
        'Error fetching Helppo question set for related normal lookup'
      );
      return null;
    }

    if (!helppoSet?.subject || helppoSet.grade == null || !helppoSet.name) {
      return null;
    }

    const baseName = stripDifficultySuffix(helppoSet.name);
    if (!baseName) {
      return null;
    }

    const { data: normalCandidates, error: normalError } = await supabase
      .from('question_sets')
      .select('code, name')
      .eq('subject', helppoSet.subject)
      .eq('grade', helppoSet.grade)
      .eq('mode', 'quiz')
      .eq('difficulty', 'normaali')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (normalError) {
      logger.error(
        { error: normalError, helppoCode: normalizedCode },
        'Error fetching related normal candidates'
      );
      return null;
    }

    for (const candidate of normalCandidates ?? []) {
      if (!candidate.code || !candidate.name) {
        continue;
      }

      if (stripDifficultySuffix(candidate.name) === baseName) {
        return candidate.code;
      }
    }

    return null;
  } catch (error) {
    logger.error(
      { error, helppoCode: normalizedCode },
      'Unexpected error finding related normal code'
    );
    return null;
  }
}
