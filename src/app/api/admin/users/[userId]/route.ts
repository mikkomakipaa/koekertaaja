import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;

  // Prevent self-deletion
  const currentUser = await verifyAuth();
  if (currentUser?.id === userId) {
    return NextResponse.json({ error: 'Et voi poistaa omaa tiliäsi.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Find all school memberships so we can clean up vault secrets for every school
  const { data: memberships } = await admin
    .from('school_members')
    .select('school_id')
    .eq('user_id', userId);

  const schoolIds = (memberships ?? []).map((m: any) => m.school_id as string);

  if (schoolIds.length > 0) {
    const { data: settingsRows } = await admin
      .from('school_settings')
      .select('anthropic_key_secret_id, openai_key_secret_id')
      .in('school_id', schoolIds);

    const secretIds = (settingsRows ?? [])
      .flatMap((s: any) => [s.anthropic_key_secret_id, s.openai_key_secret_id])
      .filter(Boolean);

    for (const secretId of secretIds) {
      try {
        await (admin as any).rpc('delete_vault_secret', { secret_id: secretId });
      } catch {
        // Best-effort — vault secret deletion failure should not block user deletion
      }
    }
  }

  // Delete the auth user — cascades school_members (ON DELETE CASCADE)
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: 'Käyttäjän poistaminen epäonnistui.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
