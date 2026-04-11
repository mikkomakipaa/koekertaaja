import { createLogger, serializeError } from '@/lib/logger';
import { QuestionSet, School } from '@/types';

import { supabase } from './client';

const logger = createLogger({ module: 'supabase.schools' });

type SchoolsReadClient = Pick<typeof supabase, 'from'>;

/**
 * List all schools for admin-facing assignment flows.
 */
export async function getAllSchools(client: SchoolsReadClient = supabase): Promise<School[]> {
  try {
    const { data, error } = await client
      .from('schools')
      .select('id, name, municipality, created_at')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error: serializeError(error) }, 'Error fetching all schools');
      return [];
    }

    return ((data || []) as School[]).map((school) => ({
      id: school.id,
      name: school.name,
      municipality: school.municipality ?? null,
      created_at: school.created_at,
    }));
  } catch (error) {
    logger.error({ error: serializeError(error) }, 'Unexpected error fetching all schools');
    return [];
  }
}

/**
 * List schools that have at least one published question set.
 */
export async function getSchools(client: SchoolsReadClient = supabase): Promise<School[]> {
  try {
    const { data, error } = await client
      .from('schools')
      .select('id, name, municipality, created_at')
      .order('name', { ascending: true });

    if (error) {
      logger.error({ error: serializeError(error) }, 'Error fetching schools');
      return [];
    }

    return ((data || []) as School[])
      .filter((school) => school.id && school.name)
      .map((school) => ({
        id: school.id,
        name: school.name,
        municipality: school.municipality ?? null,
        created_at: school.created_at,
      }));
  } catch (error) {
    logger.error({ error: serializeError(error) }, 'Unexpected error fetching schools');
    return [];
  }
}

/**
 * List published question sets for a specific school.
 */
export async function getQuestionSetsBySchool(
  schoolId: string,
  limit?: number,
  client: SchoolsReadClient = supabase
): Promise<QuestionSet[]> {
  try {
    let query = client
      .from('question_sets')
      .select('*')
      .eq('status', 'published')
      .eq('school_id', schoolId)
      .order('exam_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error: serializeError(error), schoolId }, 'Error fetching question sets by school');
      return [];
    }

    return (data || []) as QuestionSet[];
  } catch (error) {
    logger.error(
      { error: serializeError(error), schoolId },
      'Unexpected error fetching question sets by school'
    );
    return [];
  }
}
