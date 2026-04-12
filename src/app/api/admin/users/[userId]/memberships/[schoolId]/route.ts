import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string; schoolId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, schoolId } = await context.params;
  const admin = getSupabaseAdmin();

  // Prevent removing the last membership — user must belong to at least one school
  const { data: memberships } = await admin
    .from('school_members')
    .select('school_id')
    .eq('user_id', userId);

  if ((memberships ?? []).length <= 1) {
    return NextResponse.json(
      { error: 'Käyttäjällä on oltava vähintään yksi kouluun liityntä.' },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from('school_members')
    .delete()
    .eq('user_id', userId)
    .eq('school_id', schoolId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove membership' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
