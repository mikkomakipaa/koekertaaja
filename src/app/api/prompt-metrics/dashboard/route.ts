import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import { requireAuth, resolveAuthError } from '@/lib/supabase/server-auth';
import {
  aggregateBySubject,
  aggregateByProvider,
  calculateSummary,
  calculateTimeSeries,
  getProblematicRuns,
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
    const createdBy = searchParams.get('createdBy')?.trim() || 'all';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    let user;
    try {
      user = await requireAuth();
    } catch (authError) {
      const { status, message } = resolveAuthError(authError, {
        unauthorized: 'Unauthorized',
        forbidden: 'Forbidden',
      });
      return NextResponse.json({ error: message }, { status });
    }

    const userIsAdmin = isAdmin(user.email || '');
    let query = getSupabaseAdmin()
      .from('prompt_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (!userIsAdmin) {
      query = query.eq('user_id', user.id);
    } else if (createdBy !== 'all') {
      query = query.eq('user_id', createdBy);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const metrics = (data ?? []) as PromptMetricRow[];
    const sessionCountByUserId = new Map<string, number>();

    for (const metric of metrics) {
      const userId = typeof metric.user_id === 'string' ? metric.user_id : '';
      if (!userId) {
        continue;
      }
      sessionCountByUserId.set(userId, (sessionCountByUserId.get(userId) ?? 0) + 1);
    }

    let creators: Array<{ id: string; label: string; sessionCount: number }> = [];

    if (userIsAdmin && sessionCountByUserId.size > 0) {
      const { data: authUsers, error: usersError } = await getSupabaseAdmin().auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

      if (!usersError) {
        const authUserById = new Map(
          (authUsers.users ?? []).map((authUser) => [
            authUser.id,
            {
              email: authUser.email ?? '',
              name:
                (authUser.user_metadata?.name as string | undefined)?.trim() ||
                (authUser.user_metadata?.full_name as string | undefined)?.trim() ||
                '',
            },
          ])
        );

        creators = Array.from(sessionCountByUserId.entries())
          .map(([id, sessionCount]) => {
            const authUser = authUserById.get(id);
            const label = authUser?.name || authUser?.email || id;

            return {
              id,
              label,
              sessionCount,
            };
          })
          .sort((a, b) => b.sessionCount - a.sessionCount || a.label.localeCompare(b.label, 'fi'));
      }
    }

    const problematicRuns = getProblematicRuns(metrics);
    const questionSetIds = problematicRuns
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
      recentFailures: problematicRuns.map((run) => ({
        ...run,
        questionSetCode: run.question_set_id
          ? codeByQuestionSetId.get(run.question_set_id) ?? null
          : null,
      })),
      bySubject: aggregateBySubject(metrics),
      creators,
      selectedCreatedBy: userIsAdmin ? createdBy : user.id,
      canFilterByCreator: userIsAdmin,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
