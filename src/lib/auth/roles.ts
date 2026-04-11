import { createServerClient } from '@/lib/supabase/server-auth';

type SchoolMembershipRow = {
  school_id: string | null;
};

/**
 * Resolve the authenticated user's school from school_members.
 * Returns null when the user has no school membership.
 */
export async function getSchoolForUser(userId: string): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('school_members')
    .select('school_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle<SchoolMembershipRow>();

  if (error) {
    throw error;
  }

  return data?.school_id ?? null;
}
