import { AuthError } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SchoolMember } from '@/types';

/**
 * Resolve all of a user's school memberships via the service-role client.
 */
export async function getSchoolMembershipsForUser(
  userId: string
): Promise<SchoolMember[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('school_members')
    .select('id, user_id, school_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SchoolMember[];
}

/**
 * Resolve a user's school membership via the service-role client.
 * Returns the matching membership row or null when no membership exists.
 */
export async function getSchoolForUser(
  userId: string,
  schoolId?: string
): Promise<SchoolMember | null> {
  const memberships = await getSchoolMembershipsForUser(userId);

  if (memberships.length === 0) {
    return null;
  }

  if (schoolId) {
    return memberships.find((membership) => membership.school_id === schoolId) ?? null;
  }

  return memberships[0] ?? null;
}

/**
 * Require that a user belongs to a school before continuing in a protected flow.
 */
export async function requireSchoolMember(
  userId: string,
  schoolId?: string
): Promise<SchoolMember> {
  const membership = await getSchoolForUser(userId, schoolId);

  if (!membership) {
    throw new AuthError(
      'Forbidden: School membership required',
      403,
      'forbidden'
    );
  }

  return membership;
}
