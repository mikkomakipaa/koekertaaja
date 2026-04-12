import { NextRequest } from 'next/server';
import { handleExtendQuestionSetRequest } from '@/lib/api/extendQuestionSet';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const requestedCountValue = formData.get('questionCount') ?? formData.get('questionsToAdd');
  const requestedCount = typeof requestedCountValue === 'string'
    ? Number.parseInt(requestedCountValue, 10)
    : Number.NaN;

  if (Number.isFinite(requestedCount) && requestedCount > 20) {
    return Response.json(
      { error: 'Maksimi 20 kysymystä per pyyntö.' },
      { status: 400 }
    );
  }

  return handleExtendQuestionSetRequest({
    formData: async () => formData,
  });
}
