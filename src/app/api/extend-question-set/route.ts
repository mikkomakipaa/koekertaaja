import { NextRequest } from 'next/server';
import { handleExtendQuestionSetRequest } from '@/lib/api/extendQuestionSet';

// Configure route segment for Vercel deployment
export const maxDuration = 300; // 5 minutes timeout for AI generation

export async function POST(request: NextRequest) {
  return handleExtendQuestionSetRequest(request);
}
