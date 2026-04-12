import { redirect } from 'next/navigation';
import CreatePageClient from '@/components/create/CreatePageClient';
import { getSchoolMembershipsForUser } from '@/lib/auth/roles';
import { hasAnySchoolApiKey, getSchoolApiKeyStatus } from '@/lib/school/apiKeyStatus';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/supabase/server-auth';
import type { School } from '@/types';

async function getSchoolsForMemberships(schoolIds: string[]): Promise<School[]> {
  if (schoolIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, municipality, created_at')
    .in('id', schoolIds)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as School[];
}

export default async function CreatePage() {
  const user = await verifyAuth();

  if (!user) {
    redirect('/login?redirect=/create');
  }

  const memberships = await getSchoolMembershipsForUser(user.id);

  if (memberships.length === 0) {
    return (
      <CreatePageClient
        allowedSchools={[]}
        initialSchoolId=""
        schoolMembershipError="Tiliäsi ei ole liitetty kouluun. Ota yhteyttä ylläpitäjään."
      />
    );
  }

  const schools = await getSchoolsForMemberships(
    memberships.map((membership) => membership.school_id)
  );

  if (schools.length === 0) {
    return (
      <CreatePageClient
        allowedSchools={[]}
        initialSchoolId=""
        schoolMembershipError="Tiliäsi ei ole liitetty kouluun. Ota yhteyttä ylläpitäjään."
      />
    );
  }

  if (schools.length === 1) {
    const apiKeyStatus = await getSchoolApiKeyStatus(schools[0].id);

    if (!hasAnySchoolApiKey(apiKeyStatus)) {
      redirect('/setup');
    }

    return (
      <CreatePageClient
        allowedSchools={schools}
        initialSchoolId={schools[0].id}
      />
    );
  }

  // Multi-school: require at least one school to have an API key configured.
  // The user selects the school on the create page itself; the per-school key
  // is validated server-side when the generation request is made.
  const keyStatuses = await Promise.all(
    schools.map((s) => getSchoolApiKeyStatus(s.id))
  );
  const anySchoolHasKey = keyStatuses.some(hasAnySchoolApiKey);

  if (!anySchoolHasKey) {
    redirect('/setup');
  }

  return (
    <CreatePageClient
      allowedSchools={schools}
      initialSchoolId=""
    />
  );
}
