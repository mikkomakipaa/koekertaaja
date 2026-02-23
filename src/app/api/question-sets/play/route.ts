import { NextResponse } from 'next/server';
import { createServerClient, verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';

export async function GET(request: Request) {
  try {
    const user = await verifyAuth();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 100;

    const userIsAdmin = user ? isAdmin(user.email || '') : false;
    const supabase = userIsAdmin ? getSupabaseAdmin() : await createServerClient();
    const query = supabase
      .from('question_sets')
      .select('*')
      .order('exam_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 100);

    if (!userIsAdmin) {
      query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load question sets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
