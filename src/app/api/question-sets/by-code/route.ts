import { NextResponse } from 'next/server';
import { createServerClient, verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import { parseDatabaseQuestion } from '@/types/database';

export async function GET(request: Request) {
  try {
    const user = await verifyAuth();
    const url = new URL(request.url);
    const code = url.searchParams.get('code')?.toUpperCase();
    const includeDrafts = url.searchParams.get('includeDrafts') === '1';

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const userIsAdmin = user ? isAdmin(user.email || '') : false;
    const supabase = userIsAdmin ? getSupabaseAdmin() : await createServerClient();
    const setQuery = supabase
      .from('question_sets')
      .select('*')
      .eq('code', code);

    // Only allow draft access when explicitly requested by an admin.
    if (!userIsAdmin || !includeDrafts) {
      setQuery.eq('status', 'published');
    }

    const { data: questionSet, error: setError } = await setQuery.single();

    if (setError || !questionSet) {
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    const questionsClient =
      userIsAdmin && includeDrafts ? getSupabaseAdmin() : supabase;
    const questionsQuery = questionsClient
      .from('questions')
      .select('*')
      .eq('question_set_id', (questionSet as any).id)
      .order('order_index', { ascending: true });
    const { data: dbQuestions, error: questionsError } = await questionsQuery;

    if (questionsError || !dbQuestions) {
      return NextResponse.json(
        { error: 'Failed to load questions' },
        { status: 500 }
      );
    }

    const questions = (dbQuestions as any[]).map(parseDatabaseQuestion);

    return NextResponse.json({
      data: {
        ...(questionSet as any),
        questions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
