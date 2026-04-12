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

  const { data, error } = await admin
    .from('schools')
    .select('id, name, municipality')
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load schools' }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
