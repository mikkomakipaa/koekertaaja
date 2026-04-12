import { NextRequest } from 'next/server';
import { handleExtendQuestionSetRequest } from '@/lib/api/extendQuestionSet';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return handleExtendQuestionSetRequest({
    formData: async () => formData,
  });
}
