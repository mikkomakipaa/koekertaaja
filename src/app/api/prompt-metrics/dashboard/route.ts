import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import {
  aggregateByPromptVersion,
  aggregateByProvider,
  calculateSummary,
  calculateTimeSeries,
  getRecentFailures,
} from '@/lib/metrics/promptMetrics';
import type { PromptMetricRow } from '@/types/database';

function parseDays(timeRange: string | null): number {
  if (timeRange === '30d') return 30;
  if (timeRange === '90d') return 90;
  return 7;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAgo = parseDays(searchParams.get('timeRange'));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = isAdmin(user.email || '');
    let query = getSupabaseAdmin()
      .from('prompt_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (!userIsAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const metrics = (data ?? []) as PromptMetricRow[];

    const recentFailures = getRecentFailures(metrics);
    const questionSetIds = recentFailures
      .map((metric) => metric.question_set_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
    const codeByQuestionSetId = new Map<string, string>();

    if (questionSetIds.length > 0) {
      const { data: sets } = await getSupabaseAdmin()
        .from('question_sets')
        .select('id, code')
        .in('id', questionSetIds);
      for (const set of sets ?? []) {
        codeByQuestionSetId.set(String((set as any).id), String((set as any).code));
      }
    }

    return NextResponse.json({
      summary: calculateSummary(metrics),
      timeSeries: calculateTimeSeries(metrics, daysAgo),
      byProvider: aggregateByProvider(metrics),
      recentFailures: recentFailures.map((failure) => ({
        ...failure,
        questionSetCode: failure.question_set_id
          ? codeByQuestionSetId.get(failure.question_set_id) ?? null
          : null,
      })),
      byPromptVersion: aggregateByPromptVersion(metrics),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
