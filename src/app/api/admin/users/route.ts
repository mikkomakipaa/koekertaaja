import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  const { data: { users }, error: usersError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (usersError) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  // All memberships — a user may belong to multiple schools
  const { data: members, error: membersError } = await admin
    .from('school_members')
    .select('user_id, school_id, role, schools(name, municipality)');

  if (membersError) {
    return NextResponse.json({ error: 'Failed to load memberships' }, { status: 500 });
  }

  const { data: settings } = await admin
    .from('school_settings')
    .select('school_id, anthropic_key_secret_id, openai_key_secret_id');

  // Group memberships by user_id (one user may have many)
  const membersByUserId = new Map<string, any[]>();
  for (const m of members ?? []) {
    const list = membersByUserId.get((m as any).user_id) ?? [];
    list.push(m);
    membersByUserId.set((m as any).user_id, list);
  }

  const settingsBySchoolId = new Map(
    (settings ?? []).map((s: any) => [s.school_id, s])
  );

  const result = users.map((u) => {
    const memberships = membersByUserId.get(u.id) ?? [];
    const schools = memberships.map((m: any) => {
      const s = settingsBySchoolId.get(m.school_id);
      return {
        id: m.school_id,
        name: (m.schools as any)?.name ?? '',
        municipality: (m.schools as any)?.municipality ?? '',
        hasAnthropicKey: Boolean(s?.anthropic_key_secret_id),
        hasOpenaiKey: Boolean(s?.openai_key_secret_id),
      };
    });
    return {
      id: u.id,
      email: u.email ?? '',
      name: (u.user_metadata?.name as string) ?? '',
      createdAt: u.created_at,
      schools,
    };
  });

  return NextResponse.json({ data: result });
}
