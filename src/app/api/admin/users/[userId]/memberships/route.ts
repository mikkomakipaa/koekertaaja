import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await context.params;
  const body = await request.json();
  const schoolId = (body as { schoolId?: unknown }).schoolId;

  if (!schoolId || typeof schoolId !== 'string') {
    return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify the school exists
  const { data: school, error: schoolError } = await admin
    .from('schools')
    .select('id')
    .eq('id', schoolId)
    .maybeSingle();

  if (schoolError || !school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  // Verify the user exists
  const { data: { user }, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error } = await admin
    .from('school_members')
    .insert({ user_id: userId, school_id: schoolId, role: 'admin' });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this school' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add membership' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
