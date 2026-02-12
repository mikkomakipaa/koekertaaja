import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { QuestionSet } from '@/types';

export async function GET() {
  try {
    await requireAuth();

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch question sets
    const { data: questionSets, error } = await supabaseAdmin
      .from('question_sets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load question sets' },
        { status: 500 }
      );
    }

    // For each question set, fetch question type distribution
    const typedQuestionSets = (questionSets || []) as QuestionSet[];
    const setsWithDistribution = await Promise.all(
      typedQuestionSets.map(async (set) => {
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('question_type')
          .eq('question_set_id', set.id);

        // Count question types
        const typeDistribution: Record<string, number> = {};
        if (questions) {
          (questions as Array<{ question_type: string }>).forEach((q) => {
            typeDistribution[q.question_type] = (typeDistribution[q.question_type] || 0) + 1;
          });
        }

        return {
          ...set,
          type_distribution: typeDistribution,
        };
      })
    );

    return NextResponse.json({ data: setsWithDistribution });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
